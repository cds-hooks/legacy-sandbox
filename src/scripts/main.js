require('!style-loader!css-loader!sass-loader!../assets/stylesheets/style.scss');

// TODO: Require assets here.
// require('../assets/images/product.png');
require('!style-loader!css-loader!codemirror/lib/codemirror.css');
require('!style-loader!css-loader!codemirror/addon/lint/lint.css');


import App from './components/App.js';
import React from 'react';
import ReactDOM from 'react-dom';
import CDS_SMART_OBJ from '../smart_authentication.js';
import querystring from 'querystring';
import FhirServerStore from './stores/FhirServerStore';
import axios from 'axios';
import $ from 'jquery';
import HookStore from './stores/HookStore';


CDS_SMART_OBJ.fetchContext().then(
  () => {
    if (CDS_SMART_OBJ.accessToken &&
      CDS_SMART_OBJ.accessToken.hasOwnProperty('patient')
      && CDS_SMART_OBJ.hasOwnProperty('fhirBaseUrl')) {
      var fhirContext = {};
      fhirContext.patient = CDS_SMART_OBJ.accessToken.patient;
      fhirContext.baseUrl = CDS_SMART_OBJ.fhirBaseUrl;
      fhirContext.user = CDS_SMART_OBJ.smartObj.userId;
      FhirServerStore.setContext(fhirContext);
    }

    $.when((() => {
      if (CDS_SMART_OBJ.accessToken && CDS_SMART_OBJ.accessToken.serviceDiscoveryURL) {
        return HookStore.checkAndStoreValidService(
          CDS_SMART_OBJ.accessToken.serviceDiscoveryURL,
          $.Deferred()
        );
      }
    })())
    .then(() => {
      CDS_SMART_OBJ.processedContext = true;
      ReactDOM.render(<App/>, document.getElementById('react-wrapper'));
    });
  }, () => {
    var qs = querystring.parse(window.location.search.slice(1));
    var fhirBaseUrl = qs.fhirServiceUrl || runtime.FHIR_URL;

    function renderApp() {
      var user;
      if (fhirBaseUrl === 'https://api.hspconsortium.org/cdshooksdstu2/open') {
        user = 'Practitioner/COREPRACTITIONER1';
      }
      var fhirContext = {
        patient: qs.patientId || "SMART-1288992",
        baseUrl: fhirBaseUrl,
        user: user
      }
      FhirServerStore.setContext(fhirContext, true);
      CDS_SMART_OBJ.processedContext = true;
      ReactDOM.render(<App/>, document.getElementById('react-wrapper'));
    }

    axios({
      method: 'get',
      url: `${fhirBaseUrl}/metadata`,
      headers: {'Accept': 'application/json+fhir'}
    }).then((result) => {
      if (result.data && result.data.fhirVersion) {
        CDS_SMART_OBJ.fhirVersion = result.data.fhirVersion;
      }
      renderApp();
    }).catch(() => {
      // Set to default FHIR server version
      CDS_SMART_OBJ.fhirVersion = '1.0.2';
      renderApp();
    });
  }
);
