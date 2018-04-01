import React, {Component} from 'react';
import {connect} from 'react-redux';
import PropTypes from 'prop-types';

import Text from 'terra-text';
import Button from 'terra-button';
import Checkbox from 'terra-form-checkbox';

import styles from './service-display.css';
import { toggleService, deleteService } from '../../../actions/cds-services-actions';

const propTypes = {
  definition: PropTypes.object,
  serviceUrl: PropTypes.string,
  toggle: PropTypes.func,
  remove: PropTypes.func,
};

export class ServiceDisplay extends Component {

  render() {
    const definitionCopy = JSON.parse(JSON.stringify(this.props.definition));
    const str = JSON.stringify(definitionCopy, null, 2);
    return (
      <div className={styles.container}>
        <div className={styles['url-container']}>
          <Text weight={700} fontSize={14}>{this.props.serviceUrl}</Text>
        </div>
        <div className={styles['btn-container']}>
          <Button text={"Enabled?"}
                  icon={<Checkbox checked={this.props.definition.enabled} 
                                  isLabelHidden={true} 
                                  onChange={() => {}} 
                                  labelText="Enabled?" />}
                  variant={'emphasis'} 
                  onClick={() => this.props.toggle(this.props.serviceUrl)} />
          <Button text={"Delete"}
                  variant={'emphasis'} 
                  onClick={() => this.props.remove(this.props.serviceUrl)} />
        </div>
        <div className={styles['definition-body']} dangerouslySetInnerHTML={{
          __html: str.replace(/\n/g, '<br/>')
          .replace(/ /g, '&nbsp;')
        }}>
        </div>
      </div>
    );
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    toggle: (service) => {
      dispatch(toggleService(service));
    },
    remove: (service) => {
      dispatch(deleteService(service));
    },
  }
};

export default connect(null, mapDispatchToProps)(ServiceDisplay);