import React from 'react'
import ReactMarkdown from 'react-markdown';
import axios from 'axios';

import AppDispatcher from '../dispatcher/AppDispatcher'
import ActionTypes from '../actions/ActionTypes'
import striptags from 'striptags'
import CDS_SMART_OBJ from '../../smart_authentication';
import DecisionStore from '../stores/DecisionStore';

const URL = require('url-parse');

window.addEventListener("message", (e) => {
  var url = window.location;
  var redirectUrl = new URL(e.data);
  var hookInstance = redirectUrl.hash.slice(1, redirectUrl.hash.length);
  if (CDS_SMART_OBJ.processedContext && DecisionStore.getState().get('cardLinkInvoked')) {
    AppDispatcher.dispatch({
      type: ActionTypes.EXTERNAL_APP_RETURNED,
      hookInstance: hookInstance
    });
  }
  if (e.origin !== `${url.protocol}//${url.host}` || redirectUrl.pathname === '/service-done.html') {
    e.source.close();
  }
});


var indicators = {
  info: 0,
  warning: 1,
  'hard-stop': 2,
  error: 3
}

const Cards = React.createClass({
  componentWillReceiveProps(nextProps) {},
  takeSuggestion(suggestion) {
    console.log("TAke", suggestion);
    AppDispatcher.dispatch({
      type: ActionTypes.TAKE_SUGGESTION,
      suggestion: suggestion
    })
  },

  launchService(e, link) {
    e.preventDefault();
    if (link.error) {
      this.props.toggleLaunchErrorModal();
      return;
    }
    AppDispatcher.dispatch({
      type: ActionTypes.INVOKE_CARD_LINK
    });
    window.open(link.url, '_blank');
  },

  toggleClickedLinks(e) {
    e.preventDefault();
  },

  retrieveLaunchContext(link) {
    const headers = {
      Accept: 'application/json',
      Authorization: `Bearer ${CDS_SMART_OBJ.accessToken.access_token}`
    };

    let parameters = {
      patient: this.props.context.get('patient')
    };
    if (link.appContext) {
      parameters.appContext = link.appContext;
    }

    return axios({
      method: 'post',
      url: `${this.props.context.get('baseUrl')}/_services/smart/Launch`,
      headers,
      data: {
        launchUrl: link.url,
        parameters
      }
    })
  },

  modifySmartLaunchUrls(card) {
    return card.links.map(l => {
      if ("smart" === l.type && !CDS_SMART_OBJ.accessToken) {
        if (l.url.indexOf("?") < 0) l.url += "?";
        else l.url += "&";
        l.url += "fhirServiceUrl=" + this.props.context.get('baseUrl');
        l.url += "&patientId=" + this.props.context.get('patient');
      }
      else if ("smart" === l.type && CDS_SMART_OBJ.accessToken) {
        this.retrieveLaunchContext(l).then((result) => {
          if (result.data && result.data["launch_id"]) {
            if (l.url.indexOf("?") < 0) l.url += "?";
            else l.url += "&";
            l.url += "launch=" + result.data["launch_id"];
            l.url += "&iss=" + this.props.context.get('baseUrl');
            return l;
          }
          throw new Error();
        }).catch(() => {
          console.error("Cannot grab launch context from the FHIR server endpoint to launch the SMART application. See network calls to the Launch endpoint for more details");
          l.error = true;
          return l;
        });
      }
      return l;
    });
  },

  render() {
    function source(s) {
      if (!s || !s.label) return
      var icon = '';
      if (s.icon) {
        icon = <img src={s.icon} alt="Could not fetch icon" width="100" height="100" />
      }

      return (
        <div className="card-source">
          Source: <a href={s.url || "#"} onClick={e => this.toggleClickedLinks(e)}> {s.label}</a>
          {icon}
        </div>
      );
    }
    var cards = this.props.decisions.get('cards')
      .sort((b, a) => indicators[a.indicator] - indicators[b.indicator])
      .filter(c=>c.summary)
      .map(c => {
        var card = JSON.parse(JSON.stringify(c));
        var classes = "decision-card alert alert-" + card.indicator;
        if (card.links) {
          card.links = this.modifySmartLaunchUrls(card);
        }
        return (
          <div key={card.key} className={classes}>
            <div className="card-top">
              <h5 className="card-summary">{card.summary}</h5>
              {source(card.source)}
              {card.detail && <ReactMarkdown softBreak="br" source={card.detail}/>}
              <div>
                {card.suggestions.map(l => (
                  <button key={l.key} onClick={e => this.takeSuggestion(l)} className="btn btn-wired btn-sm">
                    <span className="glyphicon glyphicon-edit" aria-hidden="true" />
                    {l.label}
                  </button>
                ))}
                {card.links.map(l => (
                    <a key={l.key} className="source-link fake-link" onClick={e => this.launchService(e, l)}>
                      <span className="glyphicon glyphicon-link" aria-hidden="true" />
                      {l.label}
                    </a>
                  ))}
              </div>
            </div>
          </div>
        );
      });
      if (this.props.decisions.get('calling') && cards.count() == 0) {
        return (<div>Loading cards...</div>)
      }
      else if (cards.count() == 0) {
        return (<div>No cards</div>)
      }

      return (<div>{cards}</div>)
    },

  });

  module.exports = Cards
