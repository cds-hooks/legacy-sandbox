import React, { Component } from 'react';
import { connect } from 'react-redux';
import cx from 'classnames';
import pickBy from 'lodash/pickBy';
import forIn from 'lodash/forIn';
import isEqual from 'lodash/isEqual';

import Field from 'terra-form-field';
import Checkbox from 'terra-form-checkbox';
import Select from 'terra-form-select';
import NumberField from 'terra-form/lib/NumberField';
import Text from 'terra-text';
import Input from 'terra-form-input';
import DatePicker from 'terra-date-picker';
import List from 'terra-list';

import debounce from 'debounce';
import 'react-datepicker/dist/react-datepicker-cssmodules.css';

import Card from '../Card/card';
import styles from './rx-view.css';
import callServices from '../../retrieve-data-helpers/service-exchange';
import { storeUserMedInput, storeUserChosenMedication,
  updateFhirMedicationOrder, storeUserCondition,
  storeMedDosageAmount, storeDate, toggleDate } from '../../actions/medication-select-actions';

export class RxView extends Component {
  static getDerivedStateFromProps(nextProps) {
    if (nextProps.prescription) {
      return {
        value: '',
      };
    }
    return null;
  }

  constructor(props) {
    super(props);

    this.state = {
      value: '',
      dosageAmount: 1,
      dosageFrequency: 'daily',
      startRange: {
        enabled: true,
        value: '',
      },
      endRange: {
        enabled: true,
        value: '',
      },
    };

    this.executeRequests = this.executeRequests.bind(this);
    this.changeMedicationInput = this.changeMedicationInput.bind(this);
    this.selectCondition = this.selectCondition.bind(this);
    this.changeDosageAmount = this.changeDosageAmount.bind(this);
    this.changeDosageFrequency = this.changeDosageFrequency.bind(this);
    this.selectStartDate = this.selectStartDate.bind(this);
    this.selectEndDate = this.selectEndDate.bind(this);
    this.toggleEnabledDate = this.toggleEnabledDate.bind(this);
  }

  // When patient view mounts, execute CDS Service requests configured for this hook
  componentDidUpdate(prevProps) {
    if (this.props.patient !== prevProps.patient ||
        this.props.fhirServer !== prevProps.fhirServer ||
        !isEqual(this.props.services, prevProps.services) ||
        this.props.prescription !== prevProps.prescription) {
      if (this.props.prescription) {
        this.executeRequests();
      }
    }
  }

  selectCondition(e, value) {
    this.props.chooseCondition(value, this.props.fhirVersion, this.props.patient.id);
  }

  changeMedicationInput(event) {
    this.setState({ value: event.target.value });
    debounce(this.props.onMedicationChangeInput(event.target.value), 50);
  }

  changeDosageAmount(e) {
    let transformedNumber = Number(e.target.value) || 1;
    if (transformedNumber > 5) transformedNumber = 5;
    if (transformedNumber < 1) transformedNumber = 1;
    this.setState({ dosageAmount: transformedNumber });
    this.props.updateDosageInstructions(transformedNumber, this.state.dosageFrequency, this.props.fhirVersion, this.props.patient.id);
  }

  changeDosageFrequency(e, value) {
    this.setState({ dosageFrequency: value });
    this.props.updateDosageInstructions(this.state.dosageAmount, value, this.props.fhirVersion, this.props.patient.id);
  }

  selectStartDate(e, value) {
    const newStartRange = {
      enabled: this.state.startRange.enabled,
      value,
    };
    this.setState({
      startRange: newStartRange,
    });
    this.props.updateDate('start', newStartRange, this.props.fhirVersion, this.props.patient.id);
  }

  selectEndDate(e, value) {
    const newEndRange = {
      enabled: this.state.endRange.enabled,
      value,
    };
    this.setState({
      endRange: newEndRange,
    });
    this.props.updateDate('end', newEndRange, this.props.fhirVersion, this.props.patient.id);
  }

  toggleEnabledDate(e, range) {
    this.setState({ [`${range}Range`]: e.target.value });
    this.props.toggleEnabledDate(range);
  }

  executeRequests() {
    if (Object.keys(this.props.services).length) {
      // For each service, call service for request/response exchange
      forIn(this.props.services, (val, key) => {
        callServices(key);
      });
    }
  }

  render() {
    const name = this.props.patient.name || 'Missing Name';
    const pid = this.props.patient.id || 'Missing Patient ID';

    const isHalfView = this.props.isContextVisible ? styles['half-view'] : '';
    let medicationArray = this.props.medications;

    return (
      <div className={cx(styles['rx-view'], isHalfView)}>
        <h1 className={styles['view-title']}>Rx View</h1>
        <div className={styles['patient-data-text']}>
          <p><strong>Patient: </strong> {name} <strong>ID: </strong> {pid}</p>
        </div>
        <form>
          <Field
            label="Treating"
            labelAttrs={{ className: styles['condition-select'] }}
          >
            <Select name="condition-select" onChange={this.selectCondition}>
              {this.props.patient.conditionsResources.map((c) => {
                const { code } = c.resource.code.coding[0];
                return (
                  <Select.Option
                    key={code}
                    value={code}
                    display={c.resource.code.text}
                  />);
              })}
            </Select>
          </Field>
          <Field
            label="Medication"
            labelAttrs={{ className: styles['medication-field'] }}
          >
            <Input
              name="medication-input"
              value={this.state.value}
              onChange={this.changeMedicationInput}
            />
            <List isDivided>
              {medicationArray.map(med =>
                (<List.Item
                  key={med.id}
                  content={<p>{med.name}</p>}
                  isSelectable
                  onClick={() => { this.props.chooseMedication(med, this.props.medListPhase, this.props.fhirVersion, this.props.patient.id); }}
                />))
              }
            </List>
          </Field>
          {this.props.prescription ? <Text isItalic fontSize={16}>{this.props.prescription.name}</Text> : null}
          <div className={styles['dose-instruction']}>
            <NumberField
              label="Number"
              name="dosage-amount"
              className={styles['dosage-amount']}
              value={this.state.dosageAmount}
              onChange={this.changeDosageAmount}
              max={5}
              min={1}
              step={1}
              isInline
            />
            <Field label="Frequency" isInline>
              <Select name="dosage-frequency" onChange={this.changeDosageFrequency} defaultValue={this.state.dosageFrequency}>
                <Select.Option key="daily" value="daily" display="daily" />
                <Select.Option key="twice-daily" value="bid" display="twice daily" />
                <Select.Option key="three-daily" value="tid" display="three times daily" />
                <Select.Option key="four-daily" value="qid" display="four times daily" />
              </Select>
            </Field>
          </div>
          <div className={styles['dosage-timing']}>
            <Field
              label={
                <div>
                  Start Date
                  <Checkbox defaultChecked isInline isLabelHidden labelText="" onChange={e => this.toggleEnabledDate(e, 'start')} />
                </div>}
              isInline
            >
              <DatePicker
                name="start-date"
                onChange={this.selectStartDate}
              />
            </Field>
            <Field
              label={
                <div>
                  End Date
                  <Checkbox defaultChecked isInline isLabelHidden labelText="" onChange={e => this.toggleEnabledDate(e, 'end')} />
                </div>}
              isInline
            >
              <DatePicker
                name="end-date"
                onChange={this.selectEndDate}
              />
            </Field>
          </div>
        </form>
      </div>
    );
  }
}

const mapStateToProps = (store) => {
  function isValidService(service) {
    return service.hook === 'medication-prescribe' && service.enabled;
  }

  return {
    isContextVisible: store.hookState.isContextVisible,
    patient: store.patientState.currentPatient,
    fhirServer: store.fhirServerState.currentFhirServer,
    fhirVersion: store.fhirServerState.fhirVersion,
    services: pickBy(store.cdsServicesState.configuredServices, isValidService),
    hook: store.hookState.currentHook,
    medListPhase: store.medicationState.medListPhase,
    medications: store.medicationState.options[store.medicationState.medListPhase] || [],
    prescription: store.medicationState.decisions.prescribable,
  };
};

const mapDispatchToProps = dispatch => (
  {
    onMedicationChangeInput: (input) => {
      dispatch(storeUserMedInput(input));
    },
    chooseMedication: (medication, medListPhase, fhirVersion, patientId) => {
      dispatch(storeUserChosenMedication(medication));
      if (medListPhase === 'prescribable') {
        dispatch(updateFhirMedicationOrder(fhirVersion, patientId));
      }
    },
    chooseCondition: (condition, fhirVersion, patientId) => {
      dispatch(storeUserCondition(condition));
      dispatch(updateFhirMedicationOrder(fhirVersion, patientId));
    },
    updateDosageInstructions: (amount, frequency, fhirVersion, patientId) => {
      dispatch(storeMedDosageAmount(amount, frequency));
      dispatch(updateFhirMedicationOrder(fhirVersion, patientId));
    },
    updateDate: (range, date, fhirVersion, patientId) => {
      dispatch(storeDate(range, date));
      dispatch(updateFhirMedicationOrder(fhirVersion, patientId));
    },
    toggleEnabledDate: (range, fhirVersion, patientId) => {
      dispatch(toggleDate(range));
      dispatch(updateFhirMedicationOrder(fhirVersion, patientId));
    },
  }
);

export default connect(mapStateToProps, mapDispatchToProps)(RxView);
