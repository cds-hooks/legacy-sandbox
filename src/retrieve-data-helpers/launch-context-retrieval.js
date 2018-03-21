import axios from 'axios';

function retrieveLaunchContext(link, accessToken, patientId, fhirBaseUrl) {
  return new Promise((resolve, reject) => {
    const headers = {
      Accept: 'application/json',
      Authorization: `Bearer ${accessToken.access_token}`,
    };

    const launchParameters = {
      patient: patientId,
    };

    if (link.appContext) {
      launchParameters.appContext = link.appContext;
    }
    const newLink = Object.assign({}, link);

    // May change when the launch context creation endpoint becomes a standard endpoint for all EHR providers
    axios({
      method: 'post',
      url: `${fhirBaseUrl}/_services/smart/Launch`,
      headers,
      data: {
        launchUrl: link.url,
        parameters: launchParameters,
      },
    }).then((result) => {
      if (result.data && result.data.launch_id) {
        if (newLink.url.indexOf('?') < 0) {
          newLink.url += '?';
        } else {
          newLink.url += '&';
        }
        newLink.url += `launch=${result.data.launch_id}`;
        newLink.url += `&iss=${fhirBaseUrl}`;
        return resolve(newLink);
      }
      console.error('FHIR server endpoint did not return a launch_id to launch the SMART app. See network calls to the Launch endpoint for more details');
      newLink.error = true;
      return reject(newLink);
    }).catch((err) => {
      console.error('Cannot grab launch context from the FHIR server endpoint to launch the SMART app. See network calls to the Launch endpoint for more details', err);
      newLink.error = true;
      return reject(newLink);
    });
  });
}

export default retrieveLaunchContext;
