/**
 * Automatic Transfer Switch Report - Desktop Version
 */

import React, { useState, useEffect } from 'react';
import {
  getTCF, fahrenheitToCelsius, multiplyByTCF,
  VISUAL_INSPECTION_OPTIONS, CONTACT_RESISTANCE_UNITS
} from './BaseReport';
import './ReportStyles.css';

interface AutomaticTransferSwitchReportProps {
  job: any;
  reportData: any;
  onSave: (data: any) => void;
}

const DEFAULT_VISUAL_INSPECTION_ITEMS = [
  { id: '7.24.A.1', description: 'Compare equipment nameplate data with drawings and specifications.', result: '', comments: '' },
  { id: '7.24.A.2', description: 'Inspect physical and mechanical condition.', result: '', comments: '' },
  { id: '7.24.A.3', description: 'Inspect anchorage, alignment, grounding, and required area clearances.', result: '', comments: '' },
  { id: '7.24.A.4', description: 'Verify the unit is clean.', result: '', comments: '' },
  { id: '7.24.A.5', description: 'Verify that transfer switch and bypass-isolation switch sizes and types correspond to drawings.', result: '', comments: '' },
  { id: '7.24.A.6', description: 'Verify that wiring connections are tight.', result: '', comments: '' },
  { id: '7.24.A.7', description: 'Verify tightness of bolted bus joints by calibrated torque-wrench method.', result: '', comments: '' },
  { id: '7.24.A.8', description: 'Confirm correct operation and sequencing of electrical and mechanical interlock systems.', result: '', comments: '' },
  { id: '7.24.A.9', description: 'Verify appropriate lubrication on moving current-carrying parts.', result: '', comments: '' },
  { id: '7.24.A.10', description: 'Inspect insulators for evidence of physical damage or contaminated surfaces.', result: '', comments: '' },
  { id: '7.24.A.11', description: 'Verify correct barrier and shutter installation and operation.', result: '', comments: '' },
  { id: '7.24.A.12', description: 'Exercise all active components.', result: '', comments: '' },
  { id: '7.24.A.13', description: 'Inspect mechanical indicating devices for correct operation.', result: '', comments: '' }
];

const createDefaultFormData = () => ({
  customer: '',
  address: '',
  date: new Date().toISOString().split('T')[0],
  technicians: '',
  jobNumber: '',
  substation: '',
  eqptLocation: '',
  identifier: '',
  userName: '',
  temperature: { fahrenheit: 68, celsius: 20, tcf: 1, humidity: 0 },
  // Nameplate Data
  manufacturer: '',
  catalogNumber: '',
  serialNumber: '',
  type: '',
  ratedVoltage: '',
  ratedCurrent: '',
  poles: '',
  withstandRating: '',
  controlVoltage: '',
  transferType: '',
  // Visual Inspection
  visualInspectionItems: [...DEFAULT_VISUAL_INSPECTION_ITEMS],
  // Contact Resistance
  contactResistance: {
    normal: { aPhase: '', bPhase: '', cPhase: '', neutral: '' },
    emergency: { aPhase: '', bPhase: '', cPhase: '', neutral: '' },
    unit: 'µΩ'
  },
  // Insulation Resistance
  insulationResistance: {
    testVoltage: '1000V', unit: 'MΩ',
    measured: {
      normalToGround: { a: '', b: '', c: '', n: '' },
      emergencyToGround: { a: '', b: '', c: '', n: '' },
      normalToEmergency: { a: '', b: '', c: '', n: '' }
    },
    corrected: {
      normalToGround: { a: '', b: '', c: '', n: '' },
      emergencyToGround: { a: '', b: '', c: '', n: '' },
      normalToEmergency: { a: '', b: '', c: '', n: '' }
    }
  },
  // Transfer Tests
  transferTests: {
    normalToEmergency: { time: '', unit: 'sec' },
    emergencyToNormal: { time: '', unit: 'sec' },
    retransfer: { time: '', unit: 'sec' }
  },
  // Engine Start Tests
  engineStartTests: {
    voltagePickup: '',
    voltageDropout: '',
    timeDelayStart: '',
    timeDelayTransfer: '',
    timeDelayRetransfer: ''
  },
  // Test Equipment
  testEquipment: {
    megohmmeter: { name: '', serialNumber: '', ampId: '' },
    lowResistanceOhmmeter: { name: '', serialNumber: '', ampId: '' },
    powerAnalyzer: { name: '', serialNumber: '', ampId: '' }
  },
  comments: '',
  status: 'PASS'
});

const AutomaticTransferSwitchReport: React.FC<AutomaticTransferSwitchReportProps> = ({ job, reportData, onSave }) => {
  const [formData, setFormData] = useState<any>(createDefaultFormData());
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (reportData) {
      const merged = { ...createDefaultFormData(), ...reportData };
      if (!merged.visualInspectionItems?.length) merged.visualInspectionItems = [...DEFAULT_VISUAL_INSPECTION_ITEMS];
      setFormData(merged);
    }
  }, [reportData]);

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

  useEffect(() => {
    const fahrenheit = formData.temperature?.fahrenheit || 68;
    const celsius = fahrenheitToCelsius(fahrenheit);
    const tcf = getTCF(celsius);
    if (celsius !== formData.temperature?.celsius || tcf !== formData.temperature?.tcf) {
      setFormData((prev: any) => ({ ...prev, temperature: { ...prev.temperature, celsius, tcf } }));
    }
  }, [formData.temperature?.fahrenheit]);

  useEffect(() => {
    const tcf = formData.temperature?.tcf || 1;
    const measured = formData.insulationResistance?.measured || {};
    const calcCorrected = (m: any) => ({
      a: multiplyByTCF(m?.a || '', tcf),
      b: multiplyByTCF(m?.b || '', tcf),
      c: multiplyByTCF(m?.c || '', tcf),
      n: multiplyByTCF(m?.n || '', tcf)
    });
    setFormData((prev: any) => ({
      ...prev,
      insulationResistance: {
        ...prev.insulationResistance,
        corrected: {
          normalToGround: calcCorrected(measured.normalToGround),
          emergencyToGround: calcCorrected(measured.emergencyToGround),
          normalToEmergency: calcCorrected(measured.normalToEmergency)
        }
      }
    }));
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

  return (
    <div className="report-container">
      <div className="report-header-bar">
        <h1 className="report-title">Automatic Transfer Switch ATS</h1>
        <div className="report-actions">
          <button onClick={() => setField('status', formData.status === 'PASS' ? 'FAIL' : 'PASS')} disabled={!isEditing} className={`status-btn ${formData.status === 'PASS' ? 'pass' : 'fail'}`}>
            {formData.status}
          </button>
          {!isEditing ? (
            <button onClick={() => setIsEditing(true)} className="btn-primary">Edit Report</button>
          ) : (
            <button onClick={handleSave} disabled={saving} className="btn-save">{saving ? 'Saving...' : 'Save Report'}</button>
          )}
        </div>
      </div>

      {/* Job Information */}
      <section className="report-section">
        <div className="section-divider"></div>
        <h2 className="section-title">Job Information</h2>
        <div className="form-grid-6">
          <div className="form-field"><label>Customer:</label><input value={formData.customer || ''} onChange={e => setField('customer', e.target.value)} readOnly={!isEditing} className="report-input" /></div>
          <div className="form-field"><label>Address:</label><input value={formData.address || ''} onChange={e => setField('address', e.target.value)} readOnly={!isEditing} className="report-input" /></div>
          <div className="form-field"><label>Job #:</label><input value={formData.jobNumber || ''} onChange={e => setField('jobNumber', e.target.value)} readOnly={!isEditing} className="report-input" /></div>
          <div className="form-field"><label>Technicians:</label><input value={formData.technicians || ''} onChange={e => setField('technicians', e.target.value)} readOnly={!isEditing} className="report-input" /></div>
          <div className="form-field"><label>Date:</label><input type="date" value={formData.date || ''} onChange={e => setField('date', e.target.value)} readOnly={!isEditing} className="report-input" /></div>
          <div className="form-field"><label>Identifier:</label><input value={formData.identifier || ''} onChange={e => setField('identifier', e.target.value)} readOnly={!isEditing} className="report-input" /></div>
          <div className="form-field temp-field">
            <label>Temp:</label>
            <div className="temp-inputs">
              <input type="number" value={formData.temperature?.fahrenheit ?? 68} onChange={e => setField('temperature.fahrenheit', Number(e.target.value))} readOnly={!isEditing} className="report-input temp-input" />
              <span>°F</span><span className="temp-celsius">{formData.temperature?.celsius ?? 20}</span><span>°C</span>
              <span className="temp-label">TCF</span><span className="temp-value">{(formData.temperature?.tcf ?? 1).toFixed(3)}</span>
            </div>
          </div>
          <div className="form-field"><label>Substation:</label><input value={formData.substation || ''} onChange={e => setField('substation', e.target.value)} readOnly={!isEditing} className="report-input" /></div>
          <div className="form-field"><label>Eqpt. Location:</label><input value={formData.eqptLocation || ''} onChange={e => setField('eqptLocation', e.target.value)} readOnly={!isEditing} className="report-input" /></div>
        </div>
      </section>

      {/* Nameplate Data */}
      <section className="report-section">
        <div className="section-divider"></div>
        <h2 className="section-title">Nameplate Data</h2>
        <div className="enclosure-grid">
          <div className="enclosure-row">
            <div className="enclosure-cell"><strong>Manufacturer:</strong><input value={formData.manufacturer || ''} onChange={e => setField('manufacturer', e.target.value)} readOnly={!isEditing} className="report-input" /></div>
            <div className="enclosure-cell"><strong>Catalog #:</strong><input value={formData.catalogNumber || ''} onChange={e => setField('catalogNumber', e.target.value)} readOnly={!isEditing} className="report-input" /></div>
            <div className="enclosure-cell"><strong>Serial #:</strong><input value={formData.serialNumber || ''} onChange={e => setField('serialNumber', e.target.value)} readOnly={!isEditing} className="report-input" /></div>
            <div className="enclosure-cell"><strong>Type:</strong><input value={formData.type || ''} onChange={e => setField('type', e.target.value)} readOnly={!isEditing} className="report-input" /></div>
          </div>
          <div className="enclosure-row">
            <div className="enclosure-cell"><strong>Rated Voltage:</strong><input value={formData.ratedVoltage || ''} onChange={e => setField('ratedVoltage', e.target.value)} readOnly={!isEditing} className="report-input" /></div>
            <div className="enclosure-cell"><strong>Rated Current (A):</strong><input value={formData.ratedCurrent || ''} onChange={e => setField('ratedCurrent', e.target.value)} readOnly={!isEditing} className="report-input" /></div>
            <div className="enclosure-cell"><strong>Poles:</strong><input value={formData.poles || ''} onChange={e => setField('poles', e.target.value)} readOnly={!isEditing} className="report-input" /></div>
            <div className="enclosure-cell"><strong>Withstand Rating (kA):</strong><input value={formData.withstandRating || ''} onChange={e => setField('withstandRating', e.target.value)} readOnly={!isEditing} className="report-input" /></div>
          </div>
          <div className="enclosure-row">
            <div className="enclosure-cell"><strong>Control Voltage:</strong><input value={formData.controlVoltage || ''} onChange={e => setField('controlVoltage', e.target.value)} readOnly={!isEditing} className="report-input" /></div>
            <div className="enclosure-cell"><strong>Transfer Type:</strong><input value={formData.transferType || ''} onChange={e => setField('transferType', e.target.value)} readOnly={!isEditing} className="report-input" /></div>
          </div>
        </div>
      </section>

      {/* Visual and Mechanical Inspection */}
      <section className="report-section">
        <div className="section-divider"></div>
        <h2 className="section-title">Visual and Mechanical Inspection</h2>
        <p className="section-subtitle">Per NETA ATS Section 7.24</p>
        <div className="table-container">
          <table className="report-table">
            <thead>
              <tr><th style={{ width: '10%' }}>#</th><th style={{ width: '55%' }}>Description</th><th style={{ width: '15%' }}>Result</th><th style={{ width: '20%' }}>Comments</th></tr>
            </thead>
            <tbody>
              {formData.visualInspectionItems.map((item: any, idx: number) => (
                <tr key={item.id || idx}>
                  <td>{item.id}</td>
                  <td className="text-left">{item.description}</td>
                  <td>
                    <select value={item.result} onChange={e => updateVisualInspection(idx, 'result', e.target.value)} disabled={!isEditing} className="report-input">
                      {VISUAL_INSPECTION_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </td>
                  <td><input value={item.comments || ''} onChange={e => updateVisualInspection(idx, 'comments', e.target.value)} readOnly={!isEditing} className="report-input" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Contact Resistance */}
      <section className="report-section">
        <div className="section-divider"></div>
        <h2 className="section-title">Electrical Tests - Contact Resistance</h2>
        <div className="table-container">
          <table className="report-table">
            <thead>
              <tr><th></th><th>A Phase</th><th>B Phase</th><th>C Phase</th><th>Neutral</th><th>Unit</th></tr>
            </thead>
            <tbody>
              <tr>
                <td>Normal</td>
                <td><input value={formData.contactResistance?.normal?.aPhase || ''} onChange={e => setField('contactResistance.normal.aPhase', e.target.value)} readOnly={!isEditing} className="report-input" /></td>
                <td><input value={formData.contactResistance?.normal?.bPhase || ''} onChange={e => setField('contactResistance.normal.bPhase', e.target.value)} readOnly={!isEditing} className="report-input" /></td>
                <td><input value={formData.contactResistance?.normal?.cPhase || ''} onChange={e => setField('contactResistance.normal.cPhase', e.target.value)} readOnly={!isEditing} className="report-input" /></td>
                <td><input value={formData.contactResistance?.normal?.neutral || ''} onChange={e => setField('contactResistance.normal.neutral', e.target.value)} readOnly={!isEditing} className="report-input" /></td>
                <td rowSpan={2}>
                  <select value={formData.contactResistance?.unit || 'µΩ'} onChange={e => setField('contactResistance.unit', e.target.value)} disabled={!isEditing} className="report-input">
                    {CONTACT_RESISTANCE_UNITS.map(u => <option key={u.symbol} value={u.symbol}>{u.symbol}</option>)}
                  </select>
                </td>
              </tr>
              <tr>
                <td>Emergency</td>
                <td><input value={formData.contactResistance?.emergency?.aPhase || ''} onChange={e => setField('contactResistance.emergency.aPhase', e.target.value)} readOnly={!isEditing} className="report-input" /></td>
                <td><input value={formData.contactResistance?.emergency?.bPhase || ''} onChange={e => setField('contactResistance.emergency.bPhase', e.target.value)} readOnly={!isEditing} className="report-input" /></td>
                <td><input value={formData.contactResistance?.emergency?.cPhase || ''} onChange={e => setField('contactResistance.emergency.cPhase', e.target.value)} readOnly={!isEditing} className="report-input" /></td>
                <td><input value={formData.contactResistance?.emergency?.neutral || ''} onChange={e => setField('contactResistance.emergency.neutral', e.target.value)} readOnly={!isEditing} className="report-input" /></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Transfer Tests */}
      <section className="report-section">
        <div className="section-divider"></div>
        <h2 className="section-title">Transfer Tests</h2>
        <div className="enclosure-grid">
          <div className="enclosure-row">
            <div className="enclosure-cell"><strong>Normal to Emergency:</strong><input value={formData.transferTests?.normalToEmergency?.time || ''} onChange={e => setField('transferTests.normalToEmergency.time', e.target.value)} readOnly={!isEditing} className="report-input" /><span>sec</span></div>
            <div className="enclosure-cell"><strong>Emergency to Normal:</strong><input value={formData.transferTests?.emergencyToNormal?.time || ''} onChange={e => setField('transferTests.emergencyToNormal.time', e.target.value)} readOnly={!isEditing} className="report-input" /><span>sec</span></div>
            <div className="enclosure-cell"><strong>Retransfer Time:</strong><input value={formData.transferTests?.retransfer?.time || ''} onChange={e => setField('transferTests.retransfer.time', e.target.value)} readOnly={!isEditing} className="report-input" /><span>sec</span></div>
          </div>
        </div>
      </section>

      {/* Engine Start Settings */}
      <section className="report-section">
        <div className="section-divider"></div>
        <h2 className="section-title">Engine Start Settings</h2>
        <div className="enclosure-grid">
          <div className="enclosure-row">
            <div className="enclosure-cell"><strong>Voltage Pickup (%):</strong><input value={formData.engineStartTests?.voltagePickup || ''} onChange={e => setField('engineStartTests.voltagePickup', e.target.value)} readOnly={!isEditing} className="report-input" /></div>
            <div className="enclosure-cell"><strong>Voltage Dropout (%):</strong><input value={formData.engineStartTests?.voltageDropout || ''} onChange={e => setField('engineStartTests.voltageDropout', e.target.value)} readOnly={!isEditing} className="report-input" /></div>
          </div>
          <div className="enclosure-row">
            <div className="enclosure-cell"><strong>Time Delay Start (sec):</strong><input value={formData.engineStartTests?.timeDelayStart || ''} onChange={e => setField('engineStartTests.timeDelayStart', e.target.value)} readOnly={!isEditing} className="report-input" /></div>
            <div className="enclosure-cell"><strong>Time Delay Transfer (sec):</strong><input value={formData.engineStartTests?.timeDelayTransfer || ''} onChange={e => setField('engineStartTests.timeDelayTransfer', e.target.value)} readOnly={!isEditing} className="report-input" /></div>
            <div className="enclosure-cell"><strong>Time Delay Retransfer (sec):</strong><input value={formData.engineStartTests?.timeDelayRetransfer || ''} onChange={e => setField('engineStartTests.timeDelayRetransfer', e.target.value)} readOnly={!isEditing} className="report-input" /></div>
          </div>
        </div>
      </section>

      {/* Test Equipment Used */}
      <section className="report-section">
        <div className="section-divider"></div>
        <h2 className="section-title">Test Equipment Used</h2>
        <div className="equipment-grid">
          <div className="equipment-row">
            <label>Megohmeter:</label>
            <input value={formData.testEquipment?.megohmmeter?.name || ''} onChange={e => setField('testEquipment.megohmmeter.name', e.target.value)} readOnly={!isEditing} className="report-input" placeholder="Name" />
            <label>Serial #:</label>
            <input value={formData.testEquipment?.megohmmeter?.serialNumber || ''} onChange={e => setField('testEquipment.megohmmeter.serialNumber', e.target.value)} readOnly={!isEditing} className="report-input" />
            <label>AMP ID:</label>
            <input value={formData.testEquipment?.megohmmeter?.ampId || ''} onChange={e => setField('testEquipment.megohmmeter.ampId', e.target.value)} readOnly={!isEditing} className="report-input" />
          </div>
          <div className="equipment-row">
            <label>Low Resistance Ohmmeter:</label>
            <input value={formData.testEquipment?.lowResistanceOhmmeter?.name || ''} onChange={e => setField('testEquipment.lowResistanceOhmmeter.name', e.target.value)} readOnly={!isEditing} className="report-input" placeholder="Name" />
            <label>Serial #:</label>
            <input value={formData.testEquipment?.lowResistanceOhmmeter?.serialNumber || ''} onChange={e => setField('testEquipment.lowResistanceOhmmeter.serialNumber', e.target.value)} readOnly={!isEditing} className="report-input" />
            <label>AMP ID:</label>
            <input value={formData.testEquipment?.lowResistanceOhmmeter?.ampId || ''} onChange={e => setField('testEquipment.lowResistanceOhmmeter.ampId', e.target.value)} readOnly={!isEditing} className="report-input" />
          </div>
          <div className="equipment-row">
            <label>Power Analyzer:</label>
            <input value={formData.testEquipment?.powerAnalyzer?.name || ''} onChange={e => setField('testEquipment.powerAnalyzer.name', e.target.value)} readOnly={!isEditing} className="report-input" placeholder="Name" />
            <label>Serial #:</label>
            <input value={formData.testEquipment?.powerAnalyzer?.serialNumber || ''} onChange={e => setField('testEquipment.powerAnalyzer.serialNumber', e.target.value)} readOnly={!isEditing} className="report-input" />
            <label>AMP ID:</label>
            <input value={formData.testEquipment?.powerAnalyzer?.ampId || ''} onChange={e => setField('testEquipment.powerAnalyzer.ampId', e.target.value)} readOnly={!isEditing} className="report-input" />
          </div>
        </div>
      </section>

      {/* Comments */}
      <section className="report-section">
        <div className="section-divider"></div>
        <h2 className="section-title">Comments</h2>
        <textarea className={`report-textarea ${!isEditing ? 'readonly' : ''}`} value={formData.comments || ''} onChange={e => setField('comments', e.target.value)} readOnly={!isEditing} rows={4} />
      </section>
    </div>
  );
};

export default AutomaticTransferSwitchReport;

