import React, {Component} from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import map from 'lodash/map'

import Modal from 'terra-modal';
import Button from 'terra-button';
import Dialog from 'terra-dialog';
import Text from 'terra-text';

import styles from './configure-services.css';
import BaseEntryBody from '../BaseEntryBody/base-entry-body';
import ServiceDisplay from './ServiceDisplay/service-display';
import { toggleService, deleteService } from '../../actions/cds-services-actions'

const propTypes = {
  closePrompt: PropTypes.func,
  isOpen: PropTypes.bool,
};

export class ConfigureServices extends Component {
  constructor(props) {
    super(props);

    this.state = {
      isOpen: this.props.isOpen,
    }

    this.handleCloseModal = this.handleCloseModal.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.isOpen !== nextProps.isOpen) {
      this.setState({ isOpen: nextProps.isOpen });
    }
  }

  handleCloseModal() {
    this.setState({ isOpen: false });
    if (this.props.closePrompt) this.props.closePrompt();
  }

  render() {
    const headerContainer = (
      <Text weight={700} fontSize={20}>Configure CDS Services</Text>
    );

    const footerContainer = (<div className={styles['right-align']}>
      <Button text="Cancel" onClick={this.handleCloseModal} />
    </div>);

    return (
      <div>
        <Modal ariaLabel="Configure CDS Services" 
               isOpen={this.state.isOpen}
               closeOnEsc={true}
               closeOnOutsideClick={true} 
               onRequestClose={this.handleCloseModal} 
               isFullscreen={true} >
          <Dialog header={headerContainer} 
                  footer={footerContainer} 
                  onClose={this.handleCloseModal}>
            {map(this.props.services, (service, ind) => {
              return <ServiceDisplay definition={service}
                                     serviceUrl={ind} 
                                     key={ind}/>
            })}
          </Dialog>
        </Modal>
      </div>
    );
  }
}

const mapStateToProps = (store) => {
  return {
    services: store.cdsServicesState.configuredServices,
  }
};

export default connect(mapStateToProps)(ConfigureServices);