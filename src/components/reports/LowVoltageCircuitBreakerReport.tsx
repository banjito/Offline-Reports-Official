/**
 * Low Voltage Circuit Breaker Report - Desktop Version
 * Handles both Electronic Trip and Thermal Magnetic variants
 */

import React, { useState, useEffect } from 'react';
import {
  getTCF, fahrenheitToCelsius, multiplyByTCF,
  VISUAL_INSPECTION_OPTIONS, TEST_VOLTAGE_OPTIONS, IR_UNITS, CONTACT_RESISTANCE_UNITS
} from './BaseReport';
import './ReportStyles.css';

interface LowVoltageCircuitBreakerReportProps {
  job: any;
  reportData: any;
  onSave: (data: any) => void;
  variant?: 'electronic' | 'thermal-magnetic';
}

const DEFAULT_VISUAL_INSPECTION_ITEMS = [
  { id: '7.6.1.2.A.1', description: 'Compare equipment nameplate data with drawings and specifications.', result: '' },
  { id: '7.6.1.2.A.2', description: 'Inspect physical and mechanical condition.', result: '' },
  { id: '7.6.1.2.A.3', description: 'Inspect anchorage and alignment.', result: '' },
  { id: '7.6.1.2.A.4', description: 'Verify that all maintenance devices are available for servicing and operating the breaker.', result: '' },
  { id: '7.6.1.2.A.5', description: 'Verify the unit is clean.', result: '' },
  { id: '7.6.1.2.A.6', description: 'Verify the arc chutes are intact.', result: '' },
  { id: '7.6.1.2.A.7', description: 'Inspect moving and stationary contacts for condition and alignment.', result: '' },
  { id: '7.6.1.2.A.8', description: 'Verify that primary and secondary contact wipe and other dimensions vital to satisfactory operation of the breaker are correct.', result: '' },
  { id: '7.6.1.2.A.9', description: 'Perform all mechanical operator and contact alignment tests on both the breaker and its operating mechanism.', result: '' },
  { id: '7.6.1.2.A.10.1', description: 'Use of a low-resistance ohmmeter in accordance with Section 7.6.1.2.B.1.', result: '' },
  { id: '7.6.1.2.A.11', description: 'Verify cell fit and element alignment.', result: '' },
  { id: '7.6.1.2.A.12', description: 'Verify racking mechanism operation.', result: '' },
  { id: '7.6.1.2.A.13', description: 'Verify appropriate lubrication on moving current-carrying parts and on moving and sliding surfaces.', result: '' },
  { id: '7.6.1.2.A.14', description: 'Perform adjustments for final protective device settings in accordance with coordination study provided by end user.', result: '' }
];

const createDefaultFormData = (variant: string) => ({
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
  // Nameplate Data
  manufacturer: '',
  catalogNumber: '',
  serialNumber: '',
  type: '',
  icRating: '',
  frameSize: '',
  ratingPlug: '',
  curveNo: '',
  operation: '',
  mounting: '',
  thermalMemory: '',
  tripUnitType: '',
  zoneInterlock: '',
  // Visual Inspection
  visualInspectionItems: [...DEFAULT_VISUAL_INSPECTION_ITEMS],
  // Device Settings - varies by variant
  deviceSettings: variant === 'thermal-magnetic' ? {
    asFound: { thermal: '', magnetic: '' },
    asLeft: { thermal: '', magnetic: '' }
  } : {
    asFound: {
      longTime: { setting: '', delay: '', i2t: '' },
      shortTime: { setting: '', delay: '', i2t: '' },
      instantaneous: { setting: '', delay: '', i2t: '' },
      groundFault: { setting: '', delay: '', i2t: '' }
    },
    asLeft: {
      longTime: { setting: '', delay: '', i2t: '' },
      shortTime: { setting: '', delay: '', i2t: '' },
      instantaneous: { setting: '', delay: '', i2t: '' },
      groundFault: { setting: '', delay: '', i2t: '' }
    }
  },
  // Contact Resistance
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
  // Primary Injection
  primaryInjection: variant === 'thermal-magnetic' ? {
    testedSettings: { thermal: '', magnetic: '' },
    results: {
      thermal: {
        amperes1: '', multiplierTolerance: '300%', amperes2: '', toleranceMin: '', toleranceMax: '',
        pole1: { sec: '', a: '' }, pole2: { sec: '', a: '' }, pole3: { sec: '', a: '' }
      },
      magnetic: {
        amperes1: '', multiplierTolerance: '-10% 10%', amperes2: '', toleranceMin: '', toleranceMax: '',
        pole1: { sec: '', a: '' }, pole2: { sec: '', a: '' }, pole3: { sec: '', a: '' }
      }
    }
  } : {
    testedSettings: {
      longTime: { setting: '', delay: '', i2t: '' },
      shortTime: { setting: '', delay: '', i2t: '' },
      instantaneous: { setting: '', delay: '', i2t: '' },
      groundFault: { setting: '', delay: '', i2t: '' }
    },
    results: {
      longTime: { ratedAmperes1: '', multiplier: '', toleranceMin: '', toleranceMax: '', testAmperes1: '', pole1: { sec: '', a: '' }, pole2: { sec: '', a: '' }, pole3: { sec: '', a: '' } },
      shortTime: { ratedAmperes1: '', multiplier: '', toleranceMin: '', toleranceMax: '', testAmperes1: '', pole1: { sec: '', a: '' }, pole2: { sec: '', a: '' }, pole3: { sec: '', a: '' } },
      instantaneous: { ratedAmperes1: '', multiplier: '', toleranceMin: '', toleranceMax: '', testAmperes1: '', pole1: { sec: '', a: '' }, pole2: { sec: '', a: '' }, pole3: { sec: '', a: '' } },
      groundFault: { ratedAmperes1: '', multiplier: '', toleranceMin: '', toleranceMax: '', testAmperes1: '', pole1: { sec: '', a: '' }, pole2: { sec: '', a: '' }, pole3: { sec: '', a: '' } }
    }
  },
  // Test Equipment
  testEquipment: {
    megohmmeter: { name: '', serialNumber: '', ampId: '' },
    lowResistanceOhmmeter: { name: '', serialNumber: '', ampId: '' },
    primaryInjectionTestSet: { name: '', serialNumber: '', ampId: '' }
  },
  comments: '',
  status: 'PASS'
});

const LowVoltageCircuitBreakerReport: React.FC<LowVoltageCircuitBreakerReportProps> = ({ job, reportData, onSave, variant = 'electronic' }) => {
  const [formData, setFormData] = useState<any>(createDefaultFormData(variant));
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (reportData) {
      const merged = { ...createDefaultFormData(variant), ...reportData };
      if (!merged.visualInspectionItems?.length) merged.visualInspectionItems = [...DEFAULT_VISUAL_INSPECTION_ITEMS];
      setFormData(merged);
    }
  }, [reportData, variant]);

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
      setFormData((prev: any) => ({ ...prev, temperature: { ...prev.temperature, celsius, tcf } }));
    }
  }, [formData.temperature?.fahrenheit]);

  // Auto-calculate corrected IR values
  useEffect(() => {
    const tcf = formData.temperature?.tcf || 1;
    const ir = formData.insulationResistance;
    if (!ir?.measured) return;

    const calcCorrected = (measured: any) => ({
      poleToPole: {
        p1p2: multiplyByTCF(measured.poleToPole?.p1p2 || '', tcf),
        p2p3: multiplyByTCF(measured.poleToPole?.p2p3 || '', tcf),
        p3p1: multiplyByTCF(measured.poleToPole?.p3p1 || '', tcf)
      },
      poleToFrame: {
        p1: multiplyByTCF(measured.poleToFrame?.p1 || '', tcf),
        p2: multiplyByTCF(measured.poleToFrame?.p2 || '', tcf),
        p3: multiplyByTCF(measured.poleToFrame?.p3 || '', tcf)
      },
      lineToLoad: {
        p1: multiplyByTCF(measured.lineToLoad?.p1 || '', tcf),
        p2: multiplyByTCF(measured.lineToLoad?.p2 || '', tcf),
        p3: multiplyByTCF(measured.lineToLoad?.p3 || '', tcf)
      }
    });

    setFormData((prev: any) => ({
      ...prev,
      insulationResistance: { ...prev.insulationResistance, corrected: calcCorrected(prev.insulationResistance.measured) }
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

  const title = variant === 'thermal-magnetic'
    ? 'Low Voltage Circuit Breaker Thermal-Magnetic ATS'
    : 'Low Voltage Circuit Breaker Electronic Trip Unit ATS - Primary Injection';

  return (
    <div className="report-container">
      {/* Header */}
      <div className="report-header-bar">
        <h1 className="report-title">{title}</h1>
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
          <div className="form-field"><label>Humidity:</label><div className="humidity-input"><input value={formData.temperature?.humidity ?? ''} onChange={e => setField('temperature.humidity', e.target.value)} readOnly={!isEditing} className="report-input humidity-field" /><span>%</span></div></div>
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
            <div className="enclosure-cell"><strong>Frame Size (A):</strong><input value={formData.frameSize || ''} onChange={e => setField('frameSize', e.target.value)} readOnly={!isEditing} className="report-input" /></div>
            <div className="enclosure-cell"><strong>IC Rating (kA):</strong><input value={formData.icRating || ''} onChange={e => setField('icRating', e.target.value)} readOnly={!isEditing} className="report-input" /></div>
            <div className="enclosure-cell"><strong>Rating Plug (A):</strong><input value={formData.ratingPlug || ''} onChange={e => setField('ratingPlug', e.target.value)} readOnly={!isEditing} className="report-input" /></div>
            <div className="enclosure-cell"><strong>Curve No:</strong><input value={formData.curveNo || ''} onChange={e => setField('curveNo', e.target.value)} readOnly={!isEditing} className="report-input" /></div>
          </div>
          <div className="enclosure-row">
            <div className="enclosure-cell"><strong>Operation:</strong><input value={formData.operation || ''} onChange={e => setField('operation', e.target.value)} readOnly={!isEditing} className="report-input" /></div>
            <div className="enclosure-cell"><strong>Mounting:</strong><input value={formData.mounting || ''} onChange={e => setField('mounting', e.target.value)} readOnly={!isEditing} className="report-input" /></div>
            {variant === 'electronic' && (
              <>
                <div className="enclosure-cell"><strong>Trip Unit Type:</strong><input value={formData.tripUnitType || ''} onChange={e => setField('tripUnitType', e.target.value)} readOnly={!isEditing} className="report-input" /></div>
                <div className="enclosure-cell"><strong>Zone Interlock:</strong><input value={formData.zoneInterlock || ''} onChange={e => setField('zoneInterlock', e.target.value)} readOnly={!isEditing} className="report-input" /></div>
              </>
            )}
            {variant === 'thermal-magnetic' && (
              <div className="enclosure-cell"><strong>Thermal Memory:</strong><input value={formData.thermalMemory || ''} onChange={e => setField('thermalMemory', e.target.value)} readOnly={!isEditing} className="report-input" /></div>
            )}
          </div>
        </div>
      </section>

      {/* Visual and Mechanical Inspection */}
      <section className="report-section">
        <div className="section-divider"></div>
        <h2 className="section-title">Visual and Mechanical Inspection</h2>
        <p className="section-subtitle">Per NETA ATS Section 7.6.1.2</p>
        <div className="table-container">
          <table className="report-table">
            <thead>
              <tr><th style={{ width: '12%' }}>#</th><th style={{ width: '68%' }}>Description</th><th style={{ width: '20%' }}>Result</th></tr>
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Contact Resistance */}
      <section className="report-section">
        <div className="section-divider"></div>
        <h2 className="section-title">Electrical Tests - Contact/Pole Resistance</h2>
        <div className="table-container">
          <table className="report-table">
            <thead>
              <tr><th>Pole 1</th><th>Pole 2</th><th>Pole 3</th><th>Unit</th></tr>
            </thead>
            <tbody>
              <tr>
                <td><input value={formData.contactResistance?.p1 || ''} onChange={e => setField('contactResistance.p1', e.target.value)} readOnly={!isEditing} className="report-input" /></td>
                <td><input value={formData.contactResistance?.p2 || ''} onChange={e => setField('contactResistance.p2', e.target.value)} readOnly={!isEditing} className="report-input" /></td>
                <td><input value={formData.contactResistance?.p3 || ''} onChange={e => setField('contactResistance.p3', e.target.value)} readOnly={!isEditing} className="report-input" /></td>
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
          <select value={formData.insulationResistance?.testVoltage || '1000V'} onChange={e => setField('insulationResistance.testVoltage', e.target.value)} disabled={!isEditing} className="report-input">
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
              <tr><th></th><th colSpan={3}>Measured</th><th colSpan={3}>Corrected</th></tr>
              <tr><th></th><th>P1-P2</th><th>P2-P3</th><th>P3-P1</th><th>P1-P2</th><th>P2-P3</th><th>P3-P1</th></tr>
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
            </tbody>
          </table>
          <table className="report-table" style={{ marginTop: '8px' }}>
            <thead>
              <tr><th></th><th colSpan={3}>Measured</th><th colSpan={3}>Corrected</th></tr>
              <tr><th></th><th>P1</th><th>P2</th><th>P3</th><th>P1</th><th>P2</th><th>P3</th></tr>
            </thead>
            <tbody>
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
            <label>Primary Injection Test Set:</label>
            <input value={formData.testEquipment?.primaryInjectionTestSet?.name || ''} onChange={e => setField('testEquipment.primaryInjectionTestSet.name', e.target.value)} readOnly={!isEditing} className="report-input" placeholder="Name" />
            <label>Serial #:</label>
            <input value={formData.testEquipment?.primaryInjectionTestSet?.serialNumber || ''} onChange={e => setField('testEquipment.primaryInjectionTestSet.serialNumber', e.target.value)} readOnly={!isEditing} className="report-input" />
            <label>AMP ID:</label>
            <input value={formData.testEquipment?.primaryInjectionTestSet?.ampId || ''} onChange={e => setField('testEquipment.primaryInjectionTestSet.ampId', e.target.value)} readOnly={!isEditing} className="report-input" />
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

export default LowVoltageCircuitBreakerReport;

