/**
 * Medium Voltage Circuit Breaker Report - Desktop Version
 */

import React, { useState, useEffect } from 'react';
import {
  getTCF, fahrenheitToCelsius, multiplyByTCF,
  VISUAL_INSPECTION_OPTIONS, TEST_VOLTAGE_OPTIONS, IR_UNITS, CONTACT_RESISTANCE_UNITS
} from './BaseReport';
import './ReportStyles.css';

interface MediumVoltageCircuitBreakerReportProps {
  job: any;
  reportData: any;
  onSave: (data: any) => void;
}

const DEFAULT_VISUAL_INSPECTION_ITEMS = [
  { id: '7.6.2.A.1', description: 'Compare equipment nameplate data with drawings and specifications.', result: '', comments: '' },
  { id: '7.6.2.A.2', description: 'Inspect physical and mechanical condition.', result: '', comments: '' },
  { id: '7.6.2.A.3', description: 'Inspect anchorage and alignment.', result: '', comments: '' },
  { id: '7.6.2.A.4', description: 'Verify that all maintenance devices are available for servicing and operating the breaker.', result: '', comments: '' },
  { id: '7.6.2.A.5', description: 'Verify the unit is clean.', result: '', comments: '' },
  { id: '7.6.2.A.6', description: 'Verify the arc chutes are intact and secure.', result: '', comments: '' },
  { id: '7.6.2.A.7', description: 'Inspect moving and stationary contacts for condition and alignment.', result: '', comments: '' },
  { id: '7.6.2.A.8', description: 'Verify that primary and secondary contact wipe and other dimensions vital to satisfactory operation are correct.', result: '', comments: '' },
  { id: '7.6.2.A.9', description: 'Perform all mechanical operator and contact alignment tests.', result: '', comments: '' },
  { id: '7.6.2.A.10', description: 'Use of a low-resistance ohmmeter in accordance with Section 7.6.2.B.1.', result: '', comments: '' },
  { id: '7.6.2.A.11', description: 'Verify cell fit and element alignment.', result: '', comments: '' },
  { id: '7.6.2.A.12', description: 'Verify racking mechanism operation.', result: '', comments: '' },
  { id: '7.6.2.A.13', description: 'Verify appropriate lubrication on moving current-carrying parts.', result: '', comments: '' },
  { id: '7.6.2.A.14', description: 'Verify correct operation of all interlocks.', result: '', comments: '' },
  { id: '7.6.2.A.15', description: 'Verify correct operation of charging mechanism.', result: '', comments: '' }
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
  interruptingRating: '',
  closeAndLatch: '',
  controlVoltage: '',
  mechanism: '',
  // Visual Inspection
  visualInspectionItems: [...DEFAULT_VISUAL_INSPECTION_ITEMS],
  // Contact Resistance
  contactResistance: {
    aPhase: '', bPhase: '', cPhase: '', unit: 'µΩ'
  },
  // Insulation Resistance
  insulationResistance: {
    testVoltage: '2500V', unit: 'MΩ',
    measured: { ag: '', bg: '', cg: '', ab: '', bc: '', ca: '' },
    corrected: { ag: '', bg: '', cg: '', ab: '', bc: '', ca: '' }
  },
  // Timing Tests
  timingTests: {
    close: { aPhase: '', bPhase: '', cPhase: '' },
    open: { aPhase: '', bPhase: '', cPhase: '' }
  },
  // Test Equipment
  testEquipment: {
    megohmmeter: { name: '', serialNumber: '', ampId: '' },
    lowResistanceOhmmeter: { name: '', serialNumber: '', ampId: '' },
    timingAnalyzer: { name: '', serialNumber: '', ampId: '' }
  },
  comments: '',
  status: 'PASS'
});

const MediumVoltageCircuitBreakerReport: React.FC<MediumVoltageCircuitBreakerReportProps> = ({ job, reportData, onSave }) => {
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
    const corrected = {
      ag: multiplyByTCF(measured.ag || '', tcf),
      bg: multiplyByTCF(measured.bg || '', tcf),
      cg: multiplyByTCF(measured.cg || '', tcf),
      ab: multiplyByTCF(measured.ab || '', tcf),
      bc: multiplyByTCF(measured.bc || '', tcf),
      ca: multiplyByTCF(measured.ca || '', tcf)
    };
    setFormData((prev: any) => ({
      ...prev,
      insulationResistance: { ...prev.insulationResistance, corrected }
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
        <h1 className="report-title">Medium Voltage Circuit Breaker Test Report ATS</h1>
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
            <div className="enclosure-cell"><strong>Rated Voltage (kV):</strong><input value={formData.ratedVoltage || ''} onChange={e => setField('ratedVoltage', e.target.value)} readOnly={!isEditing} className="report-input" /></div>
            <div className="enclosure-cell"><strong>Rated Current (A):</strong><input value={formData.ratedCurrent || ''} onChange={e => setField('ratedCurrent', e.target.value)} readOnly={!isEditing} className="report-input" /></div>
            <div className="enclosure-cell"><strong>Interrupting Rating (kA):</strong><input value={formData.interruptingRating || ''} onChange={e => setField('interruptingRating', e.target.value)} readOnly={!isEditing} className="report-input" /></div>
            <div className="enclosure-cell"><strong>Close & Latch (kA):</strong><input value={formData.closeAndLatch || ''} onChange={e => setField('closeAndLatch', e.target.value)} readOnly={!isEditing} className="report-input" /></div>
          </div>
          <div className="enclosure-row">
            <div className="enclosure-cell"><strong>Control Voltage:</strong><input value={formData.controlVoltage || ''} onChange={e => setField('controlVoltage', e.target.value)} readOnly={!isEditing} className="report-input" /></div>
            <div className="enclosure-cell"><strong>Mechanism:</strong><input value={formData.mechanism || ''} onChange={e => setField('mechanism', e.target.value)} readOnly={!isEditing} className="report-input" /></div>
          </div>
        </div>
      </section>

      {/* Visual and Mechanical Inspection */}
      <section className="report-section">
        <div className="section-divider"></div>
        <h2 className="section-title">Visual and Mechanical Inspection</h2>
        <p className="section-subtitle">Per NETA ATS Section 7.6.2</p>
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
              <tr><th>A Phase</th><th>B Phase</th><th>C Phase</th><th>Unit</th></tr>
            </thead>
            <tbody>
              <tr>
                <td><input value={formData.contactResistance?.aPhase || ''} onChange={e => setField('contactResistance.aPhase', e.target.value)} readOnly={!isEditing} className="report-input" /></td>
                <td><input value={formData.contactResistance?.bPhase || ''} onChange={e => setField('contactResistance.bPhase', e.target.value)} readOnly={!isEditing} className="report-input" /></td>
                <td><input value={formData.contactResistance?.cPhase || ''} onChange={e => setField('contactResistance.cPhase', e.target.value)} readOnly={!isEditing} className="report-input" /></td>
                <td>
                  <select value={formData.contactResistance?.unit || 'µΩ'} onChange={e => setField('contactResistance.unit', e.target.value)} disabled={!isEditing} className="report-input">
                    {CONTACT_RESISTANCE_UNITS.map(u => <option key={u.symbol} value={u.symbol}>{u.symbol}</option>)}
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
        <div className="ir-header-row">
          <span>Test Voltage:</span>
          <select value={formData.insulationResistance?.testVoltage || '2500V'} onChange={e => setField('insulationResistance.testVoltage', e.target.value)} disabled={!isEditing} className="report-input">
            {TEST_VOLTAGE_OPTIONS.map(v => <option key={v} value={v}>{v}</option>)}
          </select>
          <span>Unit:</span>
          <select value={formData.insulationResistance?.unit || 'MΩ'} onChange={e => setField('insulationResistance.unit', e.target.value)} disabled={!isEditing} className="report-input">
            {IR_UNITS.map(u => <option key={u.symbol} value={u.symbol}>{u.symbol}</option>)}
          </select>
        </div>
        <div className="table-container">
          <table className="report-table">
            <thead>
              <tr><th></th><th>A-G</th><th>B-G</th><th>C-G</th><th>A-B</th><th>B-C</th><th>C-A</th></tr>
            </thead>
            <tbody>
              <tr>
                <td>Measured</td>
                <td><input value={formData.insulationResistance?.measured?.ag || ''} onChange={e => setField('insulationResistance.measured.ag', e.target.value)} readOnly={!isEditing} className="report-input" /></td>
                <td><input value={formData.insulationResistance?.measured?.bg || ''} onChange={e => setField('insulationResistance.measured.bg', e.target.value)} readOnly={!isEditing} className="report-input" /></td>
                <td><input value={formData.insulationResistance?.measured?.cg || ''} onChange={e => setField('insulationResistance.measured.cg', e.target.value)} readOnly={!isEditing} className="report-input" /></td>
                <td><input value={formData.insulationResistance?.measured?.ab || ''} onChange={e => setField('insulationResistance.measured.ab', e.target.value)} readOnly={!isEditing} className="report-input" /></td>
                <td><input value={formData.insulationResistance?.measured?.bc || ''} onChange={e => setField('insulationResistance.measured.bc', e.target.value)} readOnly={!isEditing} className="report-input" /></td>
                <td><input value={formData.insulationResistance?.measured?.ca || ''} onChange={e => setField('insulationResistance.measured.ca', e.target.value)} readOnly={!isEditing} className="report-input" /></td>
              </tr>
              <tr>
                <td>Corrected</td>
                <td><input value={formData.insulationResistance?.corrected?.ag || ''} readOnly className="report-input calculated" /></td>
                <td><input value={formData.insulationResistance?.corrected?.bg || ''} readOnly className="report-input calculated" /></td>
                <td><input value={formData.insulationResistance?.corrected?.cg || ''} readOnly className="report-input calculated" /></td>
                <td><input value={formData.insulationResistance?.corrected?.ab || ''} readOnly className="report-input calculated" /></td>
                <td><input value={formData.insulationResistance?.corrected?.bc || ''} readOnly className="report-input calculated" /></td>
                <td><input value={formData.insulationResistance?.corrected?.ca || ''} readOnly className="report-input calculated" /></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Timing Tests */}
      <section className="report-section">
        <div className="section-divider"></div>
        <h2 className="section-title">Electrical Tests - Timing (ms)</h2>
        <div className="table-container">
          <table className="report-table">
            <thead>
              <tr><th></th><th>A Phase</th><th>B Phase</th><th>C Phase</th></tr>
            </thead>
            <tbody>
              <tr>
                <td>Close</td>
                <td><input value={formData.timingTests?.close?.aPhase || ''} onChange={e => setField('timingTests.close.aPhase', e.target.value)} readOnly={!isEditing} className="report-input" /></td>
                <td><input value={formData.timingTests?.close?.bPhase || ''} onChange={e => setField('timingTests.close.bPhase', e.target.value)} readOnly={!isEditing} className="report-input" /></td>
                <td><input value={formData.timingTests?.close?.cPhase || ''} onChange={e => setField('timingTests.close.cPhase', e.target.value)} readOnly={!isEditing} className="report-input" /></td>
              </tr>
              <tr>
                <td>Open</td>
                <td><input value={formData.timingTests?.open?.aPhase || ''} onChange={e => setField('timingTests.open.aPhase', e.target.value)} readOnly={!isEditing} className="report-input" /></td>
                <td><input value={formData.timingTests?.open?.bPhase || ''} onChange={e => setField('timingTests.open.bPhase', e.target.value)} readOnly={!isEditing} className="report-input" /></td>
                <td><input value={formData.timingTests?.open?.cPhase || ''} onChange={e => setField('timingTests.open.cPhase', e.target.value)} readOnly={!isEditing} className="report-input" /></td>
              </tr>
            </tbody>
          </table>
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
            <label>Timing Analyzer:</label>
            <input value={formData.testEquipment?.timingAnalyzer?.name || ''} onChange={e => setField('testEquipment.timingAnalyzer.name', e.target.value)} readOnly={!isEditing} className="report-input" placeholder="Name" />
            <label>Serial #:</label>
            <input value={formData.testEquipment?.timingAnalyzer?.serialNumber || ''} onChange={e => setField('testEquipment.timingAnalyzer.serialNumber', e.target.value)} readOnly={!isEditing} className="report-input" />
            <label>AMP ID:</label>
            <input value={formData.testEquipment?.timingAnalyzer?.ampId || ''} onChange={e => setField('testEquipment.timingAnalyzer.ampId', e.target.value)} readOnly={!isEditing} className="report-input" />
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

export default MediumVoltageCircuitBreakerReport;

