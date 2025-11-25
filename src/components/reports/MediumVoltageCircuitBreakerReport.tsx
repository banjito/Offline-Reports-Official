/**
 * Medium Voltage Circuit Breaker Report - Desktop Version
 * Matches the web app's MediumVoltageCircuitBreakerReport.tsx structure EXACTLY
 * 
 * Key Structure:
 * - Visual Inspection: Items with IDs like 7.6.3.A.1, 7.6.3.A.2, etc.
 * - Counter Reading: As Found / As Left
 * - Contact/Pole Resistance: P1, P2, P3 columns
 * - Insulation Resistance: 3 rows (Pole to Pole Closed, Pole to Frame Closed, Line to Load Open)
 *   with Measured Values (P1, P2, P3) and Temperature Corrected (P1, P2, P3)
 * - Vacuum Integrity/Dielectric Withstand: Breaker CLOSED and Breaker OPEN tables
 * - Test Equipment: Insulation Resistance Tester, Micro-ohmmeter, Hi-Pot Tester
 */

import React, { useState, useEffect } from 'react';
import { getTCF, VISUAL_INSPECTION_OPTIONS } from './BaseReport';
import './ReportStyles.css';

interface MediumVoltageCircuitBreakerReportProps {
  job: any;
  reportData: any;
  onSave: (data: any) => void;
}

// Visual inspection items matching the web app EXACTLY
const VISUAL_INSPECTION_ITEMS = [
  { id: '7.6.3.A.1', description: 'Compare equipment nameplate data with drawings and specifications.' },
  { id: '7.6.3.A.2', description: 'Inspect physical and mechanical condition.' },
  { id: '7.6.3.A.3', description: 'Inspect anchorage, alignment, and grounding.' },
  { id: '7.6.3.A.4', description: 'Verify that all maintenance devices such as special tools and gauges specified by the manufacturer are available for servicing and operating the breaker.' },
  { id: '7.6.3.A.5', description: 'Verify the unit is clean.' },
  { id: '7.6.3.A.6', description: 'Perform all mechanical operation tests on the operating mechanism in accordance with manufacturer\'s published data.' },
  { id: '7.6.3.A.7', description: 'Measure critical distances such as contact gap as recommended by manufacturer.' },
  { id: '7.6.3.A.8.1', description: 'Use of low-resistance ohmmeter in accordance with Section 7.6.3.B.1.' },
  { id: '7.6.3.A.9', description: 'Verify cell fit and element alignment.' },
  { id: '7.6.3.A.10', description: 'Verify racking mechanism operation.' },
  { id: '7.6.3.A.11', description: 'Verify appropriate lubrication on moving, current-carrying parts and on moving and sliding surfaces.' }
];

const INSULATION_RESISTANCE_UNITS = ['kΩ', 'MΩ', 'GΩ'];
const INSULATION_TEST_VOLTAGES = ['250V', '500V', '1000V', '2500V', '5000V'];
const CONTACT_RESISTANCE_UNITS = ['μΩ', 'mΩ', 'Ω'];
const DIELECTRIC_WITHSTAND_UNITS = ['μA', 'mA'];

interface FormData {
  // Job Information
  customer: string;
  address: string;
  user: string;
  date: string;
  jobNumber: string;
  technicians: string;
  substation: string;
  eqptLocation: string;
  identifier: string;
  status: 'PASS' | 'FAIL' | 'LIMITED SERVICE';
  temperature: { fahrenheit: number; celsius: number; tcf: number; };
  humidity: number;
  
  // Nameplate Data
  manufacturer: string;
  catalogNumber: string;
  serialNumber: string;
  type: string;
  manufacturingDate: string;
  icRating: string;
  ratedVoltage: string;
  operatingVoltage: string;
  ampacity: string;
  mvaRating: string;
  
  // Visual and Mechanical Inspection (object keyed by NETA id)
  visualMechanicalInspection: { [key: string]: string };
  counterReadingAsFound: string;
  counterReadingAsLeft: string;
  
  // Contact/Pole Resistance
  contactResistance: { p1: string; p2: string; p3: string; units: string; };
  
  // Insulation Resistance
  insulationResistanceMeasured: {
    testVoltage: string;
    poleToPoleUnits: string;
    poleToFrameUnits: string;
    lineToLoadUnits: string;
    poleToPoleClosedP1P2: string;
    poleToPoleClosedP2P3: string;
    poleToPoleClosedP3P1: string;
    poleToFrameClosedP1: string;
    poleToFrameClosedP2: string;
    poleToFrameClosedP3: string;
    lineToLoadOpenP1: string;
    lineToLoadOpenP2: string;
    lineToLoadOpenP3: string;
  };
  
  // Dielectric Withstand
  dielectricWithstandClosed: {
    p1Ground: string;
    p2Ground: string;
    p3Ground: string;
    units: string;
    testVoltage: string;
    testDuration: string;
  };
  vacuumIntegrityOpen: {
    p1: string;
    p2: string;
    p3: string;
    units: string;
    testVoltage: string;
    testDuration: string;
  };
  
  // Test Equipment
  testEquipment: {
    insulationResistanceTester: { model: string; serial: string; id: string; };
    microOhmmeter: { model: string; serial: string; id: string; };
    hiPotTester: { model: string; serial: string; id: string; };
  };
  
  comments: string;
}

const createDefaultFormData = (): FormData => ({
  customer: '',
  address: '',
  user: '',
  date: new Date().toISOString().split('T')[0],
  jobNumber: '',
  technicians: '',
  substation: '',
  eqptLocation: '',
  identifier: '',
  status: 'PASS',
  temperature: { fahrenheit: 68, celsius: 20, tcf: 1 },
  humidity: 80,
  manufacturer: '',
  catalogNumber: '',
  serialNumber: '',
  type: '',
  manufacturingDate: '',
  icRating: '',
  ratedVoltage: '',
  operatingVoltage: '',
  ampacity: '',
  mvaRating: '',
  visualMechanicalInspection: VISUAL_INSPECTION_ITEMS.reduce((acc, item) => ({ ...acc, [item.id]: '' }), {}),
  counterReadingAsFound: '',
  counterReadingAsLeft: '',
  contactResistance: { p1: '', p2: '', p3: '', units: 'μΩ' },
  insulationResistanceMeasured: {
    testVoltage: '1000V',
    poleToPoleUnits: 'MΩ',
    poleToFrameUnits: 'MΩ',
    lineToLoadUnits: 'MΩ',
    poleToPoleClosedP1P2: '',
    poleToPoleClosedP2P3: '',
    poleToPoleClosedP3P1: '',
    poleToFrameClosedP1: '',
    poleToFrameClosedP2: '',
    poleToFrameClosedP3: '',
    lineToLoadOpenP1: '',
    lineToLoadOpenP2: '',
    lineToLoadOpenP3: ''
  },
  dielectricWithstandClosed: {
    p1Ground: '',
    p2Ground: '',
    p3Ground: '',
    units: 'μA',
    testVoltage: '',
    testDuration: '1 Min.'
  },
  vacuumIntegrityOpen: {
    p1: '',
    p2: '',
    p3: '',
    units: 'μA',
    testVoltage: '',
    testDuration: '1 Min.'
  },
  testEquipment: {
    insulationResistanceTester: { model: '', serial: '', id: '' },
    microOhmmeter: { model: '', serial: '', id: '' },
    hiPotTester: { model: '', serial: '', id: '' }
  },
  comments: ''
});

const MediumVoltageCircuitBreakerReport: React.FC<MediumVoltageCircuitBreakerReportProps> = ({ job, reportData, onSave }) => {
  const [isEditing] = useState(true);
  const [formData, setFormData] = useState<FormData>(createDefaultFormData());

  // Parse report data on load
  useEffect(() => {
    const defaults = createDefaultFormData();
    const merged = { ...defaults };
    
    // Get data from report_data or direct fields
    const payload = reportData?.report_data || reportData || {};
    const info = payload.report_info || payload;
    
    // Job Information
    merged.customer = info.customer || job?.customer || '';
    merged.address = info.address || job?.address || '';
    merged.user = info.user || info.userName || '';
    merged.date = info.date || defaults.date;
    merged.jobNumber = info.jobNumber || job?.job_number || '';
    merged.technicians = info.technicians || '';
    merged.substation = info.substation || '';
    merged.eqptLocation = info.eqptLocation || '';
    merged.identifier = info.identifier || '';
    merged.status = info.status || 'PASS';
    
    // Temperature
    const temp = info.temperature || payload.temperature || {};
    merged.temperature = {
      fahrenheit: temp.fahrenheit ?? 68,
      celsius: temp.celsius ?? 20,
      tcf: temp.tcf ?? 1
    };
    merged.humidity = info.humidity ?? payload.humidity ?? 80;
    
    // Nameplate
    merged.manufacturer = info.manufacturer || payload.manufacturer || '';
    merged.catalogNumber = info.catalogNumber || payload.catalogNumber || '';
    merged.serialNumber = info.serialNumber || payload.serialNumber || '';
    merged.type = info.type || payload.type || '';
    merged.manufacturingDate = info.manufacturingDate || payload.manufacturingDate || '';
    merged.icRating = info.icRating || payload.icRating || '';
    merged.ratedVoltage = info.ratedVoltage || payload.ratedVoltage || '';
    merged.operatingVoltage = info.operatingVoltage || payload.operatingVoltage || '';
    merged.ampacity = info.ampacity || payload.ampacity || '';
    merged.mvaRating = info.mvaRating || payload.mvaRating || '';
    
    // Visual Mechanical Inspection - handle both object and array formats
    const rawVmi = payload.visualMechanicalInspection || payload.visual_mechanical_inspection || 
                   info.visualMechanicalInspection || {};
    if (Array.isArray(rawVmi)) {
      rawVmi.forEach((item: any) => {
        const key = item.id || item.netaSection || '';
        const val = item.result || item.value || '';
        if (key) merged.visualMechanicalInspection[key] = val;
      });
    } else if (typeof rawVmi === 'object') {
      Object.assign(merged.visualMechanicalInspection, rawVmi);
    }
    
    // Counter Reading
    merged.counterReadingAsFound = payload.counterReadingAsFound || info.counterReadingAsFound || '';
    merged.counterReadingAsLeft = payload.counterReadingAsLeft || info.counterReadingAsLeft || '';
    
    // Contact Resistance
    const cr = payload.contactResistance || info.contactResistance || {};
    merged.contactResistance = {
      p1: cr.p1 || '',
      p2: cr.p2 || '',
      p3: cr.p3 || '',
      units: cr.units || 'μΩ'
    };
    
    // Insulation Resistance
    const ir = payload.insulationResistanceMeasured || info.insulationResistanceMeasured || {};
    merged.insulationResistanceMeasured = {
      testVoltage: ir.testVoltage || '1000V',
      poleToPoleUnits: ir.poleToPoleUnits || 'MΩ',
      poleToFrameUnits: ir.poleToFrameUnits || 'MΩ',
      lineToLoadUnits: ir.lineToLoadUnits || 'MΩ',
      poleToPoleClosedP1P2: ir.poleToPoleClosedP1P2 || '',
      poleToPoleClosedP2P3: ir.poleToPoleClosedP2P3 || '',
      poleToPoleClosedP3P1: ir.poleToPoleClosedP3P1 || '',
      poleToFrameClosedP1: ir.poleToFrameClosedP1 || '',
      poleToFrameClosedP2: ir.poleToFrameClosedP2 || '',
      poleToFrameClosedP3: ir.poleToFrameClosedP3 || '',
      lineToLoadOpenP1: ir.lineToLoadOpenP1 || '',
      lineToLoadOpenP2: ir.lineToLoadOpenP2 || '',
      lineToLoadOpenP3: ir.lineToLoadOpenP3 || ''
    };
    
    // Dielectric Withstand
    const dw = payload.dielectricWithstandClosed || info.dielectricWithstandClosed || {};
    merged.dielectricWithstandClosed = {
      p1Ground: dw.p1Ground || '',
      p2Ground: dw.p2Ground || '',
      p3Ground: dw.p3Ground || '',
      units: dw.units || 'μA',
      testVoltage: dw.testVoltage || '',
      testDuration: dw.testDuration || '1 Min.'
    };
    
    const vi = payload.vacuumIntegrityOpen || info.vacuumIntegrityOpen || {};
    merged.vacuumIntegrityOpen = {
      p1: vi.p1 || '',
      p2: vi.p2 || '',
      p3: vi.p3 || '',
      units: vi.units || 'μA',
      testVoltage: vi.testVoltage || '',
      testDuration: vi.testDuration || '1 Min.'
    };
    
    // Test Equipment
    const te = payload.testEquipment || info.testEquipment || {};
    merged.testEquipment = {
      insulationResistanceTester: {
        model: te.insulationResistanceTester?.model || '',
        serial: te.insulationResistanceTester?.serial || '',
        id: te.insulationResistanceTester?.id || ''
      },
      microOhmmeter: {
        model: te.microOhmmeter?.model || '',
        serial: te.microOhmmeter?.serial || '',
        id: te.microOhmmeter?.id || ''
      },
      hiPotTester: {
        model: te.hiPotTester?.model || '',
        serial: te.hiPotTester?.serial || '',
        id: te.hiPotTester?.id || ''
      }
    };
    
    merged.comments = payload.comments || info.comments || '';
    
    setFormData(merged);
  }, [reportData, job]);

  // Calculate TCF when temperature changes
  useEffect(() => {
    const tcf = getTCF(formData.temperature.celsius);
    if (tcf !== formData.temperature.tcf) {
      setFormData(prev => ({
        ...prev,
        temperature: { ...prev.temperature, tcf }
      }));
    }
  }, [formData.temperature.celsius]);

  // Calculate temperature corrected value
  const calculateCorrectedValue = (value: string): string => {
    if (!value || value === '') return '';
    const trimmed = value.trim();
    if (trimmed.toUpperCase() === 'N/A' || trimmed.includes('>') || trimmed.includes('<')) return value;
    const numeric = parseFloat(trimmed);
    if (isNaN(numeric)) return value;
    return (numeric * formData.temperature.tcf).toFixed(2);
  };

  // Set field helper
  const setField = (path: string, value: any) => {
    setFormData(prev => {
      const newData = { ...prev };
      const parts = path.split('.');
      let current: any = newData;
      for (let i = 0; i < parts.length - 1; i++) {
        if (current[parts[i]] === undefined) current[parts[i]] = {};
        current = current[parts[i]];
      }
      current[parts[parts.length - 1]] = value;
      return newData;
    });
  };

  // Handle temperature changes
  const handleFahrenheitChange = (fahrenheit: number) => {
    const celsius = Math.round((fahrenheit - 32) * 5 / 9);
    const tcf = getTCF(celsius);
    setFormData(prev => ({
      ...prev,
      temperature: { fahrenheit, celsius, tcf }
    }));
  };

  const handleCelsiusChange = (celsius: number) => {
    const fahrenheit = Math.round((celsius * 9 / 5) + 32);
    const tcf = getTCF(celsius);
    setFormData(prev => ({
      ...prev,
      temperature: { fahrenheit, celsius, tcf }
    }));
  };

  // Handle save
  const handleSave = () => {
    // Convert visual inspection to array format for compatibility
    const vmiArray = Object.entries(formData.visualMechanicalInspection).map(([id, result]) => ({ id, result }));
    
    const saveData = {
      report_data: {
        ...formData,
        visual_mechanical_inspection: vmiArray
      }
    };
    onSave(saveData);
  };

  return (
    <div className="report-container">
      {/* Header */}
      <div className="report-header">
        <h1 className="report-title">Medium Voltage Circuit Breaker Inspection & Test Report</h1>
        <div className="report-header-buttons">
          <button
            className={`status-button ${formData.status === 'PASS' ? 'pass' : formData.status === 'FAIL' ? 'fail' : 'limited'}`}
            onClick={() => {
              const statuses: Array<'PASS' | 'FAIL' | 'LIMITED SERVICE'> = ['PASS', 'FAIL', 'LIMITED SERVICE'];
              const idx = statuses.indexOf(formData.status);
              setField('status', statuses[(idx + 1) % statuses.length]);
            }}
          >
            {formData.status}
          </button>
          <button className="save-button" onClick={handleSave}>
            Save Report
          </button>
        </div>
      </div>

      {/* Job Information */}
      <section className="report-section">
        <div className="section-divider"></div>
        <h2 className="section-title">Job Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="form-field">
            <label>Job #:</label>
            <input value={formData.jobNumber || ''} readOnly className="report-input bg-gray-100" />
          </div>
          <div className="form-field">
            <label>Customer:</label>
            <input value={formData.customer || ''} readOnly className="report-input bg-gray-100" />
          </div>
          <div className="form-field">
            <label>Address:</label>
            <input value={formData.address || ''} readOnly className="report-input bg-gray-100" />
          </div>
          <div className="form-field">
            <label>Technicians:</label>
            <input value={formData.technicians || ''} onChange={e => setField('technicians', e.target.value)} className="report-input" />
          </div>
          <div className="form-field">
            <label>User:</label>
            <input value={formData.user || ''} onChange={e => setField('user', e.target.value)} className="report-input" />
          </div>
          <div className="form-field">
            <label>Substation:</label>
            <input value={formData.substation || ''} onChange={e => setField('substation', e.target.value)} className="report-input" />
          </div>
          <div className="form-field">
            <label>Date:</label>
            <input type="date" value={formData.date || ''} onChange={e => setField('date', e.target.value)} className="report-input" />
          </div>
          <div className="form-field">
            <label>Eqpt. Location:</label>
            <input value={formData.eqptLocation || ''} onChange={e => setField('eqptLocation', e.target.value)} className="report-input" />
          </div>
          <div className="form-field">
            <label>Identifier:</label>
            <input value={formData.identifier || ''} onChange={e => setField('identifier', e.target.value)} className="report-input" />
          </div>
        </div>
        <div className="grid grid-cols-4 gap-4 mt-4">
          <div className="form-field">
            <label>Temp. °F:</label>
            <input type="number" value={formData.temperature.fahrenheit} onChange={e => handleFahrenheitChange(Number(e.target.value))} className="report-input" style={{width: '80px'}} />
          </div>
          <div className="form-field">
            <label>°C:</label>
            <input type="number" value={formData.temperature.celsius} onChange={e => handleCelsiusChange(Number(e.target.value))} className="report-input" style={{width: '80px'}} />
          </div>
          <div className="form-field">
            <label>TCF:</label>
            <input value={formData.temperature.tcf} readOnly className="report-input bg-gray-100" style={{width: '80px'}} />
          </div>
          <div className="form-field">
            <label>Humidity %:</label>
            <input type="number" value={formData.humidity} onChange={e => setField('humidity', Number(e.target.value))} className="report-input" style={{width: '80px'}} />
          </div>
        </div>
      </section>

      {/* Nameplate Data */}
      <section className="report-section">
        <div className="section-divider"></div>
        <h2 className="section-title">Nameplate Data</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="form-field">
            <label>Manufacturer:</label>
            <input value={formData.manufacturer || ''} onChange={e => setField('manufacturer', e.target.value)} className="report-input" />
          </div>
          <div className="form-field">
            <label>I.C. Rating (kA):</label>
            <input value={formData.icRating || ''} onChange={e => setField('icRating', e.target.value)} className="report-input" />
          </div>
          <div className="form-field">
            <label>Catalog Number:</label>
            <input value={formData.catalogNumber || ''} onChange={e => setField('catalogNumber', e.target.value)} className="report-input" />
          </div>
          <div className="form-field">
            <label>Rated Voltage (kV):</label>
            <input value={formData.ratedVoltage || ''} onChange={e => setField('ratedVoltage', e.target.value)} className="report-input" />
          </div>
          <div className="form-field">
            <label>Serial Number:</label>
            <input value={formData.serialNumber || ''} onChange={e => setField('serialNumber', e.target.value)} className="report-input" />
          </div>
          <div className="form-field">
            <label>Operating Voltage (kV):</label>
            <input value={formData.operatingVoltage || ''} onChange={e => setField('operatingVoltage', e.target.value)} className="report-input" />
          </div>
          <div className="form-field">
            <label>Type:</label>
            <input value={formData.type || ''} onChange={e => setField('type', e.target.value)} className="report-input" />
          </div>
          <div className="form-field">
            <label>Ampacity (A):</label>
            <input value={formData.ampacity || ''} onChange={e => setField('ampacity', e.target.value)} className="report-input" />
          </div>
          <div className="form-field">
            <label>Manufacturing Date:</label>
            <input value={formData.manufacturingDate || ''} onChange={e => setField('manufacturingDate', e.target.value)} className="report-input" />
          </div>
          <div className="form-field">
            <label>MVA Rating:</label>
            <input value={formData.mvaRating || ''} onChange={e => setField('mvaRating', e.target.value)} className="report-input" />
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
                <th style={{ width: '70%' }}>Description</th>
                <th style={{ width: '18%' }}>Results</th>
              </tr>
            </thead>
            <tbody>
              {VISUAL_INSPECTION_ITEMS.map(item => (
                <tr key={item.id}>
                  <td className="text-center">{item.id}</td>
                  <td className="text-left">{item.description}</td>
                  <td>
                    <select
                      value={formData.visualMechanicalInspection[item.id] || ''}
                      onChange={e => setField(`visualMechanicalInspection.${item.id}`, e.target.value)}
                      className="report-input"
                    >
                      <option value="">Select One</option>
                      {VISUAL_INSPECTION_OPTIONS.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Counter Reading */}
        <div className="mt-4">
          <table className="report-table" style={{ width: 'auto' }}>
            <thead>
              <tr>
                <th colSpan={2}>Counter Reading</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ width: '100px' }}>As Found</td>
                <td>
                  <input
                    value={formData.counterReadingAsFound || ''}
                    onChange={e => setField('counterReadingAsFound', e.target.value)}
                    className="report-input"
                  />
                </td>
              </tr>
              <tr>
                <td>As Left</td>
                <td>
                  <input
                    value={formData.counterReadingAsLeft || ''}
                    onChange={e => setField('counterReadingAsLeft', e.target.value)}
                    className="report-input"
                  />
                </td>
              </tr>
            </tbody>
          </table>
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
                <th>P1</th>
                <th>P2</th>
                <th>P3</th>
                <th>Units</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <input
                    value={formData.contactResistance.p1 || ''}
                    onChange={e => setField('contactResistance.p1', e.target.value)}
                    className="report-input text-center"
                  />
                </td>
                <td>
                  <input
                    value={formData.contactResistance.p2 || ''}
                    onChange={e => setField('contactResistance.p2', e.target.value)}
                    className="report-input text-center"
                  />
                </td>
                <td>
                  <input
                    value={formData.contactResistance.p3 || ''}
                    onChange={e => setField('contactResistance.p3', e.target.value)}
                    className="report-input text-center"
                  />
                </td>
                <td>
                  <select
                    value={formData.contactResistance.units || 'μΩ'}
                    onChange={e => setField('contactResistance.units', e.target.value)}
                    className="report-input"
                  >
                    {CONTACT_RESISTANCE_UNITS.map(u => (
                      <option key={u} value={u}>{u}</option>
                    ))}
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
        <div className="flex items-center gap-4 mb-4">
          <label className="text-sm font-medium">Test Voltage:</label>
          <select
            value={formData.insulationResistanceMeasured.testVoltage || '1000V'}
            onChange={e => setField('insulationResistanceMeasured.testVoltage', e.target.value)}
            className="report-input"
            style={{ width: 'auto' }}
          >
            {INSULATION_TEST_VOLTAGES.map(v => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </div>
        <div className="table-container">
          <table className="report-table">
            <thead>
              <tr>
                <th rowSpan={2}></th>
                <th colSpan={3} className="text-center">Measured Values</th>
                <th colSpan={3} className="text-center">Temperature Corrected</th>
                <th rowSpan={2}>Units</th>
              </tr>
              <tr>
                <th>P1 (P1-P2)</th>
                <th>P2 (P2-P3)</th>
                <th>P3 (P3-P1)</th>
                <th>P1 (P1-P2)</th>
                <th>P2 (P2-P3)</th>
                <th>P3 (P3-P1)</th>
              </tr>
            </thead>
            <tbody>
              {/* Pole to Pole (Closed) */}
              <tr>
                <td className="font-medium">Pole to Pole (Closed)</td>
                <td><input value={formData.insulationResistanceMeasured.poleToPoleClosedP1P2 || ''} onChange={e => setField('insulationResistanceMeasured.poleToPoleClosedP1P2', e.target.value)} className="report-input text-center" /></td>
                <td><input value={formData.insulationResistanceMeasured.poleToPoleClosedP2P3 || ''} onChange={e => setField('insulationResistanceMeasured.poleToPoleClosedP2P3', e.target.value)} className="report-input text-center" /></td>
                <td><input value={formData.insulationResistanceMeasured.poleToPoleClosedP3P1 || ''} onChange={e => setField('insulationResistanceMeasured.poleToPoleClosedP3P1', e.target.value)} className="report-input text-center" /></td>
                <td><input value={calculateCorrectedValue(formData.insulationResistanceMeasured.poleToPoleClosedP1P2)} readOnly className="report-input text-center bg-yellow-50" /></td>
                <td><input value={calculateCorrectedValue(formData.insulationResistanceMeasured.poleToPoleClosedP2P3)} readOnly className="report-input text-center bg-yellow-50" /></td>
                <td><input value={calculateCorrectedValue(formData.insulationResistanceMeasured.poleToPoleClosedP3P1)} readOnly className="report-input text-center bg-yellow-50" /></td>
                <td>
                  <select value={formData.insulationResistanceMeasured.poleToPoleUnits || 'MΩ'} onChange={e => setField('insulationResistanceMeasured.poleToPoleUnits', e.target.value)} className="report-input">
                    {INSULATION_RESISTANCE_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </td>
              </tr>
              {/* Pole to Frame (Closed) */}
              <tr>
                <td className="font-medium">Pole to Frame (Closed)</td>
                <td><input value={formData.insulationResistanceMeasured.poleToFrameClosedP1 || ''} onChange={e => setField('insulationResistanceMeasured.poleToFrameClosedP1', e.target.value)} className="report-input text-center" /></td>
                <td><input value={formData.insulationResistanceMeasured.poleToFrameClosedP2 || ''} onChange={e => setField('insulationResistanceMeasured.poleToFrameClosedP2', e.target.value)} className="report-input text-center" /></td>
                <td><input value={formData.insulationResistanceMeasured.poleToFrameClosedP3 || ''} onChange={e => setField('insulationResistanceMeasured.poleToFrameClosedP3', e.target.value)} className="report-input text-center" /></td>
                <td><input value={calculateCorrectedValue(formData.insulationResistanceMeasured.poleToFrameClosedP1)} readOnly className="report-input text-center bg-yellow-50" /></td>
                <td><input value={calculateCorrectedValue(formData.insulationResistanceMeasured.poleToFrameClosedP2)} readOnly className="report-input text-center bg-yellow-50" /></td>
                <td><input value={calculateCorrectedValue(formData.insulationResistanceMeasured.poleToFrameClosedP3)} readOnly className="report-input text-center bg-yellow-50" /></td>
                <td>
                  <select value={formData.insulationResistanceMeasured.poleToFrameUnits || 'MΩ'} onChange={e => setField('insulationResistanceMeasured.poleToFrameUnits', e.target.value)} className="report-input">
                    {INSULATION_RESISTANCE_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </td>
              </tr>
              {/* Line to Load (Open) */}
              <tr>
                <td className="font-medium">Line to Load (Open)</td>
                <td><input value={formData.insulationResistanceMeasured.lineToLoadOpenP1 || ''} onChange={e => setField('insulationResistanceMeasured.lineToLoadOpenP1', e.target.value)} className="report-input text-center" /></td>
                <td><input value={formData.insulationResistanceMeasured.lineToLoadOpenP2 || ''} onChange={e => setField('insulationResistanceMeasured.lineToLoadOpenP2', e.target.value)} className="report-input text-center" /></td>
                <td><input value={formData.insulationResistanceMeasured.lineToLoadOpenP3 || ''} onChange={e => setField('insulationResistanceMeasured.lineToLoadOpenP3', e.target.value)} className="report-input text-center" /></td>
                <td><input value={calculateCorrectedValue(formData.insulationResistanceMeasured.lineToLoadOpenP1)} readOnly className="report-input text-center bg-yellow-50" /></td>
                <td><input value={calculateCorrectedValue(formData.insulationResistanceMeasured.lineToLoadOpenP2)} readOnly className="report-input text-center bg-yellow-50" /></td>
                <td><input value={calculateCorrectedValue(formData.insulationResistanceMeasured.lineToLoadOpenP3)} readOnly className="report-input text-center bg-yellow-50" /></td>
                <td>
                  <select value={formData.insulationResistanceMeasured.lineToLoadUnits || 'MΩ'} onChange={e => setField('insulationResistanceMeasured.lineToLoadUnits', e.target.value)} className="report-input">
                    {INSULATION_RESISTANCE_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Vacuum Integrity/Dielectric Withstand */}
      <section className="report-section">
        <div className="section-divider"></div>
        <h2 className="section-title">Vacuum Integrity/Dielectric Withstand</h2>
        
        {/* Dielectric Withstand - Breaker CLOSED */}
        <div className="mb-6">
          <div className="table-container">
            <table className="report-table">
              <thead>
                <tr>
                  <th colSpan={5} className="text-center">Dielectric Withstand - Breaker CLOSED</th>
                </tr>
                <tr>
                  <th></th>
                  <th>P1-Ground</th>
                  <th>P2-Ground</th>
                  <th>P3-Ground</th>
                  <th>Units</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Result:</td>
                  <td><input value={formData.dielectricWithstandClosed.p1Ground || ''} onChange={e => setField('dielectricWithstandClosed.p1Ground', e.target.value)} className="report-input text-center" /></td>
                  <td><input value={formData.dielectricWithstandClosed.p2Ground || ''} onChange={e => setField('dielectricWithstandClosed.p2Ground', e.target.value)} className="report-input text-center" /></td>
                  <td><input value={formData.dielectricWithstandClosed.p3Ground || ''} onChange={e => setField('dielectricWithstandClosed.p3Ground', e.target.value)} className="report-input text-center" /></td>
                  <td>
                    <select value={formData.dielectricWithstandClosed.units || 'μA'} onChange={e => setField('dielectricWithstandClosed.units', e.target.value)} className="report-input">
                      {DIELECTRIC_WITHSTAND_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="flex justify-end gap-4 mt-2">
            <div className="form-field">
              <label>Test Voltage:</label>
              <input value={formData.dielectricWithstandClosed.testVoltage || ''} onChange={e => setField('dielectricWithstandClosed.testVoltage', e.target.value)} className="report-input" style={{width: '100px'}} />
            </div>
            <div className="form-field">
              <label>Test Duration:</label>
              <input value={formData.dielectricWithstandClosed.testDuration || '1 Min.'} onChange={e => setField('dielectricWithstandClosed.testDuration', e.target.value)} className="report-input" style={{width: '100px'}} />
            </div>
          </div>
        </div>

        {/* Vacuum Integrity - Breaker OPEN */}
        <div>
          <div className="table-container">
            <table className="report-table">
              <thead>
                <tr>
                  <th colSpan={5} className="text-center">Vacuum Integrity - Breaker OPEN</th>
                </tr>
                <tr>
                  <th></th>
                  <th>P1</th>
                  <th>P2</th>
                  <th>P3</th>
                  <th>Units</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Result:</td>
                  <td><input value={formData.vacuumIntegrityOpen.p1 || ''} onChange={e => setField('vacuumIntegrityOpen.p1', e.target.value)} className="report-input text-center" /></td>
                  <td><input value={formData.vacuumIntegrityOpen.p2 || ''} onChange={e => setField('vacuumIntegrityOpen.p2', e.target.value)} className="report-input text-center" /></td>
                  <td><input value={formData.vacuumIntegrityOpen.p3 || ''} onChange={e => setField('vacuumIntegrityOpen.p3', e.target.value)} className="report-input text-center" /></td>
                  <td>
                    <select value={formData.vacuumIntegrityOpen.units || 'μA'} onChange={e => setField('vacuumIntegrityOpen.units', e.target.value)} className="report-input">
                      {DIELECTRIC_WITHSTAND_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="flex justify-end gap-4 mt-2">
            <div className="form-field">
              <label>Test Voltage:</label>
              <input value={formData.vacuumIntegrityOpen.testVoltage || ''} onChange={e => setField('vacuumIntegrityOpen.testVoltage', e.target.value)} className="report-input" style={{width: '100px'}} />
            </div>
            <div className="form-field">
              <label>Test Duration:</label>
              <input value={formData.vacuumIntegrityOpen.testDuration || '1 Min.'} onChange={e => setField('vacuumIntegrityOpen.testDuration', e.target.value)} className="report-input" style={{width: '100px'}} />
            </div>
          </div>
        </div>
      </section>

      {/* Test Equipment Used */}
      <section className="report-section">
        <div className="section-divider"></div>
        <h2 className="section-title">Test Equipment Used</h2>
        <div className="table-container">
          <table className="report-table">
            <thead>
              <tr>
                <th>Equipment</th>
                <th>Model</th>
                <th>Serial</th>
                <th>ID</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Insulation Resistance Tester</td>
                <td><input value={formData.testEquipment.insulationResistanceTester.model || ''} onChange={e => setField('testEquipment.insulationResistanceTester.model', e.target.value)} className="report-input" /></td>
                <td><input value={formData.testEquipment.insulationResistanceTester.serial || ''} onChange={e => setField('testEquipment.insulationResistanceTester.serial', e.target.value)} className="report-input" /></td>
                <td><input value={formData.testEquipment.insulationResistanceTester.id || ''} onChange={e => setField('testEquipment.insulationResistanceTester.id', e.target.value)} className="report-input" /></td>
              </tr>
              <tr>
                <td>Micro-ohmmeter</td>
                <td><input value={formData.testEquipment.microOhmmeter.model || ''} onChange={e => setField('testEquipment.microOhmmeter.model', e.target.value)} className="report-input" /></td>
                <td><input value={formData.testEquipment.microOhmmeter.serial || ''} onChange={e => setField('testEquipment.microOhmmeter.serial', e.target.value)} className="report-input" /></td>
                <td><input value={formData.testEquipment.microOhmmeter.id || ''} onChange={e => setField('testEquipment.microOhmmeter.id', e.target.value)} className="report-input" /></td>
              </tr>
              <tr>
                <td>Hi-Pot Tester</td>
                <td><input value={formData.testEquipment.hiPotTester.model || ''} onChange={e => setField('testEquipment.hiPotTester.model', e.target.value)} className="report-input" /></td>
                <td><input value={formData.testEquipment.hiPotTester.serial || ''} onChange={e => setField('testEquipment.hiPotTester.serial', e.target.value)} className="report-input" /></td>
                <td><input value={formData.testEquipment.hiPotTester.id || ''} onChange={e => setField('testEquipment.hiPotTester.id', e.target.value)} className="report-input" /></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Comments */}
      <section className="report-section">
        <div className="section-divider"></div>
        <h2 className="section-title">Comments</h2>
        <textarea
          value={formData.comments || ''}
          onChange={e => setField('comments', e.target.value)}
          className="report-input w-full"
          rows={6}
          placeholder="Enter any comments or notes here..."
        />
      </section>
    </div>
  );
};

export default MediumVoltageCircuitBreakerReport;
