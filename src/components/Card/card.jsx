import React, {Component} from 'react';
import {connect} from 'react-redux';
import ReactMarkdown from 'react-markdown';
import cx from 'classnames';

import TerraCard from 'terra-card';
import Text from 'terra-text';
import Button from 'terra-button';

import styles from './card.css';
import retrieveLaunchContext from '../../retrieve-data-helpers/launch-context-retrieval';
import { getServicesByHook, getCardsFromServices } from '../../reducers/helpers/services-filter';

export class Card extends Component {
  constuctor() {
    this.takeSuggestion = this.takeSuggestion.bind(this);
    this.launchLink = this.launchLink.bind(this);
    this.renderSource = this.renderSource.bind(this);
  }
  
  // TODO: Perform logic to add suggestion and make necessary changes to app state
  takeSuggestion(suggestion) {
    console.log("Taking a suggestion");
  }

  /**
   * Prevent the source link from opening in the same tab
   * @param {*} e - Event emitted when source link is clicked
   */
  launchSource(e) { 
    e.preventDefault(); 
  }

  /**
   * Open the absolute or SMART link in a new tab and display an error if a SMART link does not have
   * appropriate launch context if used against a secured FHIR endpoint.
   * @param {*} e - Event emitted when link is clicked
   * @param {*} link - Link object that contains the URL and any error state to catch
   */
  launchLink(e, link) {
    e.preventDefault();
    if (link.error) {
      // TODO: Create an error modal to display for SMART link that cannot be launched securely
      return;
    }
    window.open(link.url, '_blank');
  }

  /**
   * For SMART links, modify the link URLs as this component processes them according to two scenarios:
   * 1 - Secured: Retrieve a launch context for the link and append a launch and iss parameter for use against secured endpoints
   * 2 - Open: Append a fhirServiceUrl and patientId parameter to the link for use against open endpoints 
   * @param {*} card - Card object to process the links for
   */
  modifySmartLaunchUrls(card) {
    return card.links.map((link) => {
      if (link.type === 'smart' && this.props.fhirAccessToken) {
        retrieveLaunchContext(link).then((result) => {
          return result;
        });
      } else if (link.type === 'smart') {
        if (link.url.indexOf('?') < 0) {
          link.url += '?';
        } else {
          link.url += '&';
        }
        link.url += `fhirServiceUrl=${this.props.fhirServerUrl}`;
        link.url += `&patientId=${this.props.patientId}`;
      }
      return link;
    });
  }

  /**
   * Helper function to build out the UI for the source of the Card
   * @param {*} source - Object as part of the card to build the UI for
   */
  renderSource(source) {
    if (!source.label) return;
    let icon;
    if (source.icon) {
      icon = <img src={source.icon} alt="Could not fetch icon" width="100" height="100" />;
    }

    return (<div className={styles['card-source']}>
      Source: <a href={source.url || '#'} onClick={e => this.launchSource(e)}>{source.label}</a>
      {icon}
    </div>);
  }

  render() {
    const indicators = {
      info: 0,
      warning: 1,
      'hard-stop': 2,
      error: 3,
    };

    const summaryColors = {
      info: '#0079be',
      warning: '#ffae42',
      'hard-stop': '#c00',
      error: '#333',
    }
    const renderedCards = [];
    // Iterate over each card in the cards array
    this.props.cardResponses.cards
    .sort((b, a) => indicators[a.indicator] - indicators[b.indicator])
    .forEach((c, cardInd) => {
      const card = JSON.parse(JSON.stringify(c));

      // -- Summary --
      let summarySection = <Text fontSize={18} weight={700} color={summaryColors[card.indicator]}>{card.summary}</Text>

      // -- Source --
      let sourceSection = card.source && Object.keys(card.source).length ? this.renderSource(card.source) : '';

      // -- Detail --
      let detailSection = card.detail ? <ReactMarkdown source={card.detail} /> : '';

      // -- Suggestions --
      let suggestionsSection;
      if (card.suggestions) {
        suggestionsSection = card.suggestions.map((item, ind) => {
          return (
            <Button key={ind} 
                    onClick={() => this.takeSuggestion(item)} 
                    text={item.label} 
                    variant={Button.Opts.Variants.EMPHASIS} />
          );
        });
      }

      // -- Links --
      let linksSection;
      if (card.links) {
        card.links = this.modifySmartLaunchUrls(card);
        linksSection = card.links.map((link, ind) => {
          return (
            <Button key={ind} 
                    onClick={e => this.launchLink(e, link)} 
                    text={link.label} 
                    variant={Button.Opts.Variants['DE-EMPHASIS']} />
          );
        });
      }
      
      const classes = cx(styles['decision-card'], styles.alert, styles[`alert-${card.indicator}`]);

      renderedCards.push(
        <TerraCard key={cardInd} className={classes}>
          {summarySection}
          {sourceSection}
          {detailSection}
          <div className={styles['suggestions-section']}>
            {suggestionsSection}
          </div>
          <div className={styles['links-section']}>
            {linksSection}
          </div>
        </TerraCard>
      );
    });
    if (renderedCards.length === 0) return <div>No Cards</div>;
    return <div>{renderedCards}</div>
  }
}

const mapStateToProps = (store) => {
  return {
    cardResponses: getCardsFromServices(Object.keys(
      getServicesByHook(store.hookState.currentHook, store.cdsServicesState.configuredServices))),
    fhirServerUrl: store.fhirServerState.currentFhirServer,
    fhirAccessToken: store.fhirServerState.accessToken,
    patientId: store.patientState.currentPatient.id,
  }
};

export default connect(mapStateToProps)(Card);
