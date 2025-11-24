/**
 * Panelboard Report - Desktop Version
 * Matches the web app's PanelboardReport.tsx structure
 */

import React, { useState, useEffect } from 'react';
import {
  getTCF, fahrenheitToCelsius, multiplyByTCF,
  VISUAL_INSPECTION_OPTIONS, TEST_VOLTAGE_OPTIONS, IR_UNITS, CONTACT_RESISTANCE_UNITS
} from './BaseReport';
import './ReportStyles.css';

interface PanelboardReportProps {
  job: any;
  reportData: any;
  onSave: (data: any) => void;
}

const DEFAULT_VISUAL_INSPECTION_ITEMS = [
  { id: '7.1.A.1', description: 'Compare equipment nameplate data with drawings and specifications.', result: '', comments: '' },
  { id: '7.1.A.2', description: 'Inspect physical, electrical, and mechanical condition.', result: '', comments: '' },
  { id: '7.1.A.3', description: 'Inspect anchorage, alignment, grounding, and required area clearances.', result: '', comments: '' },
  { id: '7.1.A.4', description: 'Verify the unit is clean.', result: '', comments: '' },
  { id: '7.1.A.5', description: 'Verify that fuse and circuit breaker sizes and types correspond to drawings.', result: '', comments: '' },
  { id: '7.1.A.6', description: 'Verify that current and voltage transformer ratios correspond to drawings.', result: '', comments: '' },
  { id: '7.1.A.7', description: 'Verify that wiring connections are tight.', result: '', comments: '' },
  { id: '7.1.A.8', description: 'Verify tightness of bolted bus joints by calibrated torque-wrench method.', result: '', comments: '' },
  { id: '7.1.A.9', description: 'Confirm correct operation and sequencing of electrical and mechanical interlock systems.', result: '', comments: '' },
  { id: '7.1.A.10', description: 'Verify appropriate lubrication on moving current-carrying parts.', result: '', comments: '' },
  { id: '7.1.A.11', description: 'Inspect insulators for evidence of physical damage or contaminated surfaces.', result: '', comments: '' },
  { id: '7.1.A.12', description: 'Verify correct barrier and shutter installation and operation.', result: '', comments: '' },
  { id: '7.1.A.13', description: 'Exercise all active components.', result: '', comments: '' },
  { id: '7.1.A.14', description: 'Inspect mechanical indicating devices for correct operation.', result: '', comments: '' },
  { id: '7.1.A.15', description: 'Verify that filters are in place and vents are clear.', result: '', comments: '' }
];

const createDefaultFormData = () => ({
  // Job Information
  jobNumber: '',
  customerName: '',
  customerLocation: '',
  date: new Date().toISOString().split('T')[0],
  technicians: '',
  jobTitle: '',
  substation: '',
  eqptLocation: '',
  temperature: { celsius: 20, fahrenheit: 68, humidity: 0, tcf: 1 },
  // Nameplate Data
  manufacturer: '',
  catalogNumber: '',
  serialNumber: '',
  type: '',
  systemVoltage: '',
  ratedVoltage: '',
  ratedCurrent: '',
  phaseConfiguration: '',
  // Visual Inspection
  visualInspectionItems: [...DEFAULT_VISUAL_INSPECTION_ITEMS],
  // Insulation Resistance Tests (6 rows)
  insulationResistanceTests: Array(6).fill(null).map((_, i) => ({
    busSection: `Bus ${i + 1}`,
    values: { ag: '', bg: '', cg: '', ab: '', bc: '', ca: '', an: '', bn: '', cn: '' },
    testVoltage: '',
    unit: 'MΩ'
  })),
  // Temperature Corrected Tests (6 rows)
  temperatureCorrectedTests: Array(6).fill(null).map((_, i) => ({
    busSection: `Bus ${i + 1}`,
    values: { ag: '', bg: '', cg: '', ab: '', bc: '', ca: '', an: '', bn: '', cn: '' },
    unit: 'MΩ'
  })),
  // Contact Resistance Tests (6 rows)
  contactResistanceTests: Array(6).fill(null).map((_, i) => ({
    busSection: `Bus ${i + 1}`,
    values: { aPhase: '', bPhase: '', cPhase: '', neutral: '', ground: '' },
    testVoltage: '',
    unit: 'µΩ'
  })),
  // Test Equipment
  testEquipment: {
    megohmmeter: { name: '', serialNumber: '', ampId: '' },
    lowResistanceOhmmeter: { name: '', serialNumber: '', ampId: '' }
  },
  comments: '',
  status: 'PASS',
  identifier: '',
  userName: '',
  testEquipmentLocation: ''
});

const PanelboardReport: React.FC<PanelboardReportProps> = ({ job, reportData, onSave }) => {
  const [formData, setFormData] = useState<any>(createDefaultFormData());
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load report data
  useEffect(() => {
    if (reportData) {
      const merged = { ...createDefaultFormData(), ...reportData };
      // Ensure arrays have correct structure
      if (!merged.visualInspectionItems?.length) {
        merged.visualInspectionItems = [...DEFAULT_VISUAL_INSPECTION_ITEMS];
      }
      if (!merged.insulationResistanceTests?.length) {
        merged.insulationResistanceTests = createDefaultFormData().insulationResistanceTests;
      }
      if (!merged.temperatureCorrectedTests?.length) {
        merged.temperatureCorrectedTests = createDefaultFormData().temperatureCorrectedTests;
      }
      if (!merged.contactResistanceTests?.length) {
        merged.contactResistanceTests = createDefaultFormData().contactResistanceTests;
      }
      setFormData(merged);
    }
  }, [reportData]);

  // Load job info
  useEffect(() => {
    if (job) {
      setFormData((prev: any) => ({
        ...prev,
        jobNumber: job.job_number || prev.jobNumber,
        customerName: job.customer_name || prev.customerName,
        customerLocation: job.site_address || prev.customerLocation,
        jobTitle: job.title || prev.jobTitle
      }));
    }
  }, [job]);

  // Auto-calculate TCF when temperature changes
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

  // Auto-calculate temperature corrected values
  useEffect(() => {
    const tcf = formData.temperature?.tcf || 1;
    const correctedTests = formData.insulationResistanceTests.map((test: any) => ({
      busSection: test.busSection,
      values: {
        ag: multiplyByTCF(test.values.ag, tcf),
        bg: multiplyByTCF(test.values.bg, tcf),
        cg: multiplyByTCF(test.values.cg, tcf),
        ab: multiplyByTCF(test.values.ab, tcf),
        bc: multiplyByTCF(test.values.bc, tcf),
        ca: multiplyByTCF(test.values.ca, tcf),
        an: multiplyByTCF(test.values.an, tcf),
        bn: multiplyByTCF(test.values.bn, tcf),
        cn: multiplyByTCF(test.values.cn, tcf)
      },
      unit: test.unit
    }));
    setFormData((prev: any) => ({ ...prev, temperatureCorrectedTests: correctedTests }));
  }, [formData.insulationResistanceTests, formData.temperature?.tcf]);

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

  const updateInsulationTest = (index: number, field: string, value: any) => {
    const tests = [...formData.insulationResistanceTests];
    if (field.startsWith('values.')) {
      const key = field.split('.')[1];
      tests[index] = { ...tests[index], values: { ...tests[index].values, [key]: value } };
    } else {
      tests[index] = { ...tests[index], [field]: value };
    }
    setFormData((prev: any) => ({ ...prev, insulationResistanceTests: tests }));
  };

  const updateContactTest = (index: number, field: string, value: any) => {
    const tests = [...formData.contactResistanceTests];
    if (field.startsWith('values.')) {
      const key = field.split('.')[1];
      tests[index] = { ...tests[index], values: { ...tests[index].values, [key]: value } };
    } else {
      tests[index] = { ...tests[index], [field]: value };
    }
    setFormData((prev: any) => ({ ...prev, contactResistanceTests: tests }));
  };

  const updateVisualInspection = (index: number, field: string, value: string) => {
    const items = [...formData.visualInspectionItems];
    items[index] = { ...items[index], [field]: value };
    setFormData((prev: any) => ({ ...prev, visualInspectionItems: items }));
  };

  return (
    <div className="report-container">
      {/* Header */}
      <div className="report-header-bar">
        <h1 className="report-title">Panelboard Inspection & Test Report ATS 21</h1>
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
            <input value={formData.customerName || ''} onChange={e => setField('customerName', e.target.value)} readOnly={!isEditing} className="report-input" />
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
            <label>Humidity:</label>
            <div className="humidity-input">
              <input value={formData.temperature?.humidity ?? ''} onChange={e => setField('temperature.humidity', e.target.value)} readOnly={!isEditing} className="report-input humidity-field" />
              <span>%</span>
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
        <div className="enclosure-grid">
          <div className="enclosure-row">
            <div className="enclosure-cell"><strong>Manufacturer:</strong><input value={formData.manufacturer || ''} onChange={e => setField('manufacturer', e.target.value)} readOnly={!isEditing} className="report-input" /></div>
            <div className="enclosure-cell"><strong>Catalog #:</strong><input value={formData.catalogNumber || ''} onChange={e => setField('catalogNumber', e.target.value)} readOnly={!isEditing} className="report-input" /></div>
            <div className="enclosure-cell"><strong>Serial #:</strong><input value={formData.serialNumber || ''} onChange={e => setField('serialNumber', e.target.value)} readOnly={!isEditing} className="report-input" /></div>
            <div className="enclosure-cell"><strong>Type:</strong><input value={formData.type || ''} onChange={e => setField('type', e.target.value)} readOnly={!isEditing} className="report-input" /></div>
          </div>
          <div className="enclosure-row">
            <div className="enclosure-cell"><strong>System Voltage:</strong><input value={formData.systemVoltage || ''} onChange={e => setField('systemVoltage', e.target.value)} readOnly={!isEditing} className="report-input" /></div>
            <div className="enclosure-cell"><strong>Rated Voltage:</strong><input value={formData.ratedVoltage || ''} onChange={e => setField('ratedVoltage', e.target.value)} readOnly={!isEditing} className="report-input" /></div>
            <div className="enclosure-cell"><strong>Rated Current:</strong><input value={formData.ratedCurrent || ''} onChange={e => setField('ratedCurrent', e.target.value)} readOnly={!isEditing} className="report-input" /></div>
            <div className="enclosure-cell">
              <strong>Phase Config:</strong>
              <select value={formData.phaseConfiguration || ''} onChange={e => setField('phaseConfiguration', e.target.value)} disabled={!isEditing} className="report-input">
                <option value="">Select</option>
                <option value="Delta">Delta</option>
                <option value="Wye">Wye</option>
                <option value="Single Phase">Single Phase</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Visual and Mechanical Inspection */}
      <section className="report-section">
        <div className="section-divider"></div>
        <h2 className="section-title">Visual and Mechanical Inspection</h2>
        <p className="section-subtitle">Per NETA ATS Section 7.1</p>
        <div className="table-container">
          <table className="report-table">
            <thead>
              <tr>
                <th style={{ width: '8%' }}>#</th>
                <th style={{ width: '52%' }}>Description</th>
                <th style={{ width: '15%' }}>Result</th>
                <th style={{ width: '25%' }}>Comments</th>
              </tr>
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
                  <td>
                    <input value={item.comments || ''} onChange={e => updateVisualInspection(idx, 'comments', e.target.value)} readOnly={!isEditing} className="report-input" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Electrical Tests - Measured Insulation Resistance */}
      <section className="report-section">
        <div className="section-divider"></div>
        <h2 className="section-title">Electrical Tests - Measured Insulation Resistance Values</h2>
        <div className="table-container">
          <table className="report-table ir-table">
            <thead>
              <tr>
                <th>Bus</th>
                <th>A-G</th>
                <th>B-G</th>
                <th>C-G</th>
                <th>A-B</th>
                <th>B-C</th>
                <th>C-A</th>
                <th>A-N</th>
                <th>B-N</th>
                <th>C-N</th>
                <th>Test V</th>
                <th>Unit</th>
              </tr>
            </thead>
            <tbody>
              {formData.insulationResistanceTests.map((test: any, idx: number) => (
                <tr key={idx}>
                  <td>{test.busSection}</td>
                  <td><input value={test.values.ag} onChange={e => updateInsulationTest(idx, 'values.ag', e.target.value)} readOnly={!isEditing} className="report-input" /></td>
                  <td><input value={test.values.bg} onChange={e => updateInsulationTest(idx, 'values.bg', e.target.value)} readOnly={!isEditing} className="report-input" /></td>
                  <td><input value={test.values.cg} onChange={e => updateInsulationTest(idx, 'values.cg', e.target.value)} readOnly={!isEditing} className="report-input" /></td>
                  <td><input value={test.values.ab} onChange={e => updateInsulationTest(idx, 'values.ab', e.target.value)} readOnly={!isEditing} className="report-input" /></td>
                  <td><input value={test.values.bc} onChange={e => updateInsulationTest(idx, 'values.bc', e.target.value)} readOnly={!isEditing} className="report-input" /></td>
                  <td><input value={test.values.ca} onChange={e => updateInsulationTest(idx, 'values.ca', e.target.value)} readOnly={!isEditing} className="report-input" /></td>
                  <td><input value={test.values.an} onChange={e => updateInsulationTest(idx, 'values.an', e.target.value)} readOnly={!isEditing} className="report-input" /></td>
                  <td><input value={test.values.bn} onChange={e => updateInsulationTest(idx, 'values.bn', e.target.value)} readOnly={!isEditing} className="report-input" /></td>
                  <td><input value={test.values.cn} onChange={e => updateInsulationTest(idx, 'values.cn', e.target.value)} readOnly={!isEditing} className="report-input" /></td>
                  <td>
                    <select value={test.testVoltage} onChange={e => updateInsulationTest(idx, 'testVoltage', e.target.value)} disabled={!isEditing} className="report-input">
                      <option value="">-</option>
                      {TEST_VOLTAGE_OPTIONS.map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </td>
                  <td>
                    <select value={test.unit} onChange={e => updateInsulationTest(idx, 'unit', e.target.value)} disabled={!isEditing} className="report-input">
                      {IR_UNITS.map(u => <option key={u.symbol} value={u.symbol}>{u.symbol}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Electrical Tests - Temperature Corrected Insulation Resistance */}
      <section className="report-section">
        <div className="section-divider"></div>
        <h2 className="section-title">Electrical Tests - Temperature Corrected Insulation Resistance Values</h2>
        <p className="section-note">(Auto-calculated from measured values × TCF)</p>
        <div className="table-container">
          <table className="report-table ir-table">
            <thead>
              <tr>
                <th>Bus</th>
                <th>A-G</th>
                <th>B-G</th>
                <th>C-G</th>
                <th>A-B</th>
                <th>B-C</th>
                <th>C-A</th>
                <th>A-N</th>
                <th>B-N</th>
                <th>C-N</th>
                <th>Unit</th>
              </tr>
            </thead>
            <tbody>
              {formData.temperatureCorrectedTests.map((test: any, idx: number) => (
                <tr key={idx}>
                  <td>{test.busSection}</td>
                  <td><input value={test.values.ag} readOnly className="report-input calculated" /></td>
                  <td><input value={test.values.bg} readOnly className="report-input calculated" /></td>
                  <td><input value={test.values.cg} readOnly className="report-input calculated" /></td>
                  <td><input value={test.values.ab} readOnly className="report-input calculated" /></td>
                  <td><input value={test.values.bc} readOnly className="report-input calculated" /></td>
                  <td><input value={test.values.ca} readOnly className="report-input calculated" /></td>
                  <td><input value={test.values.an} readOnly className="report-input calculated" /></td>
                  <td><input value={test.values.bn} readOnly className="report-input calculated" /></td>
                  <td><input value={test.values.cn} readOnly className="report-input calculated" /></td>
                  <td>{test.unit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Electrical Tests - Contact Resistance */}
      <section className="report-section">
        <div className="section-divider"></div>
        <h2 className="section-title">Electrical Tests - Contact Resistance</h2>
        <div className="table-container">
          <table className="report-table contact-table">
            <thead>
              <tr>
                <th>Bus</th>
                <th>A Phase</th>
                <th>B Phase</th>
                <th>C Phase</th>
                <th>Neutral</th>
                <th>Ground</th>
                <th>Unit</th>
              </tr>
            </thead>
            <tbody>
              {formData.contactResistanceTests.map((test: any, idx: number) => (
                <tr key={idx}>
                  <td>{test.busSection}</td>
                  <td><input value={test.values.aPhase} onChange={e => updateContactTest(idx, 'values.aPhase', e.target.value)} readOnly={!isEditing} className="report-input" /></td>
                  <td><input value={test.values.bPhase} onChange={e => updateContactTest(idx, 'values.bPhase', e.target.value)} readOnly={!isEditing} className="report-input" /></td>
                  <td><input value={test.values.cPhase} onChange={e => updateContactTest(idx, 'values.cPhase', e.target.value)} readOnly={!isEditing} className="report-input" /></td>
                  <td><input value={test.values.neutral} onChange={e => updateContactTest(idx, 'values.neutral', e.target.value)} readOnly={!isEditing} className="report-input" /></td>
                  <td><input value={test.values.ground} onChange={e => updateContactTest(idx, 'values.ground', e.target.value)} readOnly={!isEditing} className="report-input" /></td>
                  <td>
                    <select value={test.unit} onChange={e => updateContactTest(idx, 'unit', e.target.value)} disabled={!isEditing} className="report-input">
                      {CONTACT_RESISTANCE_UNITS.map(u => <option key={u.symbol} value={u.symbol}>{u.symbol}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
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
            <input value={formData.testEquipment?.megohmmeter?.serialNumber || ''} onChange={e => setField('testEquipment.megohmmeter.serialNumber', e.target.value)} readOnly={!isEditing} className="report-input" placeholder="Serial #" />
            <label>AMP ID:</label>
            <input value={formData.testEquipment?.megohmmeter?.ampId || ''} onChange={e => setField('testEquipment.megohmmeter.ampId', e.target.value)} readOnly={!isEditing} className="report-input" placeholder="AMP ID" />
          </div>
          <div className="equipment-row">
            <label>Low Resistance Ohmmeter:</label>
            <input value={formData.testEquipment?.lowResistanceOhmmeter?.name || ''} onChange={e => setField('testEquipment.lowResistanceOhmmeter.name', e.target.value)} readOnly={!isEditing} className="report-input" placeholder="Name" />
            <label>Serial #:</label>
            <input value={formData.testEquipment?.lowResistanceOhmmeter?.serialNumber || ''} onChange={e => setField('testEquipment.lowResistanceOhmmeter.serialNumber', e.target.value)} readOnly={!isEditing} className="report-input" placeholder="Serial #" />
            <label>AMP ID:</label>
            <input value={formData.testEquipment?.lowResistanceOhmmeter?.ampId || ''} onChange={e => setField('testEquipment.lowResistanceOhmmeter.ampId', e.target.value)} readOnly={!isEditing} className="report-input" placeholder="AMP ID" />
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

export default PanelboardReport;

