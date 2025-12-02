import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './ReportStyles.css';

// TCF lookup table
const TCF_TABLE: { [key: string]: number } = {
  '-24': 0.054, '-23': 0.068, '-22': 0.082, '-21': 0.096, '-20': 0.110,
  '-19': 0.124, '-18': 0.138, '-17': 0.152, '-16': 0.166, '-15': 0.180,
  '-14': 0.194, '-13': 0.208, '-12': 0.222, '-11': 0.236, '-10': 0.250,
  '-9': 0.264, '-8': 0.278, '-7': 0.292, '-6': 0.306, '-5': 0.320,
  '-4': 0.336, '-3': 0.352, '-2': 0.368, '-1': 0.384, '0': 0.400,
  '1': 0.420, '2': 0.440, '3': 0.460, '4': 0.480, '5': 0.500,
  '6': 0.526, '7': 0.552, '8': 0.578, '9': 0.604, '10': 0.630,
  '11': 0.666, '12': 0.702, '13': 0.738, '14': 0.774, '15': 0.810,
  '16': 0.848, '17': 0.886, '18': 0.924, '19': 0.962, '20': 1.000,
  '21': 1.050, '22': 1.100, '23': 1.150, '24': 1.200, '25': 1.250,
  '26': 1.316, '27': 1.382, '28': 1.448, '29': 1.514, '30': 1.580,
  '31': 1.664, '32': 1.748, '33': 1.832, '34': 1.872, '35': 2.000,
  '36': 2.100, '37': 2.200, '38': 2.300, '39': 2.400, '40': 2.500,
};

const getTCF = (tempF: number): number => {
  const tempC = Math.round((tempF - 32) * 5 / 9);
  const key = tempC.toString();
  return TCF_TABLE[key] !== undefined ? TCF_TABLE[key] : 1;
};

// Dropdown options
const INSPECTION_OPTIONS = ['Select One', 'Satisfactory', 'Unsatisfactory', 'Cleaned', 'See Comments', 'Not Applicable'];
const INSULATION_RESISTANCE_UNITS = ['kΩ', 'MΩ', 'GΩ'];
const INSULATION_TEST_VOLTAGES = ['250V', '500V', '1000V', '2500V', '5000V'];
const CONTACT_RESISTANCE_UNITS = ['μΩ', 'mΩ', 'Ω'];

interface FormData {
  customer: string;
  address: string;
  user: string;
  date: string;
  identifier: string;
  jobNumber: string;
  technicians: string;
  substation: string;
  equipment: string;
  temperature: number;
  celsius: number;
  tcf: number;
  humidity: string;
  manufacturer: string;
  catalogNumber: string;
  serialNumber: string;
  fedFrom: string;
  conductorMaterial: string;
  ratedVoltage: string;
  operatingVoltage: string;
  ampacity: string;
  netaResults: { [key: string]: string };
  busResistance: { p1: string; p2: string; p3: string; neutral: string; };
  testVoltage: string;
  insulationResistance: { [key: string]: string };
  correctedInsulationResistance: { [key: string]: string };
  insulationResistanceUnit: string;
  contactResistanceUnit: string;
  megohmmeter: string;
  megohmSerial: string;
  megAmpId: string;
  lowResistanceOhmmeter: string;
  lowResistanceSerial: string;
  lowResistanceAmpId: string;
  comments: string;
  status: 'PASS' | 'FAIL' | 'LIMITED SERVICE';
}

const NETA_SECTIONS = [
  { id: '7.4.A.1', description: 'Inspect physical and mechanical condition.' },
  { id: '7.4.A.2', description: 'Inspect anchorage, alignment, and grounding.' },
  { id: '7.4.A.3', description: 'Verify that bolted connections are tight.' },
  { id: '7.4.A.4', description: 'Verify that appropriate lubricant is used on moving current-carrying parts and on moving and sliding surfaces.' },
  { id: '7.4.A.5.1', description: 'Use of a low-resistance ohmmeter in accordance with Section 7.4.B.1.' },
  { id: '7.4.A.6', description: 'Inspect bus insulation for physical damage, corona tracking, or contamination.' },
  { id: '7.4.A.7', description: 'Verify correct phase arrangement.' },
  { id: '7.4.A.8', description: 'Verify that bus supports are in place and secure.' },
  { id: '7.4.A.9', description: 'Clean the unit.' },
];

const IR_KEYS = ['A-B', 'B-C', 'C-A', 'A-N', 'B-N', 'C-N', 'A-G', 'B-G', 'C-G', 'N-G'];

// Map between display keys and database keys
const IR_KEY_MAP: { [key: string]: string } = {
  'A-B': 'aToB', 'B-C': 'bToC', 'C-A': 'cToA',
  'A-N': 'aToN', 'B-N': 'bToN', 'C-N': 'cToN',
  'A-G': 'aToG', 'B-G': 'bToG', 'C-G': 'cToG', 'N-G': 'nToG'
};

const IR_KEY_MAP_REVERSE: { [key: string]: string } = {
  'aToB': 'A-B', 'bToC': 'B-C', 'cToA': 'C-A',
  'aToN': 'A-N', 'bToN': 'B-N', 'cToN': 'C-N',
  'aToG': 'A-G', 'bToG': 'B-G', 'cToG': 'C-G', 'nToG': 'N-G'
};

const createDefaultFormData = (): FormData => ({
  customer: '', address: '', user: '',
  date: new Date().toISOString().split('T')[0],
  identifier: '', jobNumber: '', technicians: '',
  substation: '', equipment: '',
  temperature: 68, celsius: 20, tcf: 1, humidity: '',
  manufacturer: '', catalogNumber: '', serialNumber: '',
  fedFrom: '', conductorMaterial: '', ratedVoltage: '',
  operatingVoltage: '', ampacity: '',
  netaResults: NETA_SECTIONS.reduce((acc, s) => ({ ...acc, [s.id]: 'Select One' }), {}),
  busResistance: { p1: '', p2: '', p3: '', neutral: '' },
  testVoltage: '1000V',
  insulationResistance: IR_KEYS.reduce((acc, k) => ({ ...acc, [k]: '' }), {}),
  correctedInsulationResistance: IR_KEYS.reduce((acc, k) => ({ ...acc, [k]: '' }), {}),
  insulationResistanceUnit: 'MΩ',
  contactResistanceUnit: 'μΩ',
  megohmmeter: '', megohmSerial: '', megAmpId: '',
  lowResistanceOhmmeter: '', lowResistanceSerial: '', lowResistanceAmpId: '',
  comments: '',
  status: 'PASS'
});

interface MetalEnclosedBuswayReportProps {
  reportData?: any;
  isEditing?: boolean;
  onSave?: (data: any) => Promise<void>;
}

const MetalEnclosedBuswayReport: React.FC<MetalEnclosedBuswayReportProps> = ({
  reportData,
  isEditing: externalIsEditing,
  onSave
}) => {
  const { id: jobId, reportId } = useParams<{ id: string; reportId: string }>();
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData>(createDefaultFormData());
  const [isEditing, setIsEditing] = useState(externalIsEditing ?? !reportId);
  const [isSaving, setIsSaving] = useState(false);

  // Load job info
  const loadJobInfo = async () => {
    if (!jobId) return;
    try {
      const result = await (window as any).electronAPI.queryDatabase(
        `SELECT j.*, c.name as customer_name, c.company_name, c.address as customer_address
         FROM jobs j LEFT JOIN customers c ON j.customer_id = c.id WHERE j.id = ?`,
        [jobId]
      );
      if (result && result.length > 0) {
        const job = result[0];
        setFormData(prev => ({
          ...prev,
          customer: job.company_name || job.customer_name || '',
          address: job.customer_address || job.site_address || '',
          jobNumber: job.job_number || ''
        }));
      }
    } catch (error) {
      console.error('Error loading job info:', error);
    }
  };

  // Normalize insulation resistance from various data formats
  const normalizeInsulationResistance = (data: any): { [key: string]: string } => {
    const result: { [key: string]: string } = {};
    IR_KEYS.forEach(k => { result[k] = ''; });

    if (!data) return result;

    // Check for insulation_resistance.readings structure (web app format)
    if (data.insulation_resistance?.readings) {
      const readings = data.insulation_resistance.readings;
      Object.keys(IR_KEY_MAP).forEach(displayKey => {
        const dbKey = IR_KEY_MAP[displayKey];
        if (readings[dbKey] !== undefined && readings[dbKey] !== null && readings[dbKey] !== '') {
          result[displayKey] = String(readings[dbKey]);
        }
      });
    }

    // Check for insulationResistance at top level with display keys
    if (data.insulationResistance) {
      Object.keys(data.insulationResistance).forEach(key => {
        if (IR_KEYS.includes(key) && data.insulationResistance[key]) {
          result[key] = String(data.insulationResistance[key]);
        }
        // Also check for camelCase keys
        if (IR_KEY_MAP_REVERSE[key]) {
          result[IR_KEY_MAP_REVERSE[key]] = String(data.insulationResistance[key]);
        }
      });
    }

    // Check for direct readings with camelCase keys at top level
    Object.keys(IR_KEY_MAP).forEach(displayKey => {
      const dbKey = IR_KEY_MAP[displayKey];
      if (data[dbKey] !== undefined && data[dbKey] !== null && data[dbKey] !== '') {
        result[displayKey] = String(data[dbKey]);
      }
    });

    return result;
  };

  // Normalize corrected insulation resistance
  const normalizeCorrectedInsulationResistance = (data: any): { [key: string]: string } => {
    const result: { [key: string]: string } = {};
    IR_KEYS.forEach(k => { result[k] = ''; });

    if (!data) return result;

    // Check for insulation_resistance.correctedReadings structure (web app format)
    if (data.insulation_resistance?.correctedReadings) {
      const readings = data.insulation_resistance.correctedReadings;
      Object.keys(IR_KEY_MAP).forEach(displayKey => {
        const dbKey = IR_KEY_MAP[displayKey];
        if (readings[dbKey] !== undefined && readings[dbKey] !== null && readings[dbKey] !== '') {
          result[displayKey] = String(readings[dbKey]);
        }
      });
    }

    // Check for correctedInsulationResistance at top level
    if (data.correctedInsulationResistance) {
      Object.keys(data.correctedInsulationResistance).forEach(key => {
        if (IR_KEYS.includes(key) && data.correctedInsulationResistance[key]) {
          result[key] = String(data.correctedInsulationResistance[key]);
        }
        if (IR_KEY_MAP_REVERSE[key]) {
          result[IR_KEY_MAP_REVERSE[key]] = String(data.correctedInsulationResistance[key]);
        }
      });
    }

    return result;
  };

  // Load report data
  useEffect(() => {
    if (reportData) {
      const data = typeof reportData === 'string' ? JSON.parse(reportData) : reportData;
      
      // Extract insulation resistance with proper normalization
      const normalizedIR = normalizeInsulationResistance(data);
      const normalizedCorrectedIR = normalizeCorrectedInsulationResistance(data);
      
      // Get test voltage from various locations
      const testVoltage = data.insulation_resistance?.testVoltage || 
                          data.testVoltage || 
                          data.testVoltage1 || 
                          '1000V';
      
      // Get TCF from various locations
      const tcf = data.insulation_resistance?.tcf ||
                  data.tcf ||
                  data.temperature?.tcf ||
                  1;
      
      setFormData(prev => {
        const merged = deepMerge(prev, data);
        return {
          ...merged,
          insulationResistance: normalizedIR,
          correctedInsulationResistance: normalizedCorrectedIR,
          testVoltage: testVoltage,
          tcf: typeof tcf === 'number' ? tcf : parseFloat(tcf) || 1
        };
      });
    }
    loadJobInfo();
  }, [reportData, jobId]);

  // Deep merge helper
  const deepMerge = (target: any, source: any): any => {
    const output = { ...target };
    if (isObject(target) && isObject(source)) {
      Object.keys(source).forEach(key => {
        if (isObject(source[key])) {
          if (!(key in target)) {
            Object.assign(output, { [key]: source[key] });
          } else {
            output[key] = deepMerge(target[key], source[key]);
          }
        } else if (source[key] !== undefined && source[key] !== null) {
          output[key] = source[key];
        }
      });
    }
    return output;
  };

  const isObject = (item: any): boolean => item && typeof item === 'object' && !Array.isArray(item);

  // Handle temperature changes
  const handleTemperatureChange = (tempF: number) => {
    const celsius = Math.round((tempF - 32) * 5 / 9);
    const tcf = getTCF(tempF);
    setFormData(prev => ({ ...prev, temperature: tempF, celsius, tcf }));
  };

  const handleCelsiusChange = (tempC: number) => {
    const tempF = Math.round(tempC * 9 / 5 + 32);
    const tcf = getTCF(tempF);
    setFormData(prev => ({ ...prev, temperature: tempF, celsius: tempC, tcf }));
  };

  // Generic field setter
  const setField = (path: string, value: any) => {
    setFormData(prev => {
      const newData = JSON.parse(JSON.stringify(prev));
      const keys = path.split('.');
      let obj = newData;
      for (let i = 0; i < keys.length - 1; i++) {
        if (!obj[keys[i]]) obj[keys[i]] = {};
        obj = obj[keys[i]];
      }
      obj[keys[keys.length - 1]] = value;
      return newData;
    });
  };

  // Calculate corrected insulation resistance
  useEffect(() => {
    const tcf = formData.tcf;
    if (!tcf || isNaN(tcf)) return;

    const corrected: { [key: string]: string } = {};
    IR_KEYS.forEach(key => {
      const value = parseFloat(formData.insulationResistance[key]);
      corrected[key] = isNaN(value) ? '' : (value * tcf).toFixed(2);
    });

    const changed = IR_KEYS.some(k => formData.correctedInsulationResistance[k] !== corrected[k]);
    if (changed) {
      setFormData(prev => ({ ...prev, correctedInsulationResistance: corrected }));
    }
  }, [formData.insulationResistance, formData.tcf]);

  // Save handler
  const handleSave = async () => {
    if (!jobId) return;
    setIsSaving(true);
    try {
      if (onSave) {
        await onSave(formData);
      } else {
        if (reportId) {
          await (window as any).electronAPI.queryDatabase(
            `UPDATE reports SET report_data = ?, is_dirty = 1 WHERE id = ?`,
            [JSON.stringify(formData), reportId]
          );
        } else {
          await (window as any).electronAPI.queryDatabase(
            `INSERT INTO reports (job_id, report_type, report_data, is_dirty) VALUES (?, ?, ?, 1)`,
            [jobId, 'metal-enclosed-busway', JSON.stringify(formData)]
          );
        }
        alert('Report saved successfully!');
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error saving report:', error);
      alert('Failed to save report');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="report-container">
      {/* Header */}
      <div className="report-header">
        <div>
          <h1 className="report-title">Metal Enclosed Busway Report</h1>
          <p className="report-subtitle">NETA - ATS 7.4</p>
        </div>
        <div className="report-header-actions">
          <button
            onClick={() => isEditing && setField('status', formData.status === 'PASS' ? 'FAIL' : 'PASS')}
            className={`report-status-btn ${formData.status === 'PASS' ? 'status-pass' : 'status-fail'}`}
            disabled={!isEditing}
          >
            {formData.status}
          </button>
          {!isEditing ? (
            <button onClick={() => setIsEditing(true)} className="report-edit-btn">Edit</button>
          ) : (
            <button onClick={handleSave} disabled={isSaving} className="report-save-btn">
              {isSaving ? 'Saving...' : 'Save Report'}
            </button>
          )}
        </div>
      </div>

      {/* Job Information */}
      <section className="report-section">
        <div className="section-divider"></div>
        <h2 className="section-title">Job Information</h2>
        <div className="form-grid">
          <div className="form-field"><label>Customer:</label><input value={formData.customer} readOnly className="report-input readonly" /></div>
          <div className="form-field"><label>Job #:</label><input value={formData.jobNumber} readOnly className="report-input readonly" /></div>
          <div className="form-field"><label>Address:</label><input value={formData.address} readOnly className="report-input readonly" /></div>
          <div className="form-field"><label>Technicians:</label><input value={formData.technicians} onChange={e => setField('technicians', e.target.value)} readOnly={!isEditing} className="report-input" /></div>
          <div className="form-field"><label>User:</label><input value={formData.user} onChange={e => setField('user', e.target.value)} readOnly={!isEditing} className="report-input" /></div>
          <div className="form-field"><label>Date:</label><input type="date" value={formData.date} onChange={e => setField('date', e.target.value)} readOnly={!isEditing} className="report-input" /></div>
          <div className="form-field"><label>Identifier:</label><input value={formData.identifier} onChange={e => setField('identifier', e.target.value)} readOnly={!isEditing} className="report-input" /></div>
          <div className="form-field"><label>Substation:</label><input value={formData.substation} onChange={e => setField('substation', e.target.value)} readOnly={!isEditing} className="report-input" /></div>
          <div className="form-field"><label>Equipment:</label><input value={formData.equipment} onChange={e => setField('equipment', e.target.value)} readOnly={!isEditing} className="report-input" /></div>
          <div className="form-field" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <label>Temp:</label>
            <input type="number" value={formData.temperature} onChange={e => handleTemperatureChange(Number(e.target.value))} readOnly={!isEditing} className="report-input" style={{ width: 70 }} />
            <span>°F</span>
            <input type="number" value={formData.celsius} onChange={e => handleCelsiusChange(Number(e.target.value))} readOnly={!isEditing} className="report-input" style={{ width: 70 }} />
            <span>°C</span>
            <span style={{ marginLeft: 8 }}>TCF:</span>
            <input type="number" value={formData.tcf.toFixed(3)} readOnly className="report-input readonly" style={{ width: 70 }} />
          </div>
          <div className="form-field" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <label>Humidity:</label>
            <input value={formData.humidity} onChange={e => setField('humidity', e.target.value)} readOnly={!isEditing} className="report-input" style={{ width: 70 }} />
            <span>%</span>
          </div>
        </div>
      </section>

      {/* Nameplate Data */}
      <section className="report-section">
        <div className="section-divider"></div>
        <h2 className="section-title">Nameplate Data</h2>
        <div className="form-grid">
          <div className="form-field"><label>Manufacturer:</label><input value={formData.manufacturer} onChange={e => setField('manufacturer', e.target.value)} readOnly={!isEditing} className="report-input" /></div>
          <div className="form-field"><label>Fed From:</label><input value={formData.fedFrom} onChange={e => setField('fedFrom', e.target.value)} readOnly={!isEditing} className="report-input" /></div>
          <div className="form-field"><label>Catalog Number:</label><input value={formData.catalogNumber} onChange={e => setField('catalogNumber', e.target.value)} readOnly={!isEditing} className="report-input" /></div>
          <div className="form-field"><label>Conductor Material:</label><input value={formData.conductorMaterial} onChange={e => setField('conductorMaterial', e.target.value)} readOnly={!isEditing} className="report-input" /></div>
          <div className="form-field"><label>Serial Number:</label><input value={formData.serialNumber} onChange={e => setField('serialNumber', e.target.value)} readOnly={!isEditing} className="report-input" /></div>
          <div className="form-field"><label>Rated Voltage:</label><input value={formData.ratedVoltage} onChange={e => setField('ratedVoltage', e.target.value)} readOnly={!isEditing} className="report-input" /></div>
          <div className="form-field"><label>Operating Voltage:</label><input value={formData.operatingVoltage} onChange={e => setField('operatingVoltage', e.target.value)} readOnly={!isEditing} className="report-input" /></div>
          <div className="form-field"><label>Ampacity:</label><input value={formData.ampacity} onChange={e => setField('ampacity', e.target.value)} readOnly={!isEditing} className="report-input" /></div>
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
                <th style={{ width: '15%' }}>NETA</th>
                <th style={{ width: '65%' }}>Description</th>
                <th style={{ width: '20%' }}>Result</th>
              </tr>
            </thead>
            <tbody>
              {NETA_SECTIONS.map(section => (
                <tr key={section.id}>
                  <td>{section.id}</td>
                  <td style={{ textAlign: 'left', fontSize: '0.85rem' }}>{section.description}</td>
                  <td>
                    <select
                      value={formData.netaResults[section.id] || 'Select One'}
                      onChange={e => setField(`netaResults.${section.id}`, e.target.value)}
                      disabled={!isEditing}
                      className="report-input"
                    >
                      {INSPECTION_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Bus/Pole Resistance */}
      <section className="report-section">
        <div className="section-divider"></div>
        <h2 className="section-title">Bus/Pole Resistance</h2>
        <div style={{ marginBottom: 8 }}>
          <label style={{ marginRight: 8 }}>Units:</label>
          <select value={formData.contactResistanceUnit} onChange={e => setField('contactResistanceUnit', e.target.value)} disabled={!isEditing} className="report-input" style={{ width: 100 }}>
            {CONTACT_RESISTANCE_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
        <div className="table-container">
          <table className="report-table">
            <thead>
              <tr>
                <th>Phase 1</th>
                <th>Phase 2</th>
                <th>Phase 3</th>
                <th>Neutral</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><input value={formData.busResistance.p1} onChange={e => setField('busResistance.p1', e.target.value)} readOnly={!isEditing} className="report-input" /></td>
                <td><input value={formData.busResistance.p2} onChange={e => setField('busResistance.p2', e.target.value)} readOnly={!isEditing} className="report-input" /></td>
                <td><input value={formData.busResistance.p3} onChange={e => setField('busResistance.p3', e.target.value)} readOnly={!isEditing} className="report-input" /></td>
                <td><input value={formData.busResistance.neutral} onChange={e => setField('busResistance.neutral', e.target.value)} readOnly={!isEditing} className="report-input" /></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Insulation Resistance */}
      <section className="report-section">
        <div className="section-divider"></div>
        <h2 className="section-title">Insulation Resistance</h2>
        <div style={{ marginBottom: 8, display: 'flex', gap: 16 }}>
          <div>
            <label style={{ marginRight: 8 }}>Test Voltage:</label>
            <select value={formData.testVoltage} onChange={e => setField('testVoltage', e.target.value)} disabled={!isEditing} className="report-input" style={{ width: 100 }}>
              {INSULATION_TEST_VOLTAGES.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
          <div>
            <label style={{ marginRight: 8 }}>Units:</label>
            <select value={formData.insulationResistanceUnit} onChange={e => setField('insulationResistanceUnit', e.target.value)} disabled={!isEditing} className="report-input" style={{ width: 100 }}>
              {INSULATION_RESISTANCE_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
        </div>
        <div className="table-container">
          <table className="report-table">
            <thead>
              <tr>
                <th>Test</th>
                <th>Measured ({formData.insulationResistanceUnit})</th>
                <th>Corrected ({formData.insulationResistanceUnit})</th>
              </tr>
            </thead>
            <tbody>
              {IR_KEYS.map(key => (
                <tr key={key}>
                  <td>{key}</td>
                  <td><input value={formData.insulationResistance[key]} onChange={e => setField(`insulationResistance.${key}`, e.target.value)} readOnly={!isEditing} className="report-input" /></td>
                  <td><input value={formData.correctedInsulationResistance[key]} readOnly className="report-input readonly calculated" /></td>
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
        <div className="table-container">
          <table className="report-table">
            <thead>
              <tr><th>Equipment</th><th>Name</th><th>Serial Number</th><th>AMP ID</th></tr>
            </thead>
            <tbody>
              <tr>
                <td>Megohmmeter</td>
                <td><input value={formData.megohmmeter} onChange={e => setField('megohmmeter', e.target.value)} readOnly={!isEditing} className="report-input" /></td>
                <td><input value={formData.megohmSerial} onChange={e => setField('megohmSerial', e.target.value)} readOnly={!isEditing} className="report-input" /></td>
                <td><input value={formData.megAmpId} onChange={e => setField('megAmpId', e.target.value)} readOnly={!isEditing} className="report-input" /></td>
              </tr>
              <tr>
                <td>Low Resistance Ohmmeter</td>
                <td><input value={formData.lowResistanceOhmmeter} onChange={e => setField('lowResistanceOhmmeter', e.target.value)} readOnly={!isEditing} className="report-input" /></td>
                <td><input value={formData.lowResistanceSerial} onChange={e => setField('lowResistanceSerial', e.target.value)} readOnly={!isEditing} className="report-input" /></td>
                <td><input value={formData.lowResistanceAmpId} onChange={e => setField('lowResistanceAmpId', e.target.value)} readOnly={!isEditing} className="report-input" /></td>
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
          value={formData.comments}
          onChange={e => setField('comments', e.target.value)}
          readOnly={!isEditing}
          className="report-input"
          rows={4}
          style={{ width: '100%' }}
        />
      </section>
    </div>
  );
};

export default MetalEnclosedBuswayReport;

