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
const INSULATION_UNITS = ['GΩ', 'MΩ', 'kΩ'];
const CONTINUITY_UNITS = ['Ω', 'mΩ', 'μΩ'];
const CURRENT_UNITS = ['mA', 'µA'];
const TEST_VOLTAGES = ['500V', '1000V', '2500V', '5000V', '10000V'];

interface FormData {
  customerName: string;
  siteAddress: string;
  jobNumber: string;
  identifier: string;
  testedBy: string;
  testDate: string;
  location: string;
  equipmentLocation: string;
  temperature: { fahrenheit: number; celsius: number; humidity: number; tcf: number; };
  status: 'PASS' | 'FAIL';
  cableInfo: {
    description: string; size: string; length: string; voltageRating: string;
    operatingVoltage: string; insulation: string; yearInstalled: string;
    testedFrom: string; testedTo: string; manufacturer: string;
    insulationThickness: string; conductorMaterial: string;
  };
  terminationData: {
    terminationData: string; ratedVoltage: string;
    terminationData2: string; ratedVoltage2: string;
  };
  visualInspection: {
    compareData: string; inspectDamage: string; useOhmmeter: string;
    inspectConnectors: string; inspectGrounding: string; verifyBends: string;
    inspectCurrentTransformers: string; inspectIdentification: string; inspectJacket: string;
  };
  shieldContinuity: { phaseA: string; phaseB: string; phaseC: string; unit: string; };
  insulationTest: {
    testVoltage: string; unit: string;
    preTest: { ag: string; bg: string; cg: string; };
    postTest: { ag: string; bg: string; cg: string; };
    preTestCorrected: { ag: string; bg: string; cg: string; };
    postTestCorrected: { ag: string; bg: string; cg: string; };
  };
  withstandTest: {
    readings: Array<{
      timeMinutes: string; kVAC: string;
      phaseA: { mA: string; nF: string; currentUnit: string; };
      phaseB: { mA: string; nF: string; currentUnit: string; };
      phaseC: { mA: string; nF: string; currentUnit: string; };
    }>;
  };
  equipment: {
    ohmmeter: string; ohmSerialNumber: string; ohmmeterAmpId: string;
    megohmmeter: string; megohmSerialNumber: string; megohmmeterAmpId: string;
    vlfHipot: string; vlfSerialNumber: string; vlfAmpId: string;
  };
  comments: string;
}

const VISUAL_INSPECTION_ITEMS = [
  { id: 'compareData', neta: '7.3.3.A.1', description: 'Compare cable nameplate data with drawings and specifications.' },
  { id: 'inspectDamage', neta: '7.3.3.A.2', description: 'Inspect exposed sections of cables for physical damage and deterioration.' },
  { id: 'useOhmmeter', neta: '7.3.3.A.3.1', description: 'Use of a low-resistance ohmmeter in accordance with Section 7.3.3.B.1.' },
  { id: 'inspectConnectors', neta: '7.3.3.A.4', description: 'Inspect bolted electrical connections for high resistance.' },
  { id: 'inspectGrounding', neta: '7.3.3.A.5', description: 'Inspect for proper cable support, mutual heating concerns, and grounding.' },
  { id: 'verifyBends', neta: '7.3.3.A.6', description: 'Verify that the cable bending radius is within manufacturer\'s specifications.' },
  { id: 'inspectCurrentTransformers', neta: '7.3.3.A.8', description: 'Inspect current transformers for proper ratio, burden, and grounding.' },
  { id: 'inspectIdentification', neta: '7.3.3.A.9', description: 'Verify cable identification and phase rotation.' },
  { id: 'inspectJacket', neta: '7.3.3.A.10', description: 'Inspect cable jacket for evidence of deterioration.' },
];

const createDefaultFormData = (): FormData => ({
  customerName: '', siteAddress: '', jobNumber: '', identifier: '',
  testedBy: '', testDate: new Date().toISOString().split('T')[0],
  location: '', equipmentLocation: '',
  temperature: { fahrenheit: 68, celsius: 20, humidity: 0, tcf: 1 },
  status: 'PASS',
  cableInfo: {
    description: '', size: '', length: '', voltageRating: '', operatingVoltage: '',
    insulation: '', yearInstalled: '', testedFrom: '', testedTo: '',
    manufacturer: '', insulationThickness: '', conductorMaterial: ''
  },
  terminationData: { terminationData: '', ratedVoltage: '', terminationData2: '', ratedVoltage2: '' },
  visualInspection: {
    compareData: 'Select One', inspectDamage: 'Select One', useOhmmeter: 'Select One',
    inspectConnectors: 'Select One', inspectGrounding: 'Select One', verifyBends: 'Select One',
    inspectCurrentTransformers: 'Select One', inspectIdentification: 'Select One', inspectJacket: 'Select One'
  },
  shieldContinuity: { phaseA: '', phaseB: '', phaseC: '', unit: 'Ω' },
  insulationTest: {
    testVoltage: '1000V', unit: 'MΩ',
    preTest: { ag: '', bg: '', cg: '' },
    postTest: { ag: '', bg: '', cg: '' },
    preTestCorrected: { ag: '', bg: '', cg: '' },
    postTestCorrected: { ag: '', bg: '', cg: '' }
  },
  withstandTest: {
    readings: [
      { timeMinutes: '0', kVAC: '', phaseA: { mA: '', nF: '', currentUnit: 'mA' }, phaseB: { mA: '', nF: '', currentUnit: 'mA' }, phaseC: { mA: '', nF: '', currentUnit: 'mA' } },
      { timeMinutes: '15', kVAC: '', phaseA: { mA: '', nF: '', currentUnit: 'mA' }, phaseB: { mA: '', nF: '', currentUnit: 'mA' }, phaseC: { mA: '', nF: '', currentUnit: 'mA' } },
      { timeMinutes: '30', kVAC: '', phaseA: { mA: '', nF: '', currentUnit: 'mA' }, phaseB: { mA: '', nF: '', currentUnit: 'mA' }, phaseC: { mA: '', nF: '', currentUnit: 'mA' } },
      { timeMinutes: '45', kVAC: '', phaseA: { mA: '', nF: '', currentUnit: 'mA' }, phaseB: { mA: '', nF: '', currentUnit: 'mA' }, phaseC: { mA: '', nF: '', currentUnit: 'mA' } },
      { timeMinutes: '60', kVAC: '', phaseA: { mA: '', nF: '', currentUnit: 'mA' }, phaseB: { mA: '', nF: '', currentUnit: 'mA' }, phaseC: { mA: '', nF: '', currentUnit: 'mA' } },
    ]
  },
  equipment: {
    ohmmeter: '', ohmSerialNumber: '', ohmmeterAmpId: '',
    megohmmeter: '', megohmSerialNumber: '', megohmmeterAmpId: '',
    vlfHipot: '', vlfSerialNumber: '', vlfAmpId: ''
  },
  comments: ''
});

interface MediumVoltageVLFReportProps {
  reportData?: any;
  isEditing?: boolean;
  onSave?: (data: any) => Promise<void>;
}

const MediumVoltageVLFReport: React.FC<MediumVoltageVLFReportProps> = ({
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
          customerName: job.company_name || job.customer_name || '',
          siteAddress: job.customer_address || job.site_address || '',
          jobNumber: job.job_number || ''
        }));
      }
    } catch (error) {
      console.error('Error loading job info:', error);
    }
  };

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
        } else if (Array.isArray(source[key])) {
          output[key] = source[key];
        } else if (source[key] !== undefined && source[key] !== null) {
          output[key] = source[key];
        }
      });
    }
    return output;
  };

  const isObject = (item: any): boolean => item && typeof item === 'object' && !Array.isArray(item);

  // Load report data
  useEffect(() => {
    if (reportData) {
      const data = typeof reportData === 'string' ? JSON.parse(reportData) : reportData;
      setFormData(prev => deepMerge(prev, data));
    }
    loadJobInfo();
  }, [reportData, jobId]);

  // Handle temperature changes
  const handleTemperatureChange = (tempF: number) => {
    const celsius = Math.round((tempF - 32) * 5 / 9);
    const tcf = getTCF(tempF);
    setFormData(prev => ({ ...prev, temperature: { ...prev.temperature, fahrenheit: tempF, celsius, tcf } }));
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

  // Calculate corrected insulation values
  const calculateCorrected = (value: string): string => {
    if (!value) return '';
    const num = parseFloat(value);
    if (isNaN(num)) return '';
    return (num * formData.temperature.tcf).toFixed(2);
  };

  // Auto-calculate temperature corrected values
  useEffect(() => {
    const newFormData = JSON.parse(JSON.stringify(formData));
    ['ag', 'bg', 'cg'].forEach(phase => {
      newFormData.insulationTest.preTestCorrected[phase] = calculateCorrected(formData.insulationTest.preTest[phase as keyof typeof formData.insulationTest.preTest]);
      newFormData.insulationTest.postTestCorrected[phase] = calculateCorrected(formData.insulationTest.postTest[phase as keyof typeof formData.insulationTest.postTest]);
    });
    if (JSON.stringify(newFormData.insulationTest) !== JSON.stringify(formData.insulationTest)) {
      setFormData(newFormData);
    }
  }, [formData.temperature.tcf, formData.insulationTest.preTest, formData.insulationTest.postTest]);

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
            [jobId, 'medium-voltage-vlf', JSON.stringify(formData)]
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
          <h1 className="report-title">Medium Voltage VLF Cable Test Report</h1>
          <p className="report-subtitle">NETA - ATS 7.3.3</p>
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
          <div className="form-field"><label>Customer:</label><input value={formData.customerName} readOnly className="report-input readonly" /></div>
          <div className="form-field"><label>Job #:</label><input value={formData.jobNumber} readOnly className="report-input readonly" /></div>
          <div className="form-field"><label>Site Address:</label><input value={formData.siteAddress} readOnly className="report-input readonly" /></div>
          <div className="form-field"><label>Tested By:</label><input value={formData.testedBy} onChange={e => setField('testedBy', e.target.value)} readOnly={!isEditing} className="report-input" /></div>
          <div className="form-field"><label>Identifier:</label><input value={formData.identifier} onChange={e => setField('identifier', e.target.value)} readOnly={!isEditing} className="report-input" /></div>
          <div className="form-field"><label>Test Date:</label><input type="date" value={formData.testDate} onChange={e => setField('testDate', e.target.value)} readOnly={!isEditing} className="report-input" /></div>
          <div className="form-field"><label>Location:</label><input value={formData.location} onChange={e => setField('location', e.target.value)} readOnly={!isEditing} className="report-input" /></div>
          <div className="form-field"><label>Equipment Location:</label><input value={formData.equipmentLocation} onChange={e => setField('equipmentLocation', e.target.value)} readOnly={!isEditing} className="report-input" /></div>
          <div className="form-field" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <label>Temp:</label>
            <input type="number" value={formData.temperature.fahrenheit} onChange={e => handleTemperatureChange(Number(e.target.value))} readOnly={!isEditing} className="report-input" style={{ width: 70 }} />
            <span>°F</span>
            <input type="number" value={formData.temperature.celsius} readOnly className="report-input readonly" style={{ width: 70 }} />
            <span>°C</span>
            <span style={{ marginLeft: 8 }}>TCF:</span>
            <input type="number" value={formData.temperature.tcf.toFixed(3)} readOnly className="report-input readonly" style={{ width: 70 }} />
          </div>
          <div className="form-field" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <label>Humidity:</label>
            <input type="number" value={formData.temperature.humidity || ''} onChange={e => setField('temperature.humidity', Number(e.target.value))} readOnly={!isEditing} className="report-input" style={{ width: 70 }} />
            <span>%</span>
          </div>
        </div>
      </section>

      {/* Cable Information */}
      <section className="report-section">
        <div className="section-divider"></div>
        <h2 className="section-title">Cable Information</h2>
        <div className="form-grid">
          <div className="form-field"><label>Description:</label><input value={formData.cableInfo.description} onChange={e => setField('cableInfo.description', e.target.value)} readOnly={!isEditing} className="report-input" /></div>
          <div className="form-field"><label>Manufacturer:</label><input value={formData.cableInfo.manufacturer} onChange={e => setField('cableInfo.manufacturer', e.target.value)} readOnly={!isEditing} className="report-input" /></div>
          <div className="form-field"><label>Size:</label><input value={formData.cableInfo.size} onChange={e => setField('cableInfo.size', e.target.value)} readOnly={!isEditing} className="report-input" /></div>
          <div className="form-field"><label>Length:</label><input value={formData.cableInfo.length} onChange={e => setField('cableInfo.length', e.target.value)} readOnly={!isEditing} className="report-input" /></div>
          <div className="form-field"><label>Voltage Rating:</label><input value={formData.cableInfo.voltageRating} onChange={e => setField('cableInfo.voltageRating', e.target.value)} readOnly={!isEditing} className="report-input" /></div>
          <div className="form-field"><label>Operating Voltage:</label><input value={formData.cableInfo.operatingVoltage} onChange={e => setField('cableInfo.operatingVoltage', e.target.value)} readOnly={!isEditing} className="report-input" /></div>
          <div className="form-field"><label>Insulation:</label><input value={formData.cableInfo.insulation} onChange={e => setField('cableInfo.insulation', e.target.value)} readOnly={!isEditing} className="report-input" /></div>
          <div className="form-field"><label>Conductor Material:</label><input value={formData.cableInfo.conductorMaterial} onChange={e => setField('cableInfo.conductorMaterial', e.target.value)} readOnly={!isEditing} className="report-input" /></div>
          <div className="form-field"><label>Year Installed:</label><input value={formData.cableInfo.yearInstalled} onChange={e => setField('cableInfo.yearInstalled', e.target.value)} readOnly={!isEditing} className="report-input" /></div>
          <div className="form-field"><label>Insulation Thickness:</label><input value={formData.cableInfo.insulationThickness} onChange={e => setField('cableInfo.insulationThickness', e.target.value)} readOnly={!isEditing} className="report-input" /></div>
          <div className="form-field"><label>Tested From:</label><input value={formData.cableInfo.testedFrom} onChange={e => setField('cableInfo.testedFrom', e.target.value)} readOnly={!isEditing} className="report-input" /></div>
          <div className="form-field"><label>Tested To:</label><input value={formData.cableInfo.testedTo} onChange={e => setField('cableInfo.testedTo', e.target.value)} readOnly={!isEditing} className="report-input" /></div>
        </div>
      </section>

      {/* Termination Data */}
      <section className="report-section">
        <div className="section-divider"></div>
        <h2 className="section-title">Termination Data</h2>
        <div className="form-grid">
          <div className="form-field"><label>Termination (From):</label><input value={formData.terminationData.terminationData} onChange={e => setField('terminationData.terminationData', e.target.value)} readOnly={!isEditing} className="report-input" /></div>
          <div className="form-field"><label>Rated Voltage:</label><input value={formData.terminationData.ratedVoltage} onChange={e => setField('terminationData.ratedVoltage', e.target.value)} readOnly={!isEditing} className="report-input" /></div>
          <div className="form-field"><label>Termination (To):</label><input value={formData.terminationData.terminationData2} onChange={e => setField('terminationData.terminationData2', e.target.value)} readOnly={!isEditing} className="report-input" /></div>
          <div className="form-field"><label>Rated Voltage:</label><input value={formData.terminationData.ratedVoltage2} onChange={e => setField('terminationData.ratedVoltage2', e.target.value)} readOnly={!isEditing} className="report-input" /></div>
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
              {VISUAL_INSPECTION_ITEMS.map(item => (
                <tr key={item.id}>
                  <td>{item.neta}</td>
                  <td style={{ textAlign: 'left', fontSize: '0.85rem' }}>{item.description}</td>
                  <td>
                    <select
                      value={formData.visualInspection[item.id as keyof typeof formData.visualInspection] || 'Select One'}
                      onChange={e => setField(`visualInspection.${item.id}`, e.target.value)}
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

      {/* Shield Continuity */}
      <section className="report-section">
        <div className="section-divider"></div>
        <h2 className="section-title">Electrical Tests - Shield Continuity</h2>
        <div style={{ marginBottom: 8 }}>
          <label style={{ marginRight: 8 }}>Units:</label>
          <select value={formData.shieldContinuity.unit} onChange={e => setField('shieldContinuity.unit', e.target.value)} disabled={!isEditing} className="report-input" style={{ width: 100 }}>
            {CONTINUITY_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
        <div className="table-container">
          <table className="report-table">
            <thead>
              <tr><th>Phase A</th><th>Phase B</th><th>Phase C</th></tr>
            </thead>
            <tbody>
              <tr>
                <td><input value={formData.shieldContinuity.phaseA} onChange={e => setField('shieldContinuity.phaseA', e.target.value)} readOnly={!isEditing} className="report-input" /></td>
                <td><input value={formData.shieldContinuity.phaseB} onChange={e => setField('shieldContinuity.phaseB', e.target.value)} readOnly={!isEditing} className="report-input" /></td>
                <td><input value={formData.shieldContinuity.phaseC} onChange={e => setField('shieldContinuity.phaseC', e.target.value)} readOnly={!isEditing} className="report-input" /></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Insulation Resistance */}
      <section className="report-section">
        <div className="section-divider"></div>
        <h2 className="section-title">Electrical Tests - Insulation Resistance</h2>
        <div style={{ marginBottom: 8, display: 'flex', gap: 16 }}>
          <div>
            <label style={{ marginRight: 8 }}>Test Voltage:</label>
            <select value={formData.insulationTest.testVoltage} onChange={e => setField('insulationTest.testVoltage', e.target.value)} disabled={!isEditing} className="report-input" style={{ width: 100 }}>
              {TEST_VOLTAGES.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
          <div>
            <label style={{ marginRight: 8 }}>Units:</label>
            <select value={formData.insulationTest.unit} onChange={e => setField('insulationTest.unit', e.target.value)} disabled={!isEditing} className="report-input" style={{ width: 100 }}>
              {INSULATION_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
        </div>
        <div className="table-container">
          <table className="report-table">
            <thead>
              <tr>
                <th></th>
                <th colSpan={3}>Pre-Test ({formData.insulationTest.unit})</th>
                <th colSpan={3}>Pre-Test Corrected ({formData.insulationTest.unit})</th>
              </tr>
              <tr>
                <th>Phase</th>
                <th>A-G</th><th>B-G</th><th>C-G</th>
                <th>A-G</th><th>B-G</th><th>C-G</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Measured</td>
                <td><input value={formData.insulationTest.preTest.ag} onChange={e => setField('insulationTest.preTest.ag', e.target.value)} readOnly={!isEditing} className="report-input" /></td>
                <td><input value={formData.insulationTest.preTest.bg} onChange={e => setField('insulationTest.preTest.bg', e.target.value)} readOnly={!isEditing} className="report-input" /></td>
                <td><input value={formData.insulationTest.preTest.cg} onChange={e => setField('insulationTest.preTest.cg', e.target.value)} readOnly={!isEditing} className="report-input" /></td>
                <td><input value={formData.insulationTest.preTestCorrected.ag} readOnly className="report-input readonly calculated" /></td>
                <td><input value={formData.insulationTest.preTestCorrected.bg} readOnly className="report-input readonly calculated" /></td>
                <td><input value={formData.insulationTest.preTestCorrected.cg} readOnly className="report-input readonly calculated" /></td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="table-container" style={{ marginTop: 16 }}>
          <table className="report-table">
            <thead>
              <tr>
                <th></th>
                <th colSpan={3}>Post-Test ({formData.insulationTest.unit})</th>
                <th colSpan={3}>Post-Test Corrected ({formData.insulationTest.unit})</th>
              </tr>
              <tr>
                <th>Phase</th>
                <th>A-G</th><th>B-G</th><th>C-G</th>
                <th>A-G</th><th>B-G</th><th>C-G</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Measured</td>
                <td><input value={formData.insulationTest.postTest.ag} onChange={e => setField('insulationTest.postTest.ag', e.target.value)} readOnly={!isEditing} className="report-input" /></td>
                <td><input value={formData.insulationTest.postTest.bg} onChange={e => setField('insulationTest.postTest.bg', e.target.value)} readOnly={!isEditing} className="report-input" /></td>
                <td><input value={formData.insulationTest.postTest.cg} onChange={e => setField('insulationTest.postTest.cg', e.target.value)} readOnly={!isEditing} className="report-input" /></td>
                <td><input value={formData.insulationTest.postTestCorrected.ag} readOnly className="report-input readonly calculated" /></td>
                <td><input value={formData.insulationTest.postTestCorrected.bg} readOnly className="report-input readonly calculated" /></td>
                <td><input value={formData.insulationTest.postTestCorrected.cg} readOnly className="report-input readonly calculated" /></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* VLF Withstand Test */}
      <section className="report-section">
        <div className="section-divider"></div>
        <h2 className="section-title">Electrical Tests - VLF Withstand Test</h2>
        <div className="table-container" style={{ overflowX: 'auto' }}>
          <table className="report-table" style={{ minWidth: 900 }}>
            <thead>
              <tr>
                <th rowSpan={2}>Time (min)</th>
                <th rowSpan={2}>kVAC</th>
                <th colSpan={2}>Phase A</th>
                <th colSpan={2}>Phase B</th>
                <th colSpan={2}>Phase C</th>
              </tr>
              <tr>
                <th>mA</th><th>nF</th>
                <th>mA</th><th>nF</th>
                <th>mA</th><th>nF</th>
              </tr>
            </thead>
            <tbody>
              {formData.withstandTest.readings.map((reading, index) => (
                <tr key={index}>
                  <td>{reading.timeMinutes}</td>
                  <td><input value={reading.kVAC} onChange={e => { const arr = [...formData.withstandTest.readings]; arr[index].kVAC = e.target.value; setField('withstandTest.readings', arr); }} readOnly={!isEditing} className="report-input" /></td>
                  <td><input value={reading.phaseA.mA} onChange={e => { const arr = [...formData.withstandTest.readings]; arr[index].phaseA.mA = e.target.value; setField('withstandTest.readings', arr); }} readOnly={!isEditing} className="report-input" /></td>
                  <td><input value={reading.phaseA.nF} onChange={e => { const arr = [...formData.withstandTest.readings]; arr[index].phaseA.nF = e.target.value; setField('withstandTest.readings', arr); }} readOnly={!isEditing} className="report-input" /></td>
                  <td><input value={reading.phaseB.mA} onChange={e => { const arr = [...formData.withstandTest.readings]; arr[index].phaseB.mA = e.target.value; setField('withstandTest.readings', arr); }} readOnly={!isEditing} className="report-input" /></td>
                  <td><input value={reading.phaseB.nF} onChange={e => { const arr = [...formData.withstandTest.readings]; arr[index].phaseB.nF = e.target.value; setField('withstandTest.readings', arr); }} readOnly={!isEditing} className="report-input" /></td>
                  <td><input value={reading.phaseC.mA} onChange={e => { const arr = [...formData.withstandTest.readings]; arr[index].phaseC.mA = e.target.value; setField('withstandTest.readings', arr); }} readOnly={!isEditing} className="report-input" /></td>
                  <td><input value={reading.phaseC.nF} onChange={e => { const arr = [...formData.withstandTest.readings]; arr[index].phaseC.nF = e.target.value; setField('withstandTest.readings', arr); }} readOnly={!isEditing} className="report-input" /></td>
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
                <td>Ohmmeter</td>
                <td><input value={formData.equipment.ohmmeter} onChange={e => setField('equipment.ohmmeter', e.target.value)} readOnly={!isEditing} className="report-input" /></td>
                <td><input value={formData.equipment.ohmSerialNumber} onChange={e => setField('equipment.ohmSerialNumber', e.target.value)} readOnly={!isEditing} className="report-input" /></td>
                <td><input value={formData.equipment.ohmmeterAmpId} onChange={e => setField('equipment.ohmmeterAmpId', e.target.value)} readOnly={!isEditing} className="report-input" /></td>
              </tr>
              <tr>
                <td>Megohmmeter</td>
                <td><input value={formData.equipment.megohmmeter} onChange={e => setField('equipment.megohmmeter', e.target.value)} readOnly={!isEditing} className="report-input" /></td>
                <td><input value={formData.equipment.megohmSerialNumber} onChange={e => setField('equipment.megohmSerialNumber', e.target.value)} readOnly={!isEditing} className="report-input" /></td>
                <td><input value={formData.equipment.megohmmeterAmpId} onChange={e => setField('equipment.megohmmeterAmpId', e.target.value)} readOnly={!isEditing} className="report-input" /></td>
              </tr>
              <tr>
                <td>VLF Hi-Pot</td>
                <td><input value={formData.equipment.vlfHipot} onChange={e => setField('equipment.vlfHipot', e.target.value)} readOnly={!isEditing} className="report-input" /></td>
                <td><input value={formData.equipment.vlfSerialNumber} onChange={e => setField('equipment.vlfSerialNumber', e.target.value)} readOnly={!isEditing} className="report-input" /></td>
                <td><input value={formData.equipment.vlfAmpId} onChange={e => setField('equipment.vlfAmpId', e.target.value)} readOnly={!isEditing} className="report-input" /></td>
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

export default MediumVoltageVLFReport;


