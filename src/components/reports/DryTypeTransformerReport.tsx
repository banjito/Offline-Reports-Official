/**
 * Dry Type Transformer Report - Desktop Version
 * Matches the web app's DryTypeTransformerReport.tsx structure
 */

import React, { useState, useEffect } from 'react';
import {
  getTCF, fahrenheitToCelsius, multiplyByTCF, calculateRatio,
  VISUAL_INSPECTION_OPTIONS, TEST_VOLTAGE_OPTIONS, IR_UNITS
} from './BaseReport';
import './ReportStyles.css';

interface DryTypeTransformerReportProps {
  job: any;
  reportData: any;
  onSave: (data: any) => void;
}

const DEFAULT_VISUAL_INSPECTION_ITEMS = [
  { id: '7.2.2.A.1', description: 'Compare equipment nameplate data with drawings and specifications.', result: '', comments: '' },
  { id: '7.2.2.A.2', description: 'Inspect physical and mechanical condition.', result: '', comments: '' },
  { id: '7.2.2.A.3', description: 'Inspect impact recorder prior to unloading.', result: '', comments: '' },
  { id: '7.2.2.A.4', description: 'Test dew point of tank gases. *Optional', result: '', comments: '' },
  { id: '7.2.2.A.5', description: 'Inspect anchorage, alignment, and grounding.', result: '', comments: '' },
  { id: '7.2.2.A.6', description: 'Verify the presence of PCB content labeling.', result: '', comments: '' },
  { id: '7.2.2.A.7', description: 'Verify removal of any shipping bracing after placement.', result: '', comments: '' },
  { id: '7.2.2.A.8', description: 'Verify the bushings are clean.', result: '', comments: '' },
  { id: '7.2.2.A.9', description: 'Verify that alarm, control, and trip settings on temperature and level indicators are as specified.', result: '', comments: '' },
  { id: '7.2.2.A.10', description: 'Verify operation of alarm, control, and trip circuits from temperature and level indicators, pressure relief device, gas accumulator, and fault pressure relay.', result: '', comments: '' },
  { id: '7.2.2.A.11', description: 'Verify that cooling fans and pumps operate correctly and have appropriate overcurrent protection.', result: '', comments: '' },
  { id: '7.2.2.A.12', description: 'Inspect bolted electrical connections for high resistance using low-resistance ohmmeter, calibrated torquewrench, or thermographic survey.', result: '', comments: '' },
  { id: '7.2.2.A.13', description: 'Verify correct liquid level in tanks and bushings.', result: '', comments: '' },
  { id: '7.2.2.A.14', description: 'Verify valves are in the correct operating position.', result: '', comments: '' },
  { id: '7.2.2.A.15', description: 'Verify that positive pressure is maintained on gas-blanketed transformers.', result: '', comments: '' },
  { id: '7.2.2.A.16', description: 'Perform inspections and mechanical tests as recommended by the manufacturer.', result: '', comments: '' },
  { id: '7.2.2.A.17', description: 'Test load tap-changer in accordance with Section 7.12.3.', result: '', comments: '' },
  { id: '7.2.2.A.18', description: 'Verify presence of transformer surge arresters.', result: '', comments: '' },
  { id: '7.2.2.A.19', description: 'Verify de-energized tap-changer position is left as specified.', result: '', comments: '' }
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
  temperature: { ambient: 72, celsius: 22, fahrenheit: 72, correctionFactor: 1.152 },
  nameplateData: {
    manufacturer: '',
    catalogNumber: '',
    serialNumber: '',
    kva: '',
    kvaSecondary: '',
    tempRise: '',
    impedance: '',
    primary: { volts: '480', voltsSecondary: '', connection: 'Delta', material: 'Aluminum' },
    secondary: { volts: '', voltsSecondary: '', connection: 'Wye', material: 'Aluminum' },
    tapConfiguration: {
      positions: [1, 2, 3, 4, 5, 6, 7],
      voltages: ['', '', '', '', '', '-', '-'],
      currentPosition: 3,
      currentPositionSecondary: '',
      tapVoltsSpecific: '',
      tapPercentSpecific: ''
    }
  },
  visualInspectionItems: [...DEFAULT_VISUAL_INSPECTION_ITEMS],
  insulationResistance: {
    primaryToGround: {
      testVoltage: '5000V', unit: 'MΩ',
      readings: { halfMinute: '', oneMinute: '', tenMinute: '' },
      corrected: { halfMinute: '', oneMinute: '', tenMinute: '' },
      dielectricAbsorption: '', polarizationIndex: ''
    },
    secondaryToGround: {
      testVoltage: '1000V', unit: 'MΩ',
      readings: { halfMinute: '', oneMinute: '', tenMinute: '' },
      corrected: { halfMinute: '', oneMinute: '', tenMinute: '' },
      dielectricAbsorption: '', polarizationIndex: ''
    },
    primaryToSecondary: {
      testVoltage: '5000V', unit: 'MΩ',
      readings: { halfMinute: '', oneMinute: '', tenMinute: '' },
      corrected: { halfMinute: '', oneMinute: '', tenMinute: '' },
      dielectricAbsorption: '', polarizationIndex: ''
    },
    dielectricAbsorptionAcceptable: '',
    polarizationIndexAcceptable: ''
  },
  testEquipment: { megohmmeter: { name: '', serialNumber: '', ampId: '' } },
  comments: '',
  status: 'PASS'
});

const DryTypeTransformerReport: React.FC<DryTypeTransformerReportProps> = ({ job, reportData, onSave }) => {
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

  // Auto-calculate TCF
  useEffect(() => {
    const fahrenheit = formData.temperature?.fahrenheit || 72;
    const celsius = fahrenheitToCelsius(fahrenheit);
    const tcf = getTCF(celsius);
    if (celsius !== formData.temperature?.celsius || tcf !== formData.temperature?.correctionFactor) {
      setFormData((prev: any) => ({
        ...prev,
        temperature: { ...prev.temperature, celsius, correctionFactor: tcf }
      }));
    }
  }, [formData.temperature?.fahrenheit]);

  // Auto-calculate corrected IR values, DA, and PI
  useEffect(() => {
    const tcf = formData.temperature?.correctionFactor || 1;
    const ir = formData.insulationResistance;
    if (!ir) return;

    const calcTest = (test: any) => ({
      ...test,
      corrected: {
        halfMinute: multiplyByTCF(test.readings?.halfMinute || '', tcf),
        oneMinute: multiplyByTCF(test.readings?.oneMinute || '', tcf),
        tenMinute: multiplyByTCF(test.readings?.tenMinute || '', tcf)
      },
      dielectricAbsorption: calculateRatio(test.readings?.oneMinute || '', test.readings?.halfMinute || ''),
      polarizationIndex: calculateRatio(test.readings?.tenMinute || '', test.readings?.oneMinute || '')
    });

    const newIR = {
      ...ir,
      primaryToGround: calcTest(ir.primaryToGround),
      secondaryToGround: calcTest(ir.secondaryToGround),
      primaryToSecondary: calcTest(ir.primaryToSecondary)
    };

    // Check DA/PI acceptable
    const daValues = [newIR.primaryToGround.dielectricAbsorption, newIR.secondaryToGround.dielectricAbsorption, newIR.primaryToSecondary.dielectricAbsorption].map(v => parseFloat(v));
    const piValues = [newIR.primaryToGround.polarizationIndex, newIR.secondaryToGround.polarizationIndex, newIR.primaryToSecondary.polarizationIndex].map(v => parseFloat(v));
    newIR.dielectricAbsorptionAcceptable = daValues.every(v => !isNaN(v) && v > 1) ? 'Yes' : 'No';
    newIR.polarizationIndexAcceptable = piValues.every(v => !isNaN(v) && v > 1) ? 'Yes' : 'No';

    setFormData((prev: any) => ({ ...prev, insulationResistance: newIR }));
  }, [
    formData.insulationResistance?.primaryToGround?.readings,
    formData.insulationResistance?.secondaryToGround?.readings,
    formData.insulationResistance?.primaryToSecondary?.readings,
    formData.temperature?.correctionFactor
  ]);

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

  const renderIRSection = (testKey: string, label: string) => {
    const test = formData.insulationResistance?.[testKey] || {};
    return (
      <div className="ir-test-section">
        <h4>{label}</h4>
        <div className="ir-test-grid">
          <div className="ir-row">
            <span>Test Voltage:</span>
            <select value={test.testVoltage || ''} onChange={e => setField(`insulationResistance.${testKey}.testVoltage`, e.target.value)} disabled={!isEditing} className="report-input">
              {TEST_VOLTAGE_OPTIONS.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
            <span>Unit:</span>
            <select value={test.unit || 'MΩ'} onChange={e => setField(`insulationResistance.${testKey}.unit`, e.target.value)} disabled={!isEditing} className="report-input">
              {IR_UNITS.map(u => <option key={u.symbol} value={u.symbol}>{u.symbol}</option>)}
            </select>
          </div>
          <table className="report-table ir-detail-table">
            <thead>
              <tr><th></th><th>30 sec</th><th>1 min</th><th>10 min</th><th>DA</th><th>PI</th></tr>
            </thead>
            <tbody>
              <tr>
                <td>Measured</td>
                <td><input value={test.readings?.halfMinute || ''} onChange={e => setField(`insulationResistance.${testKey}.readings.halfMinute`, e.target.value)} readOnly={!isEditing} className="report-input" /></td>
                <td><input value={test.readings?.oneMinute || ''} onChange={e => setField(`insulationResistance.${testKey}.readings.oneMinute`, e.target.value)} readOnly={!isEditing} className="report-input" /></td>
                <td><input value={test.readings?.tenMinute || ''} onChange={e => setField(`insulationResistance.${testKey}.readings.tenMinute`, e.target.value)} readOnly={!isEditing} className="report-input" /></td>
                <td><input value={test.dielectricAbsorption || ''} readOnly className="report-input calculated" /></td>
                <td><input value={test.polarizationIndex || ''} readOnly className="report-input calculated" /></td>
              </tr>
              <tr>
                <td>Corrected</td>
                <td><input value={test.corrected?.halfMinute || ''} readOnly className="report-input calculated" /></td>
                <td><input value={test.corrected?.oneMinute || ''} readOnly className="report-input calculated" /></td>
                <td><input value={test.corrected?.tenMinute || ''} readOnly className="report-input calculated" /></td>
                <td colSpan={2}></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="report-container">
      {/* Header */}
      <div className="report-header-bar">
        <h1 className="report-title">Dry Type Transformer Visual, Mechanical, Insulation Resistance Test ATS 21</h1>
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
              <input type="number" value={formData.temperature?.fahrenheit ?? 72} onChange={e => setField('temperature.fahrenheit', Number(e.target.value))} readOnly={!isEditing} className="report-input temp-input" />
              <span>°F</span>
              <span className="temp-celsius">{formData.temperature?.celsius ?? 22}</span>
              <span>°C</span>
              <span className="temp-label">TCF</span>
              <span className="temp-value">{(formData.temperature?.correctionFactor ?? 1).toFixed(3)}</span>
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
            <div className="enclosure-cell"><strong>Manufacturer:</strong><input value={formData.nameplateData?.manufacturer || ''} onChange={e => setField('nameplateData.manufacturer', e.target.value)} readOnly={!isEditing} className="report-input" /></div>
            <div className="enclosure-cell"><strong>Catalog #:</strong><input value={formData.nameplateData?.catalogNumber || ''} onChange={e => setField('nameplateData.catalogNumber', e.target.value)} readOnly={!isEditing} className="report-input" /></div>
            <div className="enclosure-cell"><strong>Serial #:</strong><input value={formData.nameplateData?.serialNumber || ''} onChange={e => setField('nameplateData.serialNumber', e.target.value)} readOnly={!isEditing} className="report-input" /></div>
          </div>
          <div className="enclosure-row">
            <div className="enclosure-cell"><strong>KVA:</strong><input value={formData.nameplateData?.kva || ''} onChange={e => setField('nameplateData.kva', e.target.value)} readOnly={!isEditing} className="report-input" /></div>
            <div className="enclosure-cell"><strong>Temp Rise:</strong><input value={formData.nameplateData?.tempRise || ''} onChange={e => setField('nameplateData.tempRise', e.target.value)} readOnly={!isEditing} className="report-input" /></div>
            <div className="enclosure-cell"><strong>Impedance %:</strong><input value={formData.nameplateData?.impedance || ''} onChange={e => setField('nameplateData.impedance', e.target.value)} readOnly={!isEditing} className="report-input" /></div>
          </div>
          <div className="enclosure-row">
            <div className="enclosure-cell"><strong>Primary Volts:</strong><input value={formData.nameplateData?.primary?.volts || ''} onChange={e => setField('nameplateData.primary.volts', e.target.value)} readOnly={!isEditing} className="report-input" /></div>
            <div className="enclosure-cell"><strong>Primary Connection:</strong>
              <select value={formData.nameplateData?.primary?.connection || ''} onChange={e => setField('nameplateData.primary.connection', e.target.value)} disabled={!isEditing} className="report-input">
                <option value="">Select</option><option value="Delta">Delta</option><option value="Wye">Wye</option>
              </select>
            </div>
            <div className="enclosure-cell"><strong>Primary Material:</strong>
              <select value={formData.nameplateData?.primary?.material || ''} onChange={e => setField('nameplateData.primary.material', e.target.value)} disabled={!isEditing} className="report-input">
                <option value="">Select</option><option value="Aluminum">Aluminum</option><option value="Copper">Copper</option>
              </select>
            </div>
          </div>
          <div className="enclosure-row">
            <div className="enclosure-cell"><strong>Secondary Volts:</strong><input value={formData.nameplateData?.secondary?.volts || ''} onChange={e => setField('nameplateData.secondary.volts', e.target.value)} readOnly={!isEditing} className="report-input" /></div>
            <div className="enclosure-cell"><strong>Secondary Connection:</strong>
              <select value={formData.nameplateData?.secondary?.connection || ''} onChange={e => setField('nameplateData.secondary.connection', e.target.value)} disabled={!isEditing} className="report-input">
                <option value="">Select</option><option value="Delta">Delta</option><option value="Wye">Wye</option>
              </select>
            </div>
            <div className="enclosure-cell"><strong>Secondary Material:</strong>
              <select value={formData.nameplateData?.secondary?.material || ''} onChange={e => setField('nameplateData.secondary.material', e.target.value)} disabled={!isEditing} className="report-input">
                <option value="">Select</option><option value="Aluminum">Aluminum</option><option value="Copper">Copper</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Visual and Mechanical Inspection */}
      <section className="report-section">
        <div className="section-divider"></div>
        <h2 className="section-title">Visual and Mechanical Inspection</h2>
        <p className="section-subtitle">Per NETA ATS Section 7.2.2</p>
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

      {/* Insulation Resistance Tests */}
      <section className="report-section">
        <div className="section-divider"></div>
        <h2 className="section-title">Insulation Resistance Tests</h2>
        <p className="section-note">DA (Dielectric Absorption) = 1 min / 30 sec | PI (Polarization Index) = 10 min / 1 min | Acceptable: &gt; 1</p>
        {renderIRSection('primaryToGround', 'Primary to Ground')}
        {renderIRSection('secondaryToGround', 'Secondary to Ground')}
        {renderIRSection('primaryToSecondary', 'Primary to Secondary')}
        <div className="ir-acceptable-row">
          <span>DA Acceptable: <strong>{formData.insulationResistance?.dielectricAbsorptionAcceptable || '-'}</strong></span>
          <span>PI Acceptable: <strong>{formData.insulationResistance?.polarizationIndexAcceptable || '-'}</strong></span>
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

export default DryTypeTransformerReport;

