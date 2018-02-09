import axios from 'axios'
import ActionTypes from '../actions/ActionTypes'
import moment from 'moment'
import { getIn, paramsToJson } from '../../../mock-cds-backend/utils.js';
import CDS_SMART_OBJ from '../../smart_authentication';
import $ from 'jquery';

var AppDispatcher = require('../dispatcher/AppDispatcher')
var EventEmitter = require('events').EventEmitter
var assign = require('object-assign')
var Immutable = require('immutable')

var CHANGE_EVENT = 'change'

var defer = function() {
  var ret = {};
  ret.promise = new Promise(function(resolve, reject) {
    ret.resolve = resolve;
    ret.reject = reject;
  })
  return ret;
}
var adapter = {
  defer: defer,
  http: axios
}
var fhir = require('../../../vendor/fhir')
var fhirClient = function(config) {
  return fhir(config, adapter)
}

var _client;

function setUser(client) {
  var trueFhirObj;
  if (client) {
    trueFhirObj = client;
  } else {
    trueFhirObj = (CDS_SMART_OBJ.hasOwnProperty('smartObj')) ? CDS_SMART_OBJ.smartObj.api : _client;
  }
  trueFhirObj.read({
    type: 'Practitioner',
    id: 'COREPRACTITIONER1'
  }).then(result => {
    if (result.data && result.data.resourceType === 'Practitioner') {
      state = state.setIn(['context', 'user'], 'Practitioner/COREPRACTITIONER1');
    } else {
      state = state.setIn(['context', 'user'], 'Practitioner/example');
    }
  }).catch(() => {
    state = state.setIn(['context', 'user'], 'Practitioner/example');
  });
}

function _fetchData() {
  console.log("Will get stat efor ",  state.getIn(['context', 'patient']))
  var trueFhirObj = (CDS_SMART_OBJ.hasOwnProperty('smartObj')) ? CDS_SMART_OBJ.smartObj.api : _client;
  var original = state;
  var deferObj = $.Deferred();
  function fhirSearch() {
    trueFhirObj.read({
      type: 'Patient',
      id: state.getIn(['context', 'patient'])
    }).then(b => {
      state = state.set('patient', b.data);
      trueFhirObj.search({
        type: 'Condition',
        query: {
          patient: state.getIn(['context', 'patient'])
        }
      }).then(c => {
        // Filter conditions found so only unique and valid conditions are set on the state
        if (c && c.data && c.data.entry) {
          var data = c.data.entry;
          var codeObjArray = [];
          var filteredConditions = data.filter((item) => {
            var resource = item.resource;
            var hasAppropriateCode = resource && resource.code && resource.code.coding &&
              resource.code.coding[0] && resource.code.coding[0].code;
            if (hasAppropriateCode) {
              var isDuplicate =  codeObjArray.indexOf(resource.code.coding[0].code);
              if (isDuplicate < 0) {
                codeObjArray.push(resource.code.coding[0].code);
                return true;
              }
              return false;
            }
            return false;
          });
          state = state.set('conditions', filteredConditions);
        } else {
          state = state.set('conditions', []);
        }
      });
      console.log("Got patient", b.data);
      return deferObj.resolve(state);
    });
    if (!state.getIn(['context', 'user'])) {
      setUser();
    }
  }

  function fhirPromise() {
    fhirSearch();
    return deferObj.promise();
  }

  fhirPromise().then((state) => {
    if (!Immutable.is(original, state)) {
      FhirServiceStore.emitChange();
    }
  });
}

function _checkValidPatient(patientID, dfd) {
  var trueFhirObj = (CDS_SMART_OBJ.hasOwnProperty('smartObj')) ? CDS_SMART_OBJ.smartObj.api : _client;
  trueFhirObj.read({
    type: 'Patient',
    id: patientID
  }).then(response => {
    return dfd.resolve(response.status);
  }, response => {
    if (CDS_SMART_OBJ.hasOwnProperty('smartObj')) {
      return dfd.resolve(response.data.status);
    }
    return dfd.resolve(response.status);
  });
  return dfd.promise();
}

function _checkValidFhirServer(serverUrl, dfd) {
  var tempState = state.set("context", state.get("context").merge({ baseUrl: serverUrl }));
  var tempClient = fhirClient(tempState.get("context").toJS());
  tempClient.conformance({}).then(response => {
    return dfd.resolve(response);
  }).catch(response => {
    console.log("Error fetching metadata for requested FHIR server", response);
    return dfd.resolve(response);
  });
  return dfd.promise();
}


var state = Immutable.fromJS({
  "context": {
    mock: true,
    conditions: []
  },
  "condition": [],
  "patient": null,
  "selection": null
})


var FhirServiceStore = assign({}, EventEmitter.prototype, {
  setContext: function(fhirContext, defaultFhirServer) {
    state = state.set('context', state.get('context').merge(fhirContext))
    if (defaultFhirServer) {
      _client = fhirClient(state.get('context').toJS())
    }
    _fetchData();
    this.emitChange();
  },
  getState: function() {
    return state
  },

  getStateToPublish() {
    var ret = {}
    if (state.get('selection')) {
      ret.reason =  state.get('selection')
    }
    return ret
  },
  getSelectionAsFhir() {
    if (!state.get('conditions')) return null;
    if (!state.get('selection')) return null;
    var match = state
      .get('conditions')
      .map(c=>c.resource.code)
      .filter(c=> c.coding[0].code === state.get('selection'))
    if (match.length > 0)
      return match[0]
  },
  checkPatientResponse(patientID, dfd) {
   return _checkValidPatient(patientID, dfd)
  },

  checkFhirServerResponse(serverUrl, dfd) {
    if (!CDS_SMART_OBJ.hasOwnProperty('smartObj')) {
      return _checkValidFhirServer(serverUrl, dfd);
    }
  },

  changeFhirServer(serverUrl) {
    if (!CDS_SMART_OBJ.hasOwnProperty('smartObj')) {
      state = state.set("context", state.get("context").merge({ baseUrl: serverUrl }));
      _client = fhirClient(state.get('context').toJS());
      setUser(_client);
      this.emitChange();
    }
  },

  emitChange: function() {
    this.emit(CHANGE_EVENT)
  },

  /**
   * @param {function} callback
   */
  addChangeListener: function(callback) {
    this.on(CHANGE_EVENT, callback)
  },

  /**
   * @param {function} callback
   */
  removeChangeListener: function(callback) {
    this.removeListener(CHANGE_EVENT, callback)
  }

})

FhirServiceStore.dispatchToken = AppDispatcher.register(function(action) {

  switch (action.type) {
    case ActionTypes.PICK_CONDITION:
      state= state.set('selection', action.selection)
      FhirServiceStore.emitChange()
      break
    case ActionTypes.NEW_HASH_STATE:
      var hash = action.hash
      var selection = hash.reason;
      if (selection){
        state = state.set('selection', selection)
        FhirServiceStore.emitChange()
      }
      break;
    case ActionTypes.CHANGE_FHIR_SERVER:
      FhirServiceStore.changeFhirServer(action.url);
      break;
    default:
  }

})

module.exports = FhirServiceStore
