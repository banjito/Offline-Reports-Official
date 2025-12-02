/**
 * Low Voltage Circuit Breaker Report - Desktop Version
 * Handles both Electronic Trip and Thermal Magnetic variants
 * Matches the web app's LowVoltageCircuitBreakerElectronicTripATSReport.tsx structure
 */

import React, { useState, useEffect } from 'react';
import { getTCF, fahrenheitToCelsius, multiplyByTCF, VISUAL_INSPECTION_OPTIONS } from './BaseReport';
import './ReportStyles.css';

interface LowVoltageCircuitBreakerReportProps {
  job: any;
  reportData: any;
  onSave: (data: any) => void;
  variant?: 'electronic' | 'thermal-magnetic';
}

// Constants
const CONTACT_RESISTANCE_UNITS = ['µΩ', 'mΩ', 'Ω'];
const INSULATION_RESISTANCE_UNITS = ['kΩ', 'MΩ', 'GΩ'];
const INSULATION_TEST_VOLTAGES = ['250V', '500V', '1000V', '2500V', '5000V'];
const I2T_OPTIONS = ['', 'Yes', 'No', 'N/A'];
const TRIP_UNIT_OPTIONS = ['', 'On', 'Off', 'In', 'Out', 'N/A'];

// Visual inspection items for LV Circuit Breaker
const DEFAULT_VISUAL_INSPECTION_ITEMS = [
  { id: '7.6.1.2.A.1', description: 'Compare equipment nameplate data with drawings and specifications.', result: '' },
  { id: '7.6.1.2.A.2', description: 'Inspect physical and mechanical condition.', result: '' },
  { id: '7.6.1.2.A.3', description: 'Inspect anchorage and alignment.', result: '' },
  { id: '7.6.1.2.A.4', description: 'Verify that all maintenance devices are available for servicing and operating the breaker.', result: '' },
  { id: '7.6.1.2.A.5', description: 'Verify the unit is clean.', result: '' },
  { id: '7.6.1.2.A.6', description: 'Verify the arc chutes are intact.', result: '' },
  { id: '7.6.1.2.A.7', description: 'Inspect moving and stationary contacts for condition and alignment.', result: '' },
  { id: '7.6.1.2.A.8', description: 'Verify that primary and secondary contact wipe and other dimensions vital to satisfactory operation of the breaker are correct.', result: '' },
  { id: '7.6.1.2.A.9', description: 'Perform all mechanical operator and contact alignment tests on both the breaker and its operating mechanism in accordance with manufacturer\'s published data.', result: '' },
  { id: '7.6.1.2.A.10.1', description: 'Use of a low-resistance ohmmeter in accordance with Section 7.6.1.2.B.1.', result: '' },
  { id: '7.6.1.2.A.11', description: 'Verify cell fit and element alignment.', result: '' },
  { id: '7.6.1.2.A.12', description: 'Verify racking mechanism operation.', result: '' },
  { id: '7.6.1.2.A.13', description: 'Verify appropriate lubrication on moving current-carrying parts and on moving and sliding surfaces.', result: '' },
  { id: '7.6.1.2.A.14', description: 'Perform adjustments for final protective device settings in accordance with coordination study provided by end user.', result: '' }
];

const createDefaultFormData = () => ({
  // Job Information
  customer: '',
  address: '',
  user: '',
  date: new Date().toISOString().split('T')[0],
  identifier: '',
  jobNumber: '',
  technicians: '',
  temperature: { fahrenheit: 68, celsius: 20, tcf: 1, humidity: 0 },
  substation: '',
  eqptLocation: '',
  status: 'PASS' as 'PASS' | 'FAIL' | 'LIMITED SERVICE',
  
  // Nameplate Data
  manufacturer: '',
  catalogNumber: '',
  serialNumber: '',
  type: '',
  frameSize: '',
  icRating: '',
  tripUnitType: '',
  ratingPlug: '',
  curveNo: '',
  chargeMotorVoltage: '',
  operation: '',
  mounting: '',
  zoneInterlock: '',
  thermalMemory: '',
  
  // Visual Inspection
  visualInspectionItems: [...DEFAULT_VISUAL_INSPECTION_ITEMS],
  
  // Device Settings
  deviceSettings: {
    asFound: {
      longTime: { setting: '', delay: '', i2t: 'N/A' },
      shortTime: { setting: '', delay: '', i2t: '' },
      instantaneous: { setting: '', delay: '', i2t: 'N/A' },
      groundFault: { setting: '', delay: '', i2t: '' }
    },
    asLeft: {
      longTime: { setting: '', delay: '', i2t: 'N/A' },
      shortTime: { setting: '', delay: '', i2t: '' },
      instantaneous: { setting: '', delay: '', i2t: 'N/A' },
      groundFault: { setting: '', delay: '', i2t: '' }
    }
  },
  
  // Contact/Pole Resistance
  contactResistance: { p1: '', p2: '', p3: '', unit: 'µΩ' },
  
  // Insulation Resistance
  insulationResistance: {
    testVoltage: '1000V',
    unit: 'MΩ',
    measured: {
      poleToPole: { p1p2: '', p2p3: '', p3p1: '' },
      poleToFrame: { p1: '', p2: '', p3: '' },
      lineToLoad: { p1: '', p2: '', p3: '' }
    },
    corrected: {
      poleToPole: { p1p2: '', p2p3: '', p3p1: '' },
      poleToFrame: { p1: '', p2: '', p3: '' },
      lineToLoad: { p1: '', p2: '', p3: '' }
    }
  },
  
  // Primary Injection Test Results - Full structure matching web app
  primaryInjection: {
    testedSettings: {
      longTime: { setting: '', delay: '', i2t: '2' },
      shortTime: { setting: '', delay: '', i2t: '' },
      instantaneous: { setting: '', delay: '', i2t: 'N/A' },
      groundFault: { setting: '', delay: '', i2t: '' }
    },
    results: {
      longTime: {
        ratedAmperes1: '', ratedAmperes2: '',
        multiplier: '300%', toleranceMin: '-10%', toleranceMax: '10%',
        testAmperes1: '', testAmperes2: '',
        toleranceMin1: '', toleranceMin2: '', toleranceMax1: '', toleranceMax2: '',
        pole1: { sec: '', a: '' }, pole2: { sec: '', a: '' }, pole3: { sec: '', a: '' }
      },
      shortTime: {
        ratedAmperes1: '', ratedAmperes2: '',
        multiplier: '110%', toleranceMin: '-10%', toleranceMax: '10%',
        testAmperes1: '', testAmperes2: '',
        toleranceMin1: '', toleranceMin2: '', toleranceMax1: '', toleranceMax2: '',
        pole1: { sec: '', a: '' }, pole2: { sec: '', a: '' }, pole3: { sec: '', a: '' }
      },
      instantaneous: {
        ratedAmperes1: '', ratedAmperes2: '',
        multiplier: '', toleranceMin: '-20%', toleranceMax: '20%',
        testAmperes1: '', testAmperes2: '',
        toleranceMin1: '', toleranceMin2: '', toleranceMax1: '', toleranceMax2: '',
        pole1: { sec: '', a: '' }, pole2: { sec: '', a: '' }, pole3: { sec: '', a: '' }
      },
      groundFault: {
        ratedAmperes1: '', ratedAmperes2: '',
        multiplier: '110%', toleranceMin: '-15%', toleranceMax: '15%',
        testAmperes1: '', testAmperes2: '',
        toleranceMin1: '', toleranceMin2: '', toleranceMax1: '', toleranceMax2: '',
        pole1: { sec: '', a: '' }, pole2: { sec: '', a: '' }, pole3: { sec: '', a: '' }
      }
    }
  },
  
  // Test Equipment
  testEquipment: {
    megohmmeter: { name: '', serialNumber: '', ampId: '' },
    lowResistanceOhmmeter: { name: '', serialNumber: '', ampId: '' },
    primaryInjectionTestSet: { name: '', serialNumber: '', ampId: '' }
  },
  
  // Comments
  comments: ''
});

const LowVoltageCircuitBreakerReport: React.FC<LowVoltageCircuitBreakerReportProps> = ({ 
  job, 
  reportData, 
  onSave,
  variant = 'electronic'
}) => {
  const [formData, setFormData] = useState<any>(createDefaultFormData());
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load report data
  useEffect(() => {
    console.log('LowVoltageCircuitBreakerReport: reportData received:', reportData);
    if (reportData) {
      const defaults = createDefaultFormData();
      const merged = { ...defaults };
      
      const info = reportData.report_info || reportData;
      
      // Job Information
      merged.customer = info.customer || reportData.customer || '';
      merged.address = info.address || reportData.address || '';
      merged.user = info.user || info.userName || reportData.user || '';
      merged.date = info.date || reportData.date || defaults.date;
      merged.identifier = info.identifier || reportData.identifier || '';
      merged.jobNumber = info.jobNumber || reportData.jobNumber || '';
      merged.technicians = info.technicians || reportData.technicians || '';
      merged.substation = info.substation || reportData.substation || '';
      merged.eqptLocation = info.eqptLocation || reportData.eqptLocation || '';
      merged.status = info.status || reportData.status || 'PASS';
      
      // Temperature
      const temp = info.temperature || reportData.temperature || {};
      merged.temperature = {
        fahrenheit: temp.fahrenheit ?? 68,
        celsius: temp.celsius ?? 20,
        tcf: temp.tcf ?? 1,
        humidity: temp.humidity ?? 0
      };
      
      // Nameplate Data - check nameplateData object first (web app format), then individual fields
      const np = reportData.nameplateData || reportData.nameplate_data || info.nameplateData || {};
      merged.manufacturer = np.manufacturer || info.manufacturer || reportData.manufacturer || '';
      merged.catalogNumber = np.catalogNumber || np.catalog_number || info.catalogNumber || reportData.catalogNumber || '';
      merged.serialNumber = np.serialNumber || np.serial_number || info.serialNumber || reportData.serialNumber || '';
      merged.type = np.type || info.type || reportData.type || '';
      merged.frameSize = np.frameSize || np.frame_size || info.frameSize || reportData.frameSize || '';
      merged.icRating = np.icRating || np.ic_rating || info.icRating || reportData.icRating || '';
      merged.tripUnitType = np.tripUnitType || np.trip_unit_type || info.tripUnitType || reportData.tripUnitType || '';
      merged.ratingPlug = np.ratingPlug || np.rating_plug || info.ratingPlug || reportData.ratingPlug || '';
      merged.curveNo = np.curveNo || np.curve_no || info.curveNo || reportData.curveNo || '';
      merged.chargeMotorVoltage = np.chargeMotorVoltage || np.charge_motor_voltage || info.chargeMotorVoltage || reportData.chargeMotorVoltage || '';
      merged.operation = np.operation || info.operation || reportData.operation || '';
      merged.mounting = np.mounting || info.mounting || reportData.mounting || '';
      merged.zoneInterlock = np.zoneInterlock || np.zone_interlock || info.zoneInterlock || reportData.zoneInterlock || '';
      merged.thermalMemory = np.thermalMemory || np.thermal_memory || info.thermalMemory || reportData.thermalMemory || '';
      
      // Visual Inspection Items
      const visualItems = reportData.visual_mechanical?.items || 
                          reportData.visualInspectionItems || 
                          info.visualInspectionItems || [];
      if (visualItems.length > 0) {
        merged.visualInspectionItems = visualItems.map((item: any) => ({
          id: item.id || '',
          description: item.description || '',
          result: item.result || ''
        }));
      }
      
      // Device Settings
      const ds = reportData.device_settings || reportData.deviceSettings || info.deviceSettings || {};
      if (ds.asFound || ds.asLeft) {
        merged.deviceSettings = {
          asFound: ds.asFound || defaults.deviceSettings.asFound,
          asLeft: ds.asLeft || defaults.deviceSettings.asLeft
        };
      }
      
      // Contact Resistance
      const cr = reportData.contact_resistance || reportData.contactResistance || info.contactResistance || {};
      if (cr.p1 !== undefined || cr.p2 !== undefined || cr.p3 !== undefined) {
        merged.contactResistance = {
          p1: cr.p1 || '',
          p2: cr.p2 || '',
          p3: cr.p3 || '',
          unit: cr.unit || 'µΩ'
        };
      }
      
      // Insulation Resistance
      const ir = reportData.insulation_resistance || reportData.insulationResistance || info.insulationResistance || {};
      if (ir.testVoltage || ir.measured || ir.corrected) {
        merged.insulationResistance = {
          testVoltage: ir.testVoltage || '1000V',
          unit: ir.unit || 'MΩ',
          measured: ir.measured || defaults.insulationResistance.measured,
          corrected: ir.corrected || defaults.insulationResistance.corrected
        };
      }
      
      // Primary Injection
      const pi = reportData.primary_injection || reportData.primaryInjection || info.primaryInjection || {};
      if (pi.testedSettings || pi.results) {
        merged.primaryInjection = {
          testedSettings: pi.testedSettings || defaults.primaryInjection.testedSettings,
          results: pi.results || defaults.primaryInjection.results
        };
      }
      
      // Test Equipment
      const te = reportData.test_equipment_used || reportData.testEquipment || info.testEquipment || {};
      merged.testEquipment = {
        megohmmeter: te.megohmmeter || defaults.testEquipment.megohmmeter,
        lowResistanceOhmmeter: te.lowResistanceOhmmeter || defaults.testEquipment.lowResistanceOhmmeter,
        primaryInjectionTestSet: te.primaryInjectionTestSet || defaults.testEquipment.primaryInjectionTestSet
      };
      
      // Comments
      merged.comments = reportData.comments || info.comments || '';
      
      console.log('LowVoltageCircuitBreakerReport: merged data:', merged);
      setFormData(merged);
    }
  }, [reportData]);

  // Load job info
  useEffect(() => {
    if (job) {
      setFormData((prev: any) => ({
        ...prev,
        jobNumber: job.job_number || prev.jobNumber,
        customer: job.customer_name || prev.customer,
        address: job.site_address || prev.address
      }));
    }
  }, [job]);

  // Auto-calculate TCF
  useEffect(() => {
    const fahrenheit = formData.temperature?.fahrenheit || 68;
    const celsius = fahrenheitToCelsius(fahrenheit);
    const tcf = getTCF(celsius);
    if (celsius !== formData.temperature?.celsius || tcf !== formData.temperature?.tcf) {
      setFormData((prev: any) => ({
        ...prev,
        temperature: { ...prev.temperature, celsius, tcf }
      }));
    }
  }, [formData.temperature?.fahrenheit]);

  // Auto-calculate corrected insulation resistance
  useEffect(() => {
    const tcf = formData.temperature?.tcf || 1;
    const measured = formData.insulationResistance?.measured;
    if (measured) {
      const corrected = {
        poleToPole: {
          p1p2: multiplyByTCF(measured.poleToPole?.p1p2, tcf),
          p2p3: multiplyByTCF(measured.poleToPole?.p2p3, tcf),
          p3p1: multiplyByTCF(measured.poleToPole?.p3p1, tcf)
        },
        poleToFrame: {
          p1: multiplyByTCF(measured.poleToFrame?.p1, tcf),
          p2: multiplyByTCF(measured.poleToFrame?.p2, tcf),
          p3: multiplyByTCF(measured.poleToFrame?.p3, tcf)
        },
        lineToLoad: {
          p1: multiplyByTCF(measured.lineToLoad?.p1, tcf),
          p2: multiplyByTCF(measured.lineToLoad?.p2, tcf),
          p3: multiplyByTCF(measured.lineToLoad?.p3, tcf)
        }
      };
      setFormData((prev: any) => ({
        ...prev,
        insulationResistance: { ...prev.insulationResistance, corrected }
      }));
    }
  }, [formData.insulationResistance?.measured, formData.temperature?.tcf]);

  const setField = (path: string, value: any) => {
    setFormData((prev: any) => {
      const clone = JSON.parse(JSON.stringify(prev));
      const keys = path.split('.');
      let cur = clone;
      for (let i = 0; i < keys.length - 1; i++) {
        if (cur[keys[i]] === undefined) cur[keys[i]] = {};
        cur = cur[keys[i]];
      }
      cur[keys[keys.length - 1]] = value;
      return clone;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(formData);
      setIsEditing(false);
    } catch (error) {
      console.error('Save failed:', error);
      alert('Failed to save report');
    } finally {
      setSaving(false);
    }
  };

  const updateVisualInspection = (index: number, field: string, value: string) => {
    const items = [...formData.visualInspectionItems];
    items[index] = { ...items[index], [field]: value };
    setFormData((prev: any) => ({ ...prev, visualInspectionItems: items }));
  };

  const reportTitle = variant === 'thermal-magnetic' 
    ? 'Low Voltage Circuit Breaker - Thermal Magnetic Test Report'
    : 'Low Voltage Circuit Breaker - Electronic Trip Test Report';

  return (
    <div className="report-container">
      {/* Header */}
      <div className="report-header-bar">
        <h1 className="report-title">{reportTitle}</h1>
        <div className="report-actions">
          <button
            onClick={() => setField('status', formData.status === 'PASS' ? 'FAIL' : 'PASS')}
            disabled={!isEditing}
            className={`status-btn ${formData.status === 'PASS' ? 'pass' : 'fail'}`}
          >
            {formData.status}
          </button>
          {!isEditing ? (
            <button onClick={() => setIsEditing(true)} className="btn-primary">Edit Report</button>
          ) : (
            <button onClick={handleSave} disabled={saving} className="btn-save">
              {saving ? 'Saving...' : 'Save Report'}
            </button>
          )}
        </div>
      </div>

      {/* Job Information */}
      <section className="report-section">
        <div className="section-divider"></div>
        <h2 className="section-title">Job Information</h2>
        <div className="form-grid-6">
          <div className="form-field">
            <label>Customer:</label>
            <input value={formData.customer || ''} onChange={e => setField('customer', e.target.value)} readOnly={!isEditing} className="report-input" />
          </div>
          <div className="form-field">
            <label>Job #:</label>
            <input value={formData.jobNumber || ''} onChange={e => setField('jobNumber', e.target.value)} readOnly={!isEditing} className="report-input" />
          </div>
          <div className="form-field">
            <label>Technicians:</label>
            <input value={formData.technicians || ''} onChange={e => setField('technicians', e.target.value)} readOnly={!isEditing} className="report-input" />
          </div>
          <div className="form-field">
            <label>Date:</label>
            <input type="date" value={formData.date || ''} onChange={e => setField('date', e.target.value)} readOnly={!isEditing} className="report-input" />
          </div>
          <div className="form-field">
            <label>Identifier:</label>
            <input value={formData.identifier || ''} onChange={e => setField('identifier', e.target.value)} readOnly={!isEditing} className="report-input" />
          </div>
          <div className="form-field temp-field">
            <label>Temp:</label>
            <div className="temp-inputs">
              <input type="number" value={formData.temperature?.fahrenheit ?? 68} onChange={e => setField('temperature.fahrenheit', Number(e.target.value))} readOnly={!isEditing} className="report-input temp-input" />
              <span>°F</span>
              <span className="temp-celsius">{formData.temperature?.celsius ?? 20}</span>
              <span>°C</span>
              <span className="temp-label">TCF</span>
              <span className="temp-value">{(formData.temperature?.tcf ?? 1).toFixed(3)}</span>
            </div>
          </div>
          <div className="form-field">
            <label>Substation:</label>
            <input value={formData.substation || ''} onChange={e => setField('substation', e.target.value)} readOnly={!isEditing} className="report-input" />
          </div>
          <div className="form-field">
            <label>Eqpt. Location:</label>
            <input value={formData.eqptLocation || ''} onChange={e => setField('eqptLocation', e.target.value)} readOnly={!isEditing} className="report-input" />
          </div>
        </div>
      </section>

      {/* Nameplate Data */}
      <section className="report-section">
        <div className="section-divider"></div>
        <h2 className="section-title">Nameplate Data</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="form-field">
            <label>Manufacturer:</label>
            <input value={formData.manufacturer || ''} onChange={e => setField('manufacturer', e.target.value)} readOnly={!isEditing} className="report-input" />
          </div>
          <div className="form-field">
            <label>Catalog No.:</label>
            <input value={formData.catalogNumber || ''} onChange={e => setField('catalogNumber', e.target.value)} readOnly={!isEditing} className="report-input" />
          </div>
          <div className="form-field">
            <label>Serial Number:</label>
            <input value={formData.serialNumber || ''} onChange={e => setField('serialNumber', e.target.value)} readOnly={!isEditing} className="report-input" />
          </div>
          <div className="form-field">
            <label>Type:</label>
            <input value={formData.type || ''} onChange={e => setField('type', e.target.value)} readOnly={!isEditing} className="report-input" />
          </div>
          <div className="form-field">
            <label>Frame Size (A):</label>
            <input value={formData.frameSize || ''} onChange={e => setField('frameSize', e.target.value)} readOnly={!isEditing} className="report-input" />
          </div>
          <div className="form-field">
            <label>IC Rating (kA):</label>
            <input value={formData.icRating || ''} onChange={e => setField('icRating', e.target.value)} readOnly={!isEditing} className="report-input" />
          </div>
          <div className="form-field">
            <label>Trip Unit Type:</label>
            <select value={formData.tripUnitType || ''} onChange={e => setField('tripUnitType', e.target.value)} disabled={!isEditing} className="report-input">
              {TRIP_UNIT_OPTIONS.map(opt => <option key={opt} value={opt}>{opt || 'Select...'}</option>)}
            </select>
          </div>
          <div className="form-field">
            <label>Rating Plug (A):</label>
            <input value={formData.ratingPlug || ''} onChange={e => setField('ratingPlug', e.target.value)} readOnly={!isEditing} className="report-input" />
          </div>
          <div className="form-field">
            <label>Curve No.:</label>
            <input value={formData.curveNo || ''} onChange={e => setField('curveNo', e.target.value)} readOnly={!isEditing} className="report-input" />
          </div>
          <div className="form-field">
            <label>Charge Motor Voltage:</label>
            <input value={formData.chargeMotorVoltage || ''} onChange={e => setField('chargeMotorVoltage', e.target.value)} readOnly={!isEditing} className="report-input" />
          </div>
          <div className="form-field">
            <label>Operation:</label>
            <input value={formData.operation || ''} onChange={e => setField('operation', e.target.value)} readOnly={!isEditing} className="report-input" />
          </div>
          <div className="form-field">
            <label>Mounting:</label>
            <input value={formData.mounting || ''} onChange={e => setField('mounting', e.target.value)} readOnly={!isEditing} className="report-input" />
          </div>
          <div className="form-field">
            <label>Zone Interlock:</label>
            <select value={formData.zoneInterlock || ''} onChange={e => setField('zoneInterlock', e.target.value)} disabled={!isEditing} className="report-input">
              {TRIP_UNIT_OPTIONS.map(opt => <option key={opt} value={opt}>{opt || 'Select...'}</option>)}
            </select>
          </div>
          <div className="form-field">
            <label>Thermal Memory:</label>
            <select value={formData.thermalMemory || ''} onChange={e => setField('thermalMemory', e.target.value)} disabled={!isEditing} className="report-input">
              {TRIP_UNIT_OPTIONS.map(opt => <option key={opt} value={opt}>{opt || 'Select...'}</option>)}
            </select>
          </div>
        </div>
      </section>

      {/* Visual and Mechanical Inspection */}
      <section className="report-section">
        <div className="section-divider"></div>
        <h2 className="section-title">Visual and Mechanical Inspection</h2>
        <div className="table-container">
          <table className="report-table">
            <thead>
              <tr>
                <th style={{ width: '12%' }}>NETA Section</th>
                <th style={{ width: '68%' }}>Description</th>
                <th style={{ width: '20%' }}>Result</th>
              </tr>
            </thead>
            <tbody>
              {formData.visualInspectionItems.map((item: any, idx: number) => (
                <tr key={item.id || idx}>
                  <td>{item.id}</td>
                  <td className="text-left">{item.description}</td>
                  <td>
                    <select value={item.result || ''} onChange={e => updateVisualInspection(idx, 'result', e.target.value)} disabled={!isEditing} className="report-input">
                      {VISUAL_INSPECTION_OPTIONS.map(opt => <option key={opt} value={opt}>{opt || 'Select...'}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Device Settings */}
      <section className="report-section">
        <div className="section-divider"></div>
        <h2 className="section-title">Device Settings</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* As Found */}
          <div>
            <h3 className="font-semibold mb-2">As Found</h3>
            <div className="table-container">
              <table className="report-table">
                <thead>
                  <tr>
                    <th>Function</th>
                    <th>Setting</th>
                    <th>Delay</th>
                    <th>I²t</th>
                  </tr>
                </thead>
                <tbody>
                  {['longTime', 'shortTime', 'instantaneous', 'groundFault'].map(func => (
                    <tr key={func}>
                      <td>{func === 'longTime' ? 'Long Time' : func === 'shortTime' ? 'Short Time' : func === 'instantaneous' ? 'Instantaneous' : 'Ground Fault'}</td>
                      <td><input value={formData.deviceSettings?.asFound?.[func]?.setting || ''} onChange={e => setField(`deviceSettings.asFound.${func}.setting`, e.target.value)} readOnly={!isEditing} className="report-input" /></td>
                      <td><input value={formData.deviceSettings?.asFound?.[func]?.delay || ''} onChange={e => setField(`deviceSettings.asFound.${func}.delay`, e.target.value)} readOnly={!isEditing} className="report-input" /></td>
                      <td>
                        <select value={formData.deviceSettings?.asFound?.[func]?.i2t || ''} onChange={e => setField(`deviceSettings.asFound.${func}.i2t`, e.target.value)} disabled={!isEditing} className="report-input">
                          {I2T_OPTIONS.map(opt => <option key={opt} value={opt}>{opt || '-'}</option>)}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          {/* As Left */}
          <div>
            <h3 className="font-semibold mb-2">As Left</h3>
            <div className="table-container">
              <table className="report-table">
                <thead>
                  <tr>
                    <th>Function</th>
                    <th>Setting</th>
                    <th>Delay</th>
                    <th>I²t</th>
                  </tr>
                </thead>
                <tbody>
                  {['longTime', 'shortTime', 'instantaneous', 'groundFault'].map(func => (
                    <tr key={func}>
                      <td>{func === 'longTime' ? 'Long Time' : func === 'shortTime' ? 'Short Time' : func === 'instantaneous' ? 'Instantaneous' : 'Ground Fault'}</td>
                      <td><input value={formData.deviceSettings?.asLeft?.[func]?.setting || ''} onChange={e => setField(`deviceSettings.asLeft.${func}.setting`, e.target.value)} readOnly={!isEditing} className="report-input" /></td>
                      <td><input value={formData.deviceSettings?.asLeft?.[func]?.delay || ''} onChange={e => setField(`deviceSettings.asLeft.${func}.delay`, e.target.value)} readOnly={!isEditing} className="report-input" /></td>
                      <td>
                        <select value={formData.deviceSettings?.asLeft?.[func]?.i2t || ''} onChange={e => setField(`deviceSettings.asLeft.${func}.i2t`, e.target.value)} disabled={!isEditing} className="report-input">
                          {I2T_OPTIONS.map(opt => <option key={opt} value={opt}>{opt || '-'}</option>)}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* Contact/Pole Resistance */}
      <section className="report-section">
        <div className="section-divider"></div>
        <h2 className="section-title">Electrical Tests - Contact/Pole Resistance</h2>
        <div className="table-container">
          <table className="report-table">
            <thead>
              <tr>
                <th>Pole 1</th>
                <th>Pole 2</th>
                <th>Pole 3</th>
                <th>Units</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><input value={formData.contactResistance?.p1 || ''} onChange={e => setField('contactResistance.p1', e.target.value)} readOnly={!isEditing} className="report-input" /></td>
                <td><input value={formData.contactResistance?.p2 || ''} onChange={e => setField('contactResistance.p2', e.target.value)} readOnly={!isEditing} className="report-input" /></td>
                <td><input value={formData.contactResistance?.p3 || ''} onChange={e => setField('contactResistance.p3', e.target.value)} readOnly={!isEditing} className="report-input" /></td>
                <td>
                  <select value={formData.contactResistance?.unit || 'µΩ'} onChange={e => setField('contactResistance.unit', e.target.value)} disabled={!isEditing} className="report-input">
                    {CONTACT_RESISTANCE_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Insulation Resistance */}
      <section className="report-section">
        <div className="section-divider"></div>
        <h2 className="section-title">Electrical Tests - Insulation Resistance</h2>
        <div className="flex gap-4 mb-4">
          <div className="flex items-center gap-2">
            <label>Test Voltage:</label>
            <select value={formData.insulationResistance?.testVoltage || '1000V'} onChange={e => setField('insulationResistance.testVoltage', e.target.value)} disabled={!isEditing} className="report-input" style={{width: 'auto'}}>
              {INSULATION_TEST_VOLTAGES.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label>Units:</label>
            <select value={formData.insulationResistance?.unit || 'MΩ'} onChange={e => setField('insulationResistance.unit', e.target.value)} disabled={!isEditing} className="report-input" style={{width: 'auto'}}>
              {INSULATION_RESISTANCE_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm">TCF: <strong>{(formData.temperature?.tcf ?? 1).toFixed(3)}</strong></span>
          </div>
        </div>
        <div className="table-container">
          <table className="report-table">
            <thead>
              <tr>
                <th rowSpan={2}>Test</th>
                <th colSpan={3} style={{ textAlign: 'center' }}>Measured Values</th>
                <th colSpan={3} style={{ textAlign: 'center' }}>Temp. Corrected</th>
              </tr>
              <tr>
                <th>P1-P2 / P1</th>
                <th>P2-P3 / P2</th>
                <th>P3-P1 / P3</th>
                <th>P1-P2 / P1</th>
                <th>P2-P3 / P2</th>
                <th>P3-P1 / P3</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Pole to Pole</td>
                <td><input value={formData.insulationResistance?.measured?.poleToPole?.p1p2 || ''} onChange={e => setField('insulationResistance.measured.poleToPole.p1p2', e.target.value)} readOnly={!isEditing} className="report-input" /></td>
                <td><input value={formData.insulationResistance?.measured?.poleToPole?.p2p3 || ''} onChange={e => setField('insulationResistance.measured.poleToPole.p2p3', e.target.value)} readOnly={!isEditing} className="report-input" /></td>
                <td><input value={formData.insulationResistance?.measured?.poleToPole?.p3p1 || ''} onChange={e => setField('insulationResistance.measured.poleToPole.p3p1', e.target.value)} readOnly={!isEditing} className="report-input" /></td>
                <td><input value={formData.insulationResistance?.corrected?.poleToPole?.p1p2 || ''} readOnly className="report-input calculated" /></td>
                <td><input value={formData.insulationResistance?.corrected?.poleToPole?.p2p3 || ''} readOnly className="report-input calculated" /></td>
                <td><input value={formData.insulationResistance?.corrected?.poleToPole?.p3p1 || ''} readOnly className="report-input calculated" /></td>
              </tr>
              <tr>
                <td>Pole to Frame</td>
                <td><input value={formData.insulationResistance?.measured?.poleToFrame?.p1 || ''} onChange={e => setField('insulationResistance.measured.poleToFrame.p1', e.target.value)} readOnly={!isEditing} className="report-input" /></td>
                <td><input value={formData.insulationResistance?.measured?.poleToFrame?.p2 || ''} onChange={e => setField('insulationResistance.measured.poleToFrame.p2', e.target.value)} readOnly={!isEditing} className="report-input" /></td>
                <td><input value={formData.insulationResistance?.measured?.poleToFrame?.p3 || ''} onChange={e => setField('insulationResistance.measured.poleToFrame.p3', e.target.value)} readOnly={!isEditing} className="report-input" /></td>
                <td><input value={formData.insulationResistance?.corrected?.poleToFrame?.p1 || ''} readOnly className="report-input calculated" /></td>
                <td><input value={formData.insulationResistance?.corrected?.poleToFrame?.p2 || ''} readOnly className="report-input calculated" /></td>
                <td><input value={formData.insulationResistance?.corrected?.poleToFrame?.p3 || ''} readOnly className="report-input calculated" /></td>
              </tr>
              <tr>
                <td>Line to Load</td>
                <td><input value={formData.insulationResistance?.measured?.lineToLoad?.p1 || ''} onChange={e => setField('insulationResistance.measured.lineToLoad.p1', e.target.value)} readOnly={!isEditing} className="report-input" /></td>
                <td><input value={formData.insulationResistance?.measured?.lineToLoad?.p2 || ''} onChange={e => setField('insulationResistance.measured.lineToLoad.p2', e.target.value)} readOnly={!isEditing} className="report-input" /></td>
                <td><input value={formData.insulationResistance?.measured?.lineToLoad?.p3 || ''} onChange={e => setField('insulationResistance.measured.lineToLoad.p3', e.target.value)} readOnly={!isEditing} className="report-input" /></td>
                <td><input value={formData.insulationResistance?.corrected?.lineToLoad?.p1 || ''} readOnly className="report-input calculated" /></td>
                <td><input value={formData.insulationResistance?.corrected?.lineToLoad?.p2 || ''} readOnly className="report-input calculated" /></td>
                <td><input value={formData.insulationResistance?.corrected?.lineToLoad?.p3 || ''} readOnly className="report-input calculated" /></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Primary Injection Test Results */}
      <section className="report-section">
        <div className="section-divider"></div>
        <h2 className="section-title">Electrical Tests - Primary Injection</h2>
        
        {/* Tested Settings Table */}
        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 8, textAlign: 'center' }}>Tested Settings</h3>
        <div className="table-container" style={{ marginBottom: 24 }}>
          <table className="report-table">
            <thead>
              <tr>
                <th style={{ width: '25%' }}></th>
                <th style={{ width: '25%' }}>Setting</th>
                <th style={{ width: '25%' }}>Delay</th>
                <th style={{ width: '25%' }}>I²t</th>
              </tr>
            </thead>
            <tbody>
              {['longTime', 'shortTime', 'instantaneous', 'groundFault'].map(func => (
                <tr key={`tested-${func}`}>
                  <td>{func === 'longTime' ? 'Long Time' : func === 'shortTime' ? 'Short Time' : func === 'instantaneous' ? 'Instantaneous' : 'Ground Fault'}</td>
                  <td><input value={formData.primaryInjection?.testedSettings?.[func]?.setting || ''} onChange={e => setField(`primaryInjection.testedSettings.${func}.setting`, e.target.value)} readOnly={!isEditing} className="report-input" style={{ textAlign: 'center' }} /></td>
                  <td><input value={formData.primaryInjection?.testedSettings?.[func]?.delay || ''} onChange={e => setField(`primaryInjection.testedSettings.${func}.delay`, e.target.value)} readOnly={!isEditing} className="report-input" style={{ textAlign: 'center' }} /></td>
                  <td>
                    {(func === 'shortTime' || func === 'groundFault') ? (
                      <select value={formData.primaryInjection?.testedSettings?.[func]?.i2t || ''} onChange={e => setField(`primaryInjection.testedSettings.${func}.i2t`, e.target.value)} disabled={!isEditing} className="report-input">
                        {TRIP_UNIT_OPTIONS.map(opt => <option key={opt} value={opt}>{opt || '-'}</option>)}
                      </select>
                    ) : (
                      <input value={formData.primaryInjection?.testedSettings?.[func]?.i2t || ''} readOnly className="report-input calculated" style={{ textAlign: 'center' }} />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Primary Injection Results Table */}
        <div className="table-container" style={{ overflowX: 'auto' }}>
          <table className="report-table" style={{ fontSize: '0.85rem', minWidth: '1200px', tableLayout: 'fixed' }}>
            <thead>
              <tr>
                <th rowSpan={2} style={{ width: '100px', minWidth: '100px' }}>Function</th>
                <th rowSpan={2} style={{ width: '100px', minWidth: '100px' }}>Rated Amperes</th>
                <th colSpan={2} style={{ width: '140px', minWidth: '140px', textAlign: 'center' }}>Multiplier %</th>
                <th rowSpan={2} style={{ width: '100px', minWidth: '100px' }}>Test Amperes</th>
                <th colSpan={2} style={{ width: '140px', minWidth: '140px', textAlign: 'center' }}>Tolerance</th>
                <th style={{ width: '120px', minWidth: '120px', textAlign: 'center' }}>Pole 1</th>
                <th style={{ width: '120px', minWidth: '120px', textAlign: 'center' }}>Pole 2</th>
                <th style={{ width: '120px', minWidth: '120px', textAlign: 'center' }}>Pole 3</th>
              </tr>
              <tr>
                <th style={{ width: '70px' }}></th>
                <th style={{ width: '70px' }}></th>
                <th style={{ width: '70px', textAlign: 'center' }}>Min</th>
                <th style={{ width: '70px', textAlign: 'center' }}>Max</th>
                <th style={{ textAlign: 'center' }}>sec.</th>
                <th style={{ textAlign: 'center' }}>sec.</th>
                <th style={{ textAlign: 'center' }}>sec.</th>
              </tr>
            </thead>
            <tbody>
              {/* Long Time - Row 1 */}
              <tr>
                <td rowSpan={2} style={{ fontWeight: 600 }}>Long Time</td>
                <td><input value={formData.primaryInjection?.results?.longTime?.ratedAmperes1 || ''} onChange={e => setField('primaryInjection.results.longTime.ratedAmperes1', e.target.value)} readOnly={!isEditing} className="report-input" style={{ textAlign: 'center', width: '100%' }} /></td>
                <td colSpan={2} style={{ textAlign: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                    <input value={(formData.primaryInjection?.results?.longTime?.multiplier || '').replace(/%/g, '')} onChange={e => setField('primaryInjection.results.longTime.multiplier', e.target.value ? `${e.target.value}%` : '')} readOnly={!isEditing} className="report-input" style={{ textAlign: 'center', width: '70px' }} />
                    <span>%</span>
                  </div>
                </td>
                <td><input value={formData.primaryInjection?.results?.longTime?.testAmperes1 || ''} onChange={e => setField('primaryInjection.results.longTime.testAmperes1', e.target.value)} readOnly={!isEditing} className="report-input" style={{ textAlign: 'center', width: '100%' }} /></td>
                <td><input value={formData.primaryInjection?.results?.longTime?.toleranceMin1 || ''} onChange={e => setField('primaryInjection.results.longTime.toleranceMin1', e.target.value)} readOnly={!isEditing} className="report-input" style={{ textAlign: 'center', width: '100%' }} /></td>
                <td><input value={formData.primaryInjection?.results?.longTime?.toleranceMax1 || ''} onChange={e => setField('primaryInjection.results.longTime.toleranceMax1', e.target.value)} readOnly={!isEditing} className="report-input" style={{ textAlign: 'center', width: '100%' }} /></td>
                <td><input value={formData.primaryInjection?.results?.longTime?.pole1?.sec || ''} onChange={e => setField('primaryInjection.results.longTime.pole1.sec', e.target.value)} readOnly={!isEditing} className="report-input" style={{ textAlign: 'center', width: '100%' }} /></td>
                <td><input value={formData.primaryInjection?.results?.longTime?.pole2?.sec || ''} onChange={e => setField('primaryInjection.results.longTime.pole2.sec', e.target.value)} readOnly={!isEditing} className="report-input" style={{ textAlign: 'center', width: '100%' }} /></td>
                <td><input value={formData.primaryInjection?.results?.longTime?.pole3?.sec || ''} onChange={e => setField('primaryInjection.results.longTime.pole3.sec', e.target.value)} readOnly={!isEditing} className="report-input" style={{ textAlign: 'center', width: '100%' }} /></td>
              </tr>
              {/* Long Time - Row 2 (LTPU) */}
              <tr>
                <td style={{ fontSize: '0.8rem', color: '#666' }}>LTPU</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                    <input value={(formData.primaryInjection?.results?.longTime?.toleranceMin || '').replace(/%/g, '')} onChange={e => setField('primaryInjection.results.longTime.toleranceMin', e.target.value ? `${e.target.value}%` : '')} readOnly={!isEditing} className="report-input" style={{ textAlign: 'center', width: '50px' }} />
                    <span>%</span>
                  </div>
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                    <input value={(formData.primaryInjection?.results?.longTime?.toleranceMax || '').replace(/%/g, '')} onChange={e => setField('primaryInjection.results.longTime.toleranceMax', e.target.value ? `${e.target.value}%` : '')} readOnly={!isEditing} className="report-input" style={{ textAlign: 'center', width: '50px' }} />
                    <span>%</span>
                  </div>
                </td>
                <td><input value={formData.primaryInjection?.results?.longTime?.ratedAmperes2 || ''} onChange={e => setField('primaryInjection.results.longTime.ratedAmperes2', e.target.value)} readOnly={!isEditing} className="report-input" style={{ textAlign: 'center', width: '100%' }} /></td>
                <td><input value={formData.primaryInjection?.results?.longTime?.toleranceMin2 || ''} onChange={e => setField('primaryInjection.results.longTime.toleranceMin2', e.target.value)} readOnly={!isEditing} className="report-input" style={{ textAlign: 'center', width: '100%' }} /></td>
                <td><input value={formData.primaryInjection?.results?.longTime?.toleranceMax2 || ''} onChange={e => setField('primaryInjection.results.longTime.toleranceMax2', e.target.value)} readOnly={!isEditing} className="report-input" style={{ textAlign: 'center', width: '100%' }} /></td>
                <td><input value={formData.primaryInjection?.results?.longTime?.pole1?.a || ''} onChange={e => setField('primaryInjection.results.longTime.pole1.a', e.target.value)} readOnly={!isEditing} className="report-input" style={{ textAlign: 'center', width: '100%' }} /></td>
                <td><input value={formData.primaryInjection?.results?.longTime?.pole2?.a || ''} onChange={e => setField('primaryInjection.results.longTime.pole2.a', e.target.value)} readOnly={!isEditing} className="report-input" style={{ textAlign: 'center', width: '100%' }} /></td>
                <td><input value={formData.primaryInjection?.results?.longTime?.pole3?.a || ''} onChange={e => setField('primaryInjection.results.longTime.pole3.a', e.target.value)} readOnly={!isEditing} className="report-input" style={{ textAlign: 'center', width: '100%' }} /></td>
              </tr>

              {/* Short Time - Row 1 */}
              <tr>
                <td rowSpan={2} style={{ fontWeight: 600 }}>Short Time</td>
                <td><input value={formData.primaryInjection?.results?.shortTime?.ratedAmperes1 || ''} onChange={e => setField('primaryInjection.results.shortTime.ratedAmperes1', e.target.value)} readOnly={!isEditing} className="report-input" style={{ textAlign: 'center', width: '100%' }} /></td>
                <td colSpan={2} style={{ textAlign: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                    <input value={(formData.primaryInjection?.results?.shortTime?.multiplier || '').replace(/%/g, '')} onChange={e => setField('primaryInjection.results.shortTime.multiplier', e.target.value ? `${e.target.value}%` : '')} readOnly={!isEditing} className="report-input" style={{ textAlign: 'center', width: '70px' }} />
                    <span>%</span>
                  </div>
                </td>
                <td><input value={formData.primaryInjection?.results?.shortTime?.testAmperes1 || ''} onChange={e => setField('primaryInjection.results.shortTime.testAmperes1', e.target.value)} readOnly={!isEditing} className="report-input" style={{ textAlign: 'center', width: '100%' }} /></td>
                <td><input value={formData.primaryInjection?.results?.shortTime?.toleranceMin1 || ''} onChange={e => setField('primaryInjection.results.shortTime.toleranceMin1', e.target.value)} readOnly={!isEditing} className="report-input" style={{ textAlign: 'center', width: '100%' }} /></td>
                <td><input value={formData.primaryInjection?.results?.shortTime?.toleranceMax1 || ''} onChange={e => setField('primaryInjection.results.shortTime.toleranceMax1', e.target.value)} readOnly={!isEditing} className="report-input" style={{ textAlign: 'center', width: '100%' }} /></td>
                <td><input value={formData.primaryInjection?.results?.shortTime?.pole1?.sec || ''} onChange={e => setField('primaryInjection.results.shortTime.pole1.sec', e.target.value)} readOnly={!isEditing} className="report-input" style={{ textAlign: 'center', width: '100%' }} /></td>
                <td><input value={formData.primaryInjection?.results?.shortTime?.pole2?.sec || ''} onChange={e => setField('primaryInjection.results.shortTime.pole2.sec', e.target.value)} readOnly={!isEditing} className="report-input" style={{ textAlign: 'center', width: '100%' }} /></td>
                <td><input value={formData.primaryInjection?.results?.shortTime?.pole3?.sec || ''} onChange={e => setField('primaryInjection.results.shortTime.pole3.sec', e.target.value)} readOnly={!isEditing} className="report-input" style={{ textAlign: 'center', width: '100%' }} /></td>
              </tr>
              {/* Short Time - Row 2 (STPU) */}
              <tr>
                <td style={{ fontSize: '0.8rem', color: '#666' }}>STPU</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                    <input value={(formData.primaryInjection?.results?.shortTime?.toleranceMin || '').replace(/%/g, '')} onChange={e => setField('primaryInjection.results.shortTime.toleranceMin', e.target.value ? `${e.target.value}%` : '')} readOnly={!isEditing} className="report-input" style={{ textAlign: 'center', width: '50px' }} />
                    <span>%</span>
                  </div>
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                    <input value={(formData.primaryInjection?.results?.shortTime?.toleranceMax || '').replace(/%/g, '')} onChange={e => setField('primaryInjection.results.shortTime.toleranceMax', e.target.value ? `${e.target.value}%` : '')} readOnly={!isEditing} className="report-input" style={{ textAlign: 'center', width: '50px' }} />
                    <span>%</span>
                  </div>
                </td>
                <td><input value={formData.primaryInjection?.results?.shortTime?.ratedAmperes2 || ''} onChange={e => setField('primaryInjection.results.shortTime.ratedAmperes2', e.target.value)} readOnly={!isEditing} className="report-input" style={{ textAlign: 'center', width: '100%' }} /></td>
                <td><input value={formData.primaryInjection?.results?.shortTime?.toleranceMin2 || ''} onChange={e => setField('primaryInjection.results.shortTime.toleranceMin2', e.target.value)} readOnly={!isEditing} className="report-input" style={{ textAlign: 'center', width: '100%' }} /></td>
                <td><input value={formData.primaryInjection?.results?.shortTime?.toleranceMax2 || ''} onChange={e => setField('primaryInjection.results.shortTime.toleranceMax2', e.target.value)} readOnly={!isEditing} className="report-input" style={{ textAlign: 'center', width: '100%' }} /></td>
                <td><input value={formData.primaryInjection?.results?.shortTime?.pole1?.a || ''} onChange={e => setField('primaryInjection.results.shortTime.pole1.a', e.target.value)} readOnly={!isEditing} className="report-input" style={{ textAlign: 'center', width: '100%' }} /></td>
                <td><input value={formData.primaryInjection?.results?.shortTime?.pole2?.a || ''} onChange={e => setField('primaryInjection.results.shortTime.pole2.a', e.target.value)} readOnly={!isEditing} className="report-input" style={{ textAlign: 'center', width: '100%' }} /></td>
                <td><input value={formData.primaryInjection?.results?.shortTime?.pole3?.a || ''} onChange={e => setField('primaryInjection.results.shortTime.pole3.a', e.target.value)} readOnly={!isEditing} className="report-input" style={{ textAlign: 'center', width: '100%' }} /></td>
              </tr>

              {/* Instantaneous - Row 1 */}
              <tr>
                <td rowSpan={2} style={{ fontWeight: 600 }}>Instantaneous</td>
                <td><input value={formData.primaryInjection?.results?.instantaneous?.ratedAmperes1 || ''} onChange={e => setField('primaryInjection.results.instantaneous.ratedAmperes1', e.target.value)} readOnly={!isEditing} className="report-input" style={{ textAlign: 'center', width: '100%' }} /></td>
                <td colSpan={2} style={{ textAlign: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                    <input value={(formData.primaryInjection?.results?.instantaneous?.multiplier || '').replace(/%/g, '')} onChange={e => setField('primaryInjection.results.instantaneous.multiplier', e.target.value ? `${e.target.value}%` : '')} readOnly={!isEditing} className="report-input" style={{ textAlign: 'center', width: '70px' }} />
                    <span>%</span>
                  </div>
                </td>
                <td><input value={formData.primaryInjection?.results?.instantaneous?.testAmperes1 || ''} onChange={e => setField('primaryInjection.results.instantaneous.testAmperes1', e.target.value)} readOnly={!isEditing} className="report-input" style={{ textAlign: 'center', width: '100%' }} /></td>
                <td><input value={formData.primaryInjection?.results?.instantaneous?.toleranceMin1 || ''} onChange={e => setField('primaryInjection.results.instantaneous.toleranceMin1', e.target.value)} readOnly={!isEditing} className="report-input" style={{ textAlign: 'center', width: '100%' }} /></td>
                <td><input value={formData.primaryInjection?.results?.instantaneous?.toleranceMax1 || ''} onChange={e => setField('primaryInjection.results.instantaneous.toleranceMax1', e.target.value)} readOnly={!isEditing} className="report-input" style={{ textAlign: 'center', width: '100%' }} /></td>
                <td><input value={formData.primaryInjection?.results?.instantaneous?.pole1?.sec || ''} onChange={e => setField('primaryInjection.results.instantaneous.pole1.sec', e.target.value)} readOnly={!isEditing} className="report-input" style={{ textAlign: 'center', width: '100%' }} /></td>
                <td><input value={formData.primaryInjection?.results?.instantaneous?.pole2?.sec || ''} onChange={e => setField('primaryInjection.results.instantaneous.pole2.sec', e.target.value)} readOnly={!isEditing} className="report-input" style={{ textAlign: 'center', width: '100%' }} /></td>
                <td><input value={formData.primaryInjection?.results?.instantaneous?.pole3?.sec || ''} onChange={e => setField('primaryInjection.results.instantaneous.pole3.sec', e.target.value)} readOnly={!isEditing} className="report-input" style={{ textAlign: 'center', width: '100%' }} /></td>
              </tr>
              {/* Instantaneous - Row 2 */}
              <tr>
                <td></td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                    <input value={(formData.primaryInjection?.results?.instantaneous?.toleranceMin || '').replace(/%/g, '')} onChange={e => setField('primaryInjection.results.instantaneous.toleranceMin', e.target.value ? `${e.target.value}%` : '')} readOnly={!isEditing} className="report-input" style={{ textAlign: 'center', width: '50px' }} />
                    <span>%</span>
                  </div>
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                    <input value={(formData.primaryInjection?.results?.instantaneous?.toleranceMax || '').replace(/%/g, '')} onChange={e => setField('primaryInjection.results.instantaneous.toleranceMax', e.target.value ? `${e.target.value}%` : '')} readOnly={!isEditing} className="report-input" style={{ textAlign: 'center', width: '50px' }} />
                    <span>%</span>
                  </div>
                </td>
                <td><input value={formData.primaryInjection?.results?.instantaneous?.ratedAmperes2 || ''} onChange={e => setField('primaryInjection.results.instantaneous.ratedAmperes2', e.target.value)} readOnly={!isEditing} className="report-input" style={{ textAlign: 'center', width: '100%' }} /></td>
                <td><input value={formData.primaryInjection?.results?.instantaneous?.toleranceMin2 || ''} onChange={e => setField('primaryInjection.results.instantaneous.toleranceMin2', e.target.value)} readOnly={!isEditing} className="report-input" style={{ textAlign: 'center', width: '100%' }} /></td>
                <td><input value={formData.primaryInjection?.results?.instantaneous?.toleranceMax2 || ''} onChange={e => setField('primaryInjection.results.instantaneous.toleranceMax2', e.target.value)} readOnly={!isEditing} className="report-input" style={{ textAlign: 'center', width: '100%' }} /></td>
                <td><input value={formData.primaryInjection?.results?.instantaneous?.pole1?.a || ''} onChange={e => setField('primaryInjection.results.instantaneous.pole1.a', e.target.value)} readOnly={!isEditing} className="report-input" style={{ textAlign: 'center', width: '100%' }} /></td>
                <td><input value={formData.primaryInjection?.results?.instantaneous?.pole2?.a || ''} onChange={e => setField('primaryInjection.results.instantaneous.pole2.a', e.target.value)} readOnly={!isEditing} className="report-input" style={{ textAlign: 'center', width: '100%' }} /></td>
                <td><input value={formData.primaryInjection?.results?.instantaneous?.pole3?.a || ''} onChange={e => setField('primaryInjection.results.instantaneous.pole3.a', e.target.value)} readOnly={!isEditing} className="report-input" style={{ textAlign: 'center', width: '100%' }} /></td>
              </tr>

              {/* Ground Fault - Row 1 */}
              <tr>
                <td rowSpan={2} style={{ fontWeight: 600 }}>Ground Fault</td>
                <td><input value={formData.primaryInjection?.results?.groundFault?.ratedAmperes1 || ''} onChange={e => setField('primaryInjection.results.groundFault.ratedAmperes1', e.target.value)} readOnly={!isEditing} className="report-input" style={{ textAlign: 'center', width: '100%' }} /></td>
                <td colSpan={2} style={{ textAlign: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                    <input value={(formData.primaryInjection?.results?.groundFault?.multiplier || '').replace(/%/g, '')} onChange={e => setField('primaryInjection.results.groundFault.multiplier', e.target.value ? `${e.target.value}%` : '')} readOnly={!isEditing} className="report-input" style={{ textAlign: 'center', width: '70px' }} />
                    <span>%</span>
                  </div>
                </td>
                <td><input value={formData.primaryInjection?.results?.groundFault?.testAmperes1 || ''} onChange={e => setField('primaryInjection.results.groundFault.testAmperes1', e.target.value)} readOnly={!isEditing} className="report-input" style={{ textAlign: 'center', width: '100%' }} /></td>
                <td><input value={formData.primaryInjection?.results?.groundFault?.toleranceMin1 || ''} onChange={e => setField('primaryInjection.results.groundFault.toleranceMin1', e.target.value)} readOnly={!isEditing} className="report-input" style={{ textAlign: 'center', width: '100%' }} /></td>
                <td><input value={formData.primaryInjection?.results?.groundFault?.toleranceMax1 || ''} onChange={e => setField('primaryInjection.results.groundFault.toleranceMax1', e.target.value)} readOnly={!isEditing} className="report-input" style={{ textAlign: 'center', width: '100%' }} /></td>
                <td><input value={formData.primaryInjection?.results?.groundFault?.pole1?.sec || ''} onChange={e => setField('primaryInjection.results.groundFault.pole1.sec', e.target.value)} readOnly={!isEditing} className="report-input" style={{ textAlign: 'center', width: '100%' }} /></td>
                <td><input value={formData.primaryInjection?.results?.groundFault?.pole2?.sec || ''} onChange={e => setField('primaryInjection.results.groundFault.pole2.sec', e.target.value)} readOnly={!isEditing} className="report-input" style={{ textAlign: 'center', width: '100%' }} /></td>
                <td><input value={formData.primaryInjection?.results?.groundFault?.pole3?.sec || ''} onChange={e => setField('primaryInjection.results.groundFault.pole3.sec', e.target.value)} readOnly={!isEditing} className="report-input" style={{ textAlign: 'center', width: '100%' }} /></td>
              </tr>
              {/* Ground Fault - Row 2 (GFPU) */}
              <tr>
                <td style={{ fontSize: '0.8rem', color: '#666' }}>GFPU</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                    <input value={(formData.primaryInjection?.results?.groundFault?.toleranceMin || '').replace(/%/g, '')} onChange={e => setField('primaryInjection.results.groundFault.toleranceMin', e.target.value ? `${e.target.value}%` : '')} readOnly={!isEditing} className="report-input" style={{ textAlign: 'center', width: '50px' }} />
                    <span>%</span>
                  </div>
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                    <input value={(formData.primaryInjection?.results?.groundFault?.toleranceMax || '').replace(/%/g, '')} onChange={e => setField('primaryInjection.results.groundFault.toleranceMax', e.target.value ? `${e.target.value}%` : '')} readOnly={!isEditing} className="report-input" style={{ textAlign: 'center', width: '50px' }} />
                    <span>%</span>
                  </div>
                </td>
                <td><input value={formData.primaryInjection?.results?.groundFault?.ratedAmperes2 || ''} onChange={e => setField('primaryInjection.results.groundFault.ratedAmperes2', e.target.value)} readOnly={!isEditing} className="report-input" style={{ textAlign: 'center', width: '100%' }} /></td>
                <td><input value={formData.primaryInjection?.results?.groundFault?.toleranceMin2 || ''} onChange={e => setField('primaryInjection.results.groundFault.toleranceMin2', e.target.value)} readOnly={!isEditing} className="report-input" style={{ textAlign: 'center', width: '100%' }} /></td>
                <td><input value={formData.primaryInjection?.results?.groundFault?.toleranceMax2 || ''} onChange={e => setField('primaryInjection.results.groundFault.toleranceMax2', e.target.value)} readOnly={!isEditing} className="report-input" style={{ textAlign: 'center', width: '100%' }} /></td>
                <td><input value={formData.primaryInjection?.results?.groundFault?.pole1?.a || ''} onChange={e => setField('primaryInjection.results.groundFault.pole1.a', e.target.value)} readOnly={!isEditing} className="report-input" style={{ textAlign: 'center', width: '100%' }} /></td>
                <td><input value={formData.primaryInjection?.results?.groundFault?.pole2?.a || ''} onChange={e => setField('primaryInjection.results.groundFault.pole2.a', e.target.value)} readOnly={!isEditing} className="report-input" style={{ textAlign: 'center', width: '100%' }} /></td>
                <td><input value={formData.primaryInjection?.results?.groundFault?.pole3?.a || ''} onChange={e => setField('primaryInjection.results.groundFault.pole3.a', e.target.value)} readOnly={!isEditing} className="report-input" style={{ textAlign: 'center', width: '100%' }} /></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Test Equipment Used */}
      <section className="report-section">
        <div className="section-divider"></div>
        <h2 className="section-title">Test Equipment Used</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="form-field">
            <label>Megohmmeter:</label>
            <input value={formData.testEquipment?.megohmmeter?.name || ''} onChange={e => setField('testEquipment.megohmmeter.name', e.target.value)} readOnly={!isEditing} className="report-input" />
          </div>
          <div className="form-field">
            <label>Serial Number:</label>
            <input value={formData.testEquipment?.megohmmeter?.serialNumber || ''} onChange={e => setField('testEquipment.megohmmeter.serialNumber', e.target.value)} readOnly={!isEditing} className="report-input" />
          </div>
          <div className="form-field">
            <label>AMP ID:</label>
            <input value={formData.testEquipment?.megohmmeter?.ampId || ''} onChange={e => setField('testEquipment.megohmmeter.ampId', e.target.value)} readOnly={!isEditing} className="report-input" />
          </div>
          <div className="form-field">
            <label>Low Resistance Ohmmeter:</label>
            <input value={formData.testEquipment?.lowResistanceOhmmeter?.name || ''} onChange={e => setField('testEquipment.lowResistanceOhmmeter.name', e.target.value)} readOnly={!isEditing} className="report-input" />
          </div>
          <div className="form-field">
            <label>Serial Number:</label>
            <input value={formData.testEquipment?.lowResistanceOhmmeter?.serialNumber || ''} onChange={e => setField('testEquipment.lowResistanceOhmmeter.serialNumber', e.target.value)} readOnly={!isEditing} className="report-input" />
          </div>
          <div className="form-field">
            <label>AMP ID:</label>
            <input value={formData.testEquipment?.lowResistanceOhmmeter?.ampId || ''} onChange={e => setField('testEquipment.lowResistanceOhmmeter.ampId', e.target.value)} readOnly={!isEditing} className="report-input" />
          </div>
          <div className="form-field">
            <label>Primary Injection Test Set:</label>
            <input value={formData.testEquipment?.primaryInjectionTestSet?.name || ''} onChange={e => setField('testEquipment.primaryInjectionTestSet.name', e.target.value)} readOnly={!isEditing} className="report-input" />
          </div>
          <div className="form-field">
            <label>Serial Number:</label>
            <input value={formData.testEquipment?.primaryInjectionTestSet?.serialNumber || ''} onChange={e => setField('testEquipment.primaryInjectionTestSet.serialNumber', e.target.value)} readOnly={!isEditing} className="report-input" />
          </div>
          <div className="form-field">
            <label>AMP ID:</label>
            <input value={formData.testEquipment?.primaryInjectionTestSet?.ampId || ''} onChange={e => setField('testEquipment.primaryInjectionTestSet.ampId', e.target.value)} readOnly={!isEditing} className="report-input" />
          </div>
        </div>
      </section>

      {/* Comments */}
      <section className="report-section">
        <div className="section-divider"></div>
        <h2 className="section-title">Comments</h2>
        <textarea
          className={`report-textarea ${!isEditing ? 'readonly' : ''}`}
          value={formData.comments || ''}
          onChange={e => setField('comments', e.target.value)}
          readOnly={!isEditing}
          rows={4}
        />
      </section>
    </div>
  );
};

export default LowVoltageCircuitBreakerReport;

