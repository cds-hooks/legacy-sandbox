import ActionTypes from '../actions/ActionTypes'
import DateStore from './DateStore'
import DrugStore from './DrugStore'
import HookStore from './HookStore'
import FhirServerStore from './FhirServerStore'
import moment from 'moment'
import CDS_SMART_OBJ from '../../smart_authentication'

var assign = require('object-assign')
var AppDispatcher = require('../dispatcher/AppDispatcher')
var EventEmitter = require('events').EventEmitter
var Immutable = require('immutable')
var DecisionStore = null

FhirServerStore.addChangeListener(_rxChanged)
DrugStore.addChangeListener(_rxChanged)
DateStore.addChangeListener(_rxChanged)

function _rxChanged() {

  var props = {
    dates: DateStore.getDates(),
    drug: DrugStore.getState(),
    fhirServer: FhirServerStore.getState()
  }

  var resource = toFhir(props)
  DecisionStore.setActivityState('medication-prescribe', resource)
}

function toFhir(props) {
  // Use to check if FHIR server is STU3, otherwise construct MedicationOrder/Request resource based on DSTU2 spec
  var isSTU3 = CDS_SMART_OBJ.fhirVersion === '3.0.1';
  var resource = {
    "resourceType": isSTU3 ? "MedicationRequest" : "MedicationOrder"
  };
  resource[`${isSTU3 ? 'authoredOn': 'dateWritten'}`] = moment().format("YYYY-MM-DD");
  var startDate, endDate;
  if (props.dates.start && props.dates.start.enabled)
    startDate= moment(props.dates.start.value).format("YYYY-MM-DD")
  if (props.dates.end && props.dates.end.enabled)
    endDate = moment(props.dates.end.value).format("YYYY-MM-DD")

  resource.status = "draft";
  resource[`${isSTU3 ? 'subject' : 'patient'}`] = {
    "reference": "Patient/" + props.fhirServer.getIn(['context', 'patient'])
  };
  if (props.drug && props.drug.get('step') === "done") {
    var freqs = {
      'daily': 1,
      'bid': 2,
      'tid': 3,
      'qid': 4
    }

    if (props.drug.get('sig')) {
      var sig = props.drug.get('sig').toJS();
      resource.dosageInstruction = [{
        doseQuantity: {
          value: sig.number,
          system: "http://unitsofmeasure.org",
          code: "{pill}"
        },
        timing: {
          repeat: {
            frequency: freqs[sig.frequency],
            period: 1,
          }
        }
      }];
      resource.dosageInstruction[0].timing.repeat[`${isSTU3 ? 'periodUnit' : 'periodUnits'}`] = "d";
      if (startDate || endDate){
        resource.dosageInstruction[0].timing.repeat.boundsPeriod = {
          start: startDate,
          end: endDate
        }
      }
    }

    var med = props.drug.getIn(['decisions', 'prescribable']).toJS();

    resource.medicationCodeableConcept = {
      "text": med.str,
      "coding": [{
        "display": med.str,
        "system": "http://www.nlm.nih.gov/research/umls/rxnorm",
        "code": med.cui
      }]
    }
  }

  var reason = FhirServerStore.getSelectionAsFhir()
  if (reason) {
    resource[`${isSTU3 ? 'reasonCode' : 'reasonCodeableConcept'}`] = reason;
  }
  return Immutable.fromJS(resource)
}


var MedicationPrescribeStore = assign({}, EventEmitter.prototype, {
  getState: function() {
    return state
  },

  register(ds){
    DecisionStore = ds
    return this
  },

  processChange: function(){
    _rxChanged()
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

var state = Immutable.Map({
  'hook': 'medication-prescribe',
  'fhir': {},
  'hookStore': MedicationPrescribeStore
})

module.exports = MedicationPrescribeStore
