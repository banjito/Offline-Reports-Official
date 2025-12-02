import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './ReportStyles.css';

// TCF lookup table
const tcfTable: { [key: string]: number } = {
  '-24': 0.054, '-23': 0.068, '-22': 0.082, '-21': 0.096, '-20': 0.11,
  '-19': 0.124, '-18': 0.138, '-17': 0.152, '-16': 0.166, '-15': 0.18,
  '-14': 0.194, '-13': 0.208, '-12': 0.222, '-11': 0.236, '-10': 0.25,
  '-9': 0.264, '-8': 0.278, '-7': 0.292, '-6': 0.306, '-5': 0.32,
  '-4': 0.336, '-3': 0.352, '-2': 0.368, '-1': 0.384, '0': 0.4,
  '1': 0.42, '2': 0.44, '3': 0.46, '4': 0.48, '5': 0.5,
  '6': 0.526, '7': 0.552, '8': 0.578, '9': 0.604, '10': 0.63,
  '11': 0.666, '12': 0.702, '13': 0.738, '14': 0.774, '15': 0.81,
  '16': 0.848, '17': 0.886, '18': 0.924, '19': 0.962, '20': 1,
  '21': 1.05, '22': 1.1, '23': 1.15, '24': 1.2, '25': 1.25,
  '26': 1.316, '27': 1.382, '28': 1.448, '29': 1.514, '30': 1.58,
  '31': 1.664, '32': 1.748, '33': 1.832, '34': 1.872, '35': 2,
  '36': 2.1, '37': 2.2, '38': 2.3, '39': 2.4, '40': 2.5,
};

const getTCF = (celsius: number): number => {
  const roundedCelsius = Math.round(celsius);
  const key = roundedCelsius.toString();
  return tcfTable[key] !== undefined ? tcfTable[key] : 1;
};

// Dropdown options
const visualInspectionResultOptions = [
  "Select One", "Satisfactory", "Unsatisfactory", "Cleaned", "See Comments", "Not Applicable"
];
const insulationResistanceUnitOptions = ["kΩ", "MΩ", "GΩ"];
const contactResistanceUnitOptions = ["µΩ", "mΩ", "Ω"];
const insulationTestVoltageOptions = ["250V", "500V", "1000V", "2500V", "5000V"];

interface FormData {
  customerName: string;
  customerAddress: string;
  userName: string;
  date: string;
  identifier: string;
  jobNumber: string;
  technicians: string;
  temperature: { fahrenheit: number; celsius: number; tcf: number; humidity: number; };
  substation: string;
  eqptLocation: string;
  status: 'PASS' | 'FAIL';
  nameplateData: {
    manufacturer: string; catalogNumber: string; serialNumber: string; type: string;
    manufacturingDate: string; icRating: string; ratedVoltageKV: string;
    operatingVoltageKV: string; ampacity: string; impulseRatingBIL: string;
  };
  visualMechanicalInspection: {
    items: Array<{ netaSection: string; description: string; result: string; }>;
    eGap: { unitMeasurement: string; tolerance: string; aPhase: string; bPhase: string; cPhase: string; };
  };
  fuseData: {
    manufacturer: string; catalogNumber: string; class: string;
    ratedVoltageKV: string; ampacity: string; icRatingKA: string;
  };
  electricalTests: {
    contactResistanceAsFound: Array<{ test: string; p1: string; p2: string; p3: string; units: string; }>;
    contactResistanceAsLeft: Array<{ test: string; p1: string; p2: string; p3: string; units: string; }>;
    insulationResistance: {
      testVoltage: string;
      readings: Array<{ test: string; state: string; p1_mq: string; p2_mq: string; p3_mq: string; }>;
    };
    temperatureCorrected: {
      testVoltage: string;
      readings: Array<{ test: string; state: string; p1_mq: string; p2_mq: string; p3_mq: string; }>;
    };
  };
  contactorData: {
    manufacturer: string; catalogNumber: string; serialNumber: string; type: string;
    manufacturingDate: string; icRatingKA: string; ratedVoltageKV: string;
    operatingVoltageKV: string; ampacity: string; controlVoltageV: string;
  };
  electricalTestContactor: {
    insulationResistance: {
      testVoltage: string;
      readings: Array<{ test: string; state: string; p1_mq: string; p2_mq: string; p3_mq: string; }>;
    };
    temperatureCorrected: {
      testVoltage: string;
      readings: Array<{ test: string; state: string; p1_mq: string; p2_mq: string; p3_mq: string; }>;
    };
    vacuumBottleIntegrity: { testVoltage: string; testDuration: string; p1: string; p2: string; p3: string; units: string; };
  };
  startingReactorData: {
    manufacturer: string; catalogNumber: string; serialNumber: string;
    ratedCurrentA: string; ratedVoltageKV: string; operatingVoltageKV: string;
  };
  electricalTestReactor: {
    insulationResistance: { testVoltage: string; windingToGround: { aPhase: string; bPhase: string; cPhase: string; units: string; }; };
    temperatureCorrected: { testVoltage: string; windingToGround: { aPhase: string; bPhase: string; cPhase: string; units: string; }; };
    contactResistanceAsFound: { aPhase: string; bPhase: string; cPhase: string; units: string; };
    contactResistanceAsLeft: { aPhase: string; bPhase: string; cPhase: string; units: string; };
  };
  testEquipmentUsed: {
    megohmmeter: { name: string; serialNumber: string; ampId: string; };
    lowResistanceOhmmeter: { name: string; serialNumber: string; ampId: string; };
    hipot: { name: string; serialNumber: string; ampId: string; };
  };
  comments: string;
}

const initialVisualMechanicalItems = [
  { netaSection: '7.16.1.2.A.1', description: 'Inspect physical and mechanical condition.', result: 'Select One' },
  { netaSection: '7.16.1.2.A.2', description: 'Inspect anchorage, alignment, and grounding.', result: 'Select One' },
  { netaSection: '7.16.1.2.A.4', description: 'Clean the unit.', result: 'Select One' },
  { netaSection: '7.16.1.2.A.5.1', description: 'Use of a low-resistance ohmmeter in accordance with Section 7.16.1.2.B.1.', result: 'Select One' },
  { netaSection: '7.16.1.2.A.6', description: 'Test electrical and mechanical interlock systems for correct operation and sequencing.', result: 'Select One' },
  { netaSection: '7.16.1.2.A.7', description: 'Verify correct barrier and shutter installation and operation.', result: 'Select One' },
  { netaSection: '7.16.1.2.A.8', description: 'Exercise active components and confirm correct operation of indicating devices.', result: 'Select One' },
  { netaSection: '7.16.1.2.A.9', description: "Inspect contactors. 1. Verify mechanical operation. 2. Inspect and adjust contact gap, wipe, alignment, and pressure in accordance with manufacturer's published data.", result: 'Select One' },
  { netaSection: '7.16.1.2.A.10', description: 'Compare overload protection rating with motor nameplate to verify correct size.', result: 'Select One' },
  { netaSection: '7.16.1.2.A.11', description: 'Use appropriate lubrication on moving current-carrying parts and on moving and sliding surfaces.', result: 'Select One' },
];

const createDefaultFormData = (): FormData => ({
  customerName: '', customerAddress: '', userName: '',
  date: new Date().toISOString().split('T')[0], identifier: '', jobNumber: '', technicians: '',
  temperature: { fahrenheit: 68, celsius: 20, tcf: 1, humidity: 0 },
  substation: '', eqptLocation: '', status: 'PASS',
  nameplateData: {
    manufacturer: '', catalogNumber: '', serialNumber: '', type: '', manufacturingDate: '',
    icRating: '', ratedVoltageKV: '', operatingVoltageKV: '', ampacity: '', impulseRatingBIL: ''
  },
  visualMechanicalInspection: {
    items: JSON.parse(JSON.stringify(initialVisualMechanicalItems)),
    eGap: { unitMeasurement: '', tolerance: '', aPhase: '', bPhase: '', cPhase: '' }
  },
  fuseData: { manufacturer: '', catalogNumber: '', class: '', ratedVoltageKV: '', ampacity: '', icRatingKA: '' },
  electricalTests: {
    contactResistanceAsFound: [
      { test: 'Switch', p1: '', p2: '', p3: '', units: 'µΩ' },
      { test: 'Fuse', p1: '', p2: '', p3: '', units: 'µΩ' },
      { test: 'Switch + Fuse', p1: '', p2: '', p3: '', units: 'µΩ' },
    ],
    contactResistanceAsLeft: [
      { test: 'Switch', p1: '', p2: '', p3: '', units: 'µΩ' },
      { test: 'Fuse', p1: '', p2: '', p3: '', units: 'µΩ' },
      { test: 'Switch + Fuse', p1: '', p2: '', p3: '', units: 'µΩ' },
    ],
    insulationResistance: {
      testVoltage: '1000V',
      readings: [
        { test: 'Pole to Pole', state: 'Closed', p1_mq: '', p2_mq: '', p3_mq: '' },
        { test: 'Pole to Frame', state: 'Closed', p1_mq: '', p2_mq: '', p3_mq: '' },
        { test: 'Line to Load', state: 'Open', p1_mq: '', p2_mq: '', p3_mq: '' },
      ]
    },
    temperatureCorrected: {
      testVoltage: '1000V',
      readings: [
        { test: 'Pole to Pole', state: 'Closed', p1_mq: '', p2_mq: '', p3_mq: '' },
        { test: 'Pole to Frame', state: 'Closed', p1_mq: '', p2_mq: '', p3_mq: '' },
        { test: 'Line to Load', state: 'Open', p1_mq: '', p2_mq: '', p3_mq: '' },
      ]
    }
  },
  contactorData: {
    manufacturer: '', catalogNumber: '', serialNumber: '', type: '', manufacturingDate: '',
    icRatingKA: '', ratedVoltageKV: '', operatingVoltageKV: '', ampacity: '', controlVoltageV: ''
  },
  electricalTestContactor: {
    insulationResistance: {
      testVoltage: '1000V',
      readings: [
        { test: 'Pole to Pole', state: 'Closed', p1_mq: '', p2_mq: '', p3_mq: '' },
        { test: 'Pole to Frame', state: 'Closed', p1_mq: '', p2_mq: '', p3_mq: '' },
        { test: 'Line to Load', state: 'Open', p1_mq: '', p2_mq: '', p3_mq: '' },
      ]
    },
    temperatureCorrected: {
      testVoltage: '1000V',
      readings: [
        { test: 'Pole to Pole', state: 'Closed', p1_mq: '', p2_mq: '', p3_mq: '' },
        { test: 'Pole to Frame', state: 'Closed', p1_mq: '', p2_mq: '', p3_mq: '' },
        { test: 'Line to Load', state: 'Open', p1_mq: '', p2_mq: '', p3_mq: '' },
      ]
    },
    vacuumBottleIntegrity: { testVoltage: '', testDuration: '1 Min.', p1: '', p2: '', p3: '', units: '' }
  },
  startingReactorData: {
    manufacturer: '', catalogNumber: '', serialNumber: '',
    ratedCurrentA: '', ratedVoltageKV: '', operatingVoltageKV: ''
  },
  electricalTestReactor: {
    insulationResistance: { testVoltage: '1000V', windingToGround: { aPhase: '', bPhase: '', cPhase: '', units: 'MΩ' } },
    temperatureCorrected: { testVoltage: '1000V', windingToGround: { aPhase: '', bPhase: '', cPhase: '', units: 'MΩ' } },
    contactResistanceAsFound: { aPhase: '', bPhase: '', cPhase: '', units: 'µΩ' },
    contactResistanceAsLeft: { aPhase: '', bPhase: '', cPhase: '', units: 'µΩ' }
  },
  testEquipmentUsed: {
    megohmmeter: { name: '', serialNumber: '', ampId: '' },
    lowResistanceOhmmeter: { name: '', serialNumber: '', ampId: '' },
    hipot: { name: '', serialNumber: '', ampId: '' }
  },
  comments: ''
});

interface MediumVoltageMotorStarterMTSReportProps {
  reportData?: any;
  isEditing?: boolean;
  onSave?: (data: any) => Promise<void>;
}

const MediumVoltageMotorStarterMTSReport: React.FC<MediumVoltageMotorStarterMTSReportProps> = ({
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
          customerAddress: job.customer_address || job.site_address || '',
          jobNumber: job.job_number || ''
        }));
      }
    } catch (error) {
      console.error('Error loading job info:', error);
    }
  };

  // Load report data from props or database
  useEffect(() => {
    if (reportData) {
      const data = typeof reportData === 'string' ? JSON.parse(reportData) : reportData;
      setFormData(prev => deepMerge(prev, data));
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

  // Handle temperature changes
  const handleFahrenheitChange = (fahrenheit: number) => {
    const celsius = Math.round((fahrenheit - 32) * 5 / 9);
    const tcf = getTCF(celsius);
    setFormData(prev => ({ ...prev, temperature: { ...prev.temperature, fahrenheit, celsius, tcf } }));
  };

  const handleCelsiusChange = (celsius: number) => {
    const fahrenheit = Math.round(celsius * 9 / 5 + 32);
    const tcf = getTCF(celsius);
    setFormData(prev => ({ ...prev, temperature: { ...prev.temperature, fahrenheit, celsius, tcf } }));
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

  // Calculate corrected MOhm value
  const calculateCorrectedMOhm = (valueStr: string): string => {
    if (!valueStr || valueStr.match(/[><a-zA-Z]/)) return valueStr;
    const value = parseFloat(valueStr);
    if (isNaN(value)) return valueStr;
    return (value * formData.temperature.tcf).toFixed(2);
  };

  // Auto-calculate temperature corrected values
  useEffect(() => {
    const newFormData = JSON.parse(JSON.stringify(formData));
    
    // Electrical tests - insulation resistance
    newFormData.electricalTests.temperatureCorrected.readings.forEach((reading: any, index: number) => {
      const original = formData.electricalTests.insulationResistance.readings[index];
      reading.p1_mq = calculateCorrectedMOhm(original.p1_mq);
      reading.p2_mq = calculateCorrectedMOhm(original.p2_mq);
      reading.p3_mq = calculateCorrectedMOhm(original.p3_mq);
    });
    newFormData.electricalTests.temperatureCorrected.testVoltage = formData.electricalTests.insulationResistance.testVoltage;

    // Contactor - insulation resistance
    newFormData.electricalTestContactor.temperatureCorrected.readings.forEach((reading: any, index: number) => {
      const original = formData.electricalTestContactor.insulationResistance.readings[index];
      reading.p1_mq = calculateCorrectedMOhm(original.p1_mq);
      reading.p2_mq = calculateCorrectedMOhm(original.p2_mq);
      reading.p3_mq = calculateCorrectedMOhm(original.p3_mq);
    });
    newFormData.electricalTestContactor.temperatureCorrected.testVoltage = formData.electricalTestContactor.insulationResistance.testVoltage;

    // Reactor - insulation resistance
    const originalReactor = formData.electricalTestReactor.insulationResistance.windingToGround;
    newFormData.electricalTestReactor.temperatureCorrected.windingToGround.aPhase = calculateCorrectedMOhm(originalReactor.aPhase);
    newFormData.electricalTestReactor.temperatureCorrected.windingToGround.bPhase = calculateCorrectedMOhm(originalReactor.bPhase);
    newFormData.electricalTestReactor.temperatureCorrected.windingToGround.cPhase = calculateCorrectedMOhm(originalReactor.cPhase);
    newFormData.electricalTestReactor.temperatureCorrected.windingToGround.units = originalReactor.units;
    newFormData.electricalTestReactor.temperatureCorrected.testVoltage = formData.electricalTestReactor.insulationResistance.testVoltage;

    // Only update if changed
    if (JSON.stringify(newFormData) !== JSON.stringify(formData)) {
      setFormData(newFormData);
    }
  }, [formData.temperature.tcf, formData.electricalTests.insulationResistance, formData.electricalTestContactor.insulationResistance, formData.electricalTestReactor.insulationResistance]);

  // Save handler
  const handleSave = async () => {
    if (!jobId) return;
    setIsSaving(true);
    try {
      if (onSave) {
        await onSave(formData);
      } else {
        const reportPayload = {
          job_id: jobId,
          report_data: JSON.stringify(formData),
          report_type: '23-medium-voltage-motor-starter-mts-report',
          is_dirty: 1
        };

        if (reportId) {
          await (window as any).electronAPI.queryDatabase(
            `UPDATE reports SET report_data = ?, is_dirty = 1 WHERE id = ?`,
            [JSON.stringify(formData), reportId]
          );
        } else {
          await (window as any).electronAPI.queryDatabase(
            `INSERT INTO reports (job_id, report_type, report_data, is_dirty) VALUES (?, ?, ?, 1)`,
            [jobId, '23-medium-voltage-motor-starter-mts-report', JSON.stringify(formData)]
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
          <h1 className="report-title">23-Medium Voltage Motor Starter MTS Report</h1>
          <p className="report-subtitle">NETA - MTS 7.16.1.2</p>
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
          <div className="form-field">
            <label>Customer:</label>
            <input value={formData.customerName} readOnly className="report-input readonly" />
          </div>
          <div className="form-field">
            <label>Job #:</label>
            <input value={formData.jobNumber} readOnly className="report-input readonly" />
          </div>
          <div className="form-field">
            <label>Address:</label>
            <input value={formData.customerAddress} readOnly className="report-input readonly" />
          </div>
          <div className="form-field">
            <label>Technicians:</label>
            <input value={formData.technicians} onChange={e => setField('technicians', e.target.value)} readOnly={!isEditing} className="report-input" />
          </div>
          <div className="form-field">
            <label>User:</label>
            <input value={formData.userName} onChange={e => setField('userName', e.target.value)} readOnly={!isEditing} className="report-input" />
          </div>
          <div className="form-field">
            <label>Date:</label>
            <input type="date" value={formData.date} onChange={e => setField('date', e.target.value)} readOnly={!isEditing} className="report-input" />
          </div>
          <div className="form-field">
            <label>Identifier:</label>
            <input value={formData.identifier} onChange={e => setField('identifier', e.target.value)} readOnly={!isEditing} className="report-input" />
          </div>
          <div className="form-field">
            <label>Substation:</label>
            <input value={formData.substation} onChange={e => setField('substation', e.target.value)} readOnly={!isEditing} className="report-input" />
          </div>
          <div className="form-field">
            <label>Eqpt. Location:</label>
            <input value={formData.eqptLocation} onChange={e => setField('eqptLocation', e.target.value)} readOnly={!isEditing} className="report-input" />
          </div>
          <div className="form-field" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <label>Temp:</label>
            <input type="number" value={formData.temperature.fahrenheit} onChange={e => handleFahrenheitChange(Number(e.target.value))} readOnly={!isEditing} className="report-input" style={{ width: 70 }} />
            <span>°F</span>
            <input type="number" value={formData.temperature.celsius} onChange={e => handleCelsiusChange(Number(e.target.value))} readOnly={!isEditing} className="report-input" style={{ width: 70 }} />
            <span>°C</span>
            <span style={{ marginLeft: 8 }}>TCF:</span>
            <input type="number" value={formData.temperature.tcf} readOnly className="report-input readonly" style={{ width: 70 }} />
          </div>
          <div className="form-field" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <label>Humidity:</label>
            <input type="number" value={formData.temperature.humidity || ''} onChange={e => setField('temperature.humidity', Number(e.target.value))} readOnly={!isEditing} className="report-input" style={{ width: 70 }} />
            <span>%</span>
          </div>
        </div>
      </section>

      {/* Nameplate Data */}
      <section className="report-section">
        <div className="section-divider"></div>
        <h2 className="section-title">Nameplate Data</h2>
        <div className="form-grid">
          <div className="form-field"><label>Manufacturer:</label><input value={formData.nameplateData.manufacturer} onChange={e => setField('nameplateData.manufacturer', e.target.value)} readOnly={!isEditing} className="report-input" /></div>
          <div className="form-field"><label>I.C. Rating (kA):</label><input value={formData.nameplateData.icRating} onChange={e => setField('nameplateData.icRating', e.target.value)} readOnly={!isEditing} className="report-input" /></div>
          <div className="form-field"><label>Catalog Number:</label><input value={formData.nameplateData.catalogNumber} onChange={e => setField('nameplateData.catalogNumber', e.target.value)} readOnly={!isEditing} className="report-input" /></div>
          <div className="form-field"><label>Rated Voltage (kV):</label><input value={formData.nameplateData.ratedVoltageKV} onChange={e => setField('nameplateData.ratedVoltageKV', e.target.value)} readOnly={!isEditing} className="report-input" /></div>
          <div className="form-field"><label>Serial Number:</label><input value={formData.nameplateData.serialNumber} onChange={e => setField('nameplateData.serialNumber', e.target.value)} readOnly={!isEditing} className="report-input" /></div>
          <div className="form-field"><label>Operating Voltage (kV):</label><input value={formData.nameplateData.operatingVoltageKV} onChange={e => setField('nameplateData.operatingVoltageKV', e.target.value)} readOnly={!isEditing} className="report-input" /></div>
          <div className="form-field"><label>Type:</label><input value={formData.nameplateData.type} onChange={e => setField('nameplateData.type', e.target.value)} readOnly={!isEditing} className="report-input" /></div>
          <div className="form-field"><label>Ampacity:</label><input value={formData.nameplateData.ampacity} onChange={e => setField('nameplateData.ampacity', e.target.value)} readOnly={!isEditing} className="report-input" /></div>
          <div className="form-field"><label>Manufacturing Date:</label><input value={formData.nameplateData.manufacturingDate} onChange={e => setField('nameplateData.manufacturingDate', e.target.value)} readOnly={!isEditing} className="report-input" /></div>
          <div className="form-field"><label>Impulse Rating (BIL):</label><input value={formData.nameplateData.impulseRatingBIL} onChange={e => setField('nameplateData.impulseRatingBIL', e.target.value)} readOnly={!isEditing} className="report-input" /></div>
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
              {formData.visualMechanicalInspection.items.map((item, index) => (
                <tr key={item.netaSection}>
                  <td>{item.netaSection}</td>
                  <td style={{ textAlign: 'left', fontSize: '0.85rem' }}>{item.description}</td>
                  <td>
                    <select
                      value={item.result}
                      onChange={e => {
                        const newItems = [...formData.visualMechanicalInspection.items];
                        newItems[index].result = e.target.value;
                        setField('visualMechanicalInspection.items', newItems);
                      }}
                      disabled={!isEditing}
                      className="report-input"
                    >
                      {visualInspectionResultOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* E-Gap Table */}
        <h3 style={{ marginTop: 16, marginBottom: 8, fontWeight: 600 }}>E-Gap Measurement</h3>
        <div className="table-container">
          <table className="report-table">
            <thead>
              <tr>
                <th>Unit of Measurement</th>
                <th>Tolerance</th>
                <th>A Phase</th>
                <th>B Phase</th>
                <th>C Phase</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><input value={formData.visualMechanicalInspection.eGap.unitMeasurement} onChange={e => setField('visualMechanicalInspection.eGap.unitMeasurement', e.target.value)} readOnly={!isEditing} className="report-input" /></td>
                <td><input value={formData.visualMechanicalInspection.eGap.tolerance} onChange={e => setField('visualMechanicalInspection.eGap.tolerance', e.target.value)} readOnly={!isEditing} className="report-input" /></td>
                <td><input value={formData.visualMechanicalInspection.eGap.aPhase} onChange={e => setField('visualMechanicalInspection.eGap.aPhase', e.target.value)} readOnly={!isEditing} className="report-input" /></td>
                <td><input value={formData.visualMechanicalInspection.eGap.bPhase} onChange={e => setField('visualMechanicalInspection.eGap.bPhase', e.target.value)} readOnly={!isEditing} className="report-input" /></td>
                <td><input value={formData.visualMechanicalInspection.eGap.cPhase} onChange={e => setField('visualMechanicalInspection.eGap.cPhase', e.target.value)} readOnly={!isEditing} className="report-input" /></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Fuse Data */}
      <section className="report-section">
        <div className="section-divider"></div>
        <h2 className="section-title">Fuse Data</h2>
        <div className="form-grid">
          <div className="form-field"><label>Manufacturer:</label><input value={formData.fuseData.manufacturer} onChange={e => setField('fuseData.manufacturer', e.target.value)} readOnly={!isEditing} className="report-input" /></div>
          <div className="form-field"><label>Rated Voltage (kV):</label><input value={formData.fuseData.ratedVoltageKV} onChange={e => setField('fuseData.ratedVoltageKV', e.target.value)} readOnly={!isEditing} className="report-input" /></div>
          <div className="form-field"><label>Catalog Number:</label><input value={formData.fuseData.catalogNumber} onChange={e => setField('fuseData.catalogNumber', e.target.value)} readOnly={!isEditing} className="report-input" /></div>
          <div className="form-field"><label>Ampacity:</label><input value={formData.fuseData.ampacity} onChange={e => setField('fuseData.ampacity', e.target.value)} readOnly={!isEditing} className="report-input" /></div>
          <div className="form-field"><label>Class:</label><input value={formData.fuseData.class} onChange={e => setField('fuseData.class', e.target.value)} readOnly={!isEditing} className="report-input" /></div>
          <div className="form-field"><label>I.C. Rating (kA):</label><input value={formData.fuseData.icRatingKA} onChange={e => setField('fuseData.icRatingKA', e.target.value)} readOnly={!isEditing} className="report-input" /></div>
        </div>
      </section>

      {/* Electrical Tests - Contact Resistance */}
      <section className="report-section">
        <div className="section-divider"></div>
        <h2 className="section-title">Electrical Tests - Contact Resistance</h2>
        <h3 style={{ marginBottom: 8, fontWeight: 600 }}>As Found</h3>
        <div className="table-container">
          <table className="report-table">
            <thead>
              <tr>
                <th>Test</th>
                <th>P1</th>
                <th>P2</th>
                <th>P3</th>
                <th>Units</th>
              </tr>
            </thead>
            <tbody>
              {formData.electricalTests.contactResistanceAsFound.map((row, index) => (
                <tr key={`cr-af-${index}`}>
                  <td>{row.test}</td>
                  <td><input value={row.p1} onChange={e => { const arr = [...formData.electricalTests.contactResistanceAsFound]; arr[index].p1 = e.target.value; setField('electricalTests.contactResistanceAsFound', arr); }} readOnly={!isEditing} className="report-input" /></td>
                  <td><input value={row.p2} onChange={e => { const arr = [...formData.electricalTests.contactResistanceAsFound]; arr[index].p2 = e.target.value; setField('electricalTests.contactResistanceAsFound', arr); }} readOnly={!isEditing} className="report-input" /></td>
                  <td><input value={row.p3} onChange={e => { const arr = [...formData.electricalTests.contactResistanceAsFound]; arr[index].p3 = e.target.value; setField('electricalTests.contactResistanceAsFound', arr); }} readOnly={!isEditing} className="report-input" /></td>
                  <td>
                    <select value={row.units} onChange={e => { const arr = [...formData.electricalTests.contactResistanceAsFound]; arr[index].units = e.target.value; setField('electricalTests.contactResistanceAsFound', arr); }} disabled={!isEditing} className="report-input">
                      {contactResistanceUnitOptions.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h3 style={{ marginTop: 16, marginBottom: 8, fontWeight: 600 }}>As Left</h3>
        <div className="table-container">
          <table className="report-table">
            <thead>
              <tr>
                <th>Test</th>
                <th>P1</th>
                <th>P2</th>
                <th>P3</th>
                <th>Units</th>
              </tr>
            </thead>
            <tbody>
              {formData.electricalTests.contactResistanceAsLeft.map((row, index) => (
                <tr key={`cr-al-${index}`}>
                  <td>{row.test}</td>
                  <td><input value={row.p1} onChange={e => { const arr = [...formData.electricalTests.contactResistanceAsLeft]; arr[index].p1 = e.target.value; setField('electricalTests.contactResistanceAsLeft', arr); }} readOnly={!isEditing} className="report-input" /></td>
                  <td><input value={row.p2} onChange={e => { const arr = [...formData.electricalTests.contactResistanceAsLeft]; arr[index].p2 = e.target.value; setField('electricalTests.contactResistanceAsLeft', arr); }} readOnly={!isEditing} className="report-input" /></td>
                  <td><input value={row.p3} onChange={e => { const arr = [...formData.electricalTests.contactResistanceAsLeft]; arr[index].p3 = e.target.value; setField('electricalTests.contactResistanceAsLeft', arr); }} readOnly={!isEditing} className="report-input" /></td>
                  <td>
                    <select value={row.units} onChange={e => { const arr = [...formData.electricalTests.contactResistanceAsLeft]; arr[index].units = e.target.value; setField('electricalTests.contactResistanceAsLeft', arr); }} disabled={!isEditing} className="report-input">
                      {contactResistanceUnitOptions.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Electrical Tests - Insulation Resistance */}
      <section className="report-section">
        <div className="section-divider"></div>
        <h2 className="section-title">Electrical Tests - Insulation Resistance</h2>
        <div style={{ marginBottom: 8 }}>
          <label style={{ marginRight: 8 }}>Test Voltage:</label>
          <select value={formData.electricalTests.insulationResistance.testVoltage} onChange={e => setField('electricalTests.insulationResistance.testVoltage', e.target.value)} disabled={!isEditing} className="report-input" style={{ width: 120 }}>
            {insulationTestVoltageOptions.map(v => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>
        <div className="table-container">
          <table className="report-table">
            <thead>
              <tr>
                <th>Test</th>
                <th>State</th>
                <th>P1 (MΩ)</th>
                <th>P2 (MΩ)</th>
                <th>P3 (MΩ)</th>
              </tr>
            </thead>
            <tbody>
              {formData.electricalTests.insulationResistance.readings.map((row, index) => (
                <tr key={`ir-${index}`}>
                  <td>{row.test}</td>
                  <td>{row.state}</td>
                  <td><input value={row.p1_mq} onChange={e => { const arr = [...formData.electricalTests.insulationResistance.readings]; arr[index].p1_mq = e.target.value; setField('electricalTests.insulationResistance.readings', arr); }} readOnly={!isEditing} className="report-input" /></td>
                  <td><input value={row.p2_mq} onChange={e => { const arr = [...formData.electricalTests.insulationResistance.readings]; arr[index].p2_mq = e.target.value; setField('electricalTests.insulationResistance.readings', arr); }} readOnly={!isEditing} className="report-input" /></td>
                  <td><input value={row.p3_mq} onChange={e => { const arr = [...formData.electricalTests.insulationResistance.readings]; arr[index].p3_mq = e.target.value; setField('electricalTests.insulationResistance.readings', arr); }} readOnly={!isEditing} className="report-input" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h3 style={{ marginTop: 16, marginBottom: 8, fontWeight: 600 }}>Temperature Corrected</h3>
        <div className="table-container">
          <table className="report-table">
            <thead>
              <tr>
                <th>Test</th>
                <th>State</th>
                <th>P1 (MΩ)</th>
                <th>P2 (MΩ)</th>
                <th>P3 (MΩ)</th>
              </tr>
            </thead>
            <tbody>
              {formData.electricalTests.temperatureCorrected.readings.map((row, index) => (
                <tr key={`tc-${index}`}>
                  <td>{row.test}</td>
                  <td>{row.state}</td>
                  <td><input value={row.p1_mq} readOnly className="report-input readonly calculated" /></td>
                  <td><input value={row.p2_mq} readOnly className="report-input readonly calculated" /></td>
                  <td><input value={row.p3_mq} readOnly className="report-input readonly calculated" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Contactor Data */}
      <section className="report-section">
        <div className="section-divider"></div>
        <h2 className="section-title">Contactor Data</h2>
        <div className="form-grid">
          <div className="form-field"><label>Manufacturer:</label><input value={formData.contactorData.manufacturer} onChange={e => setField('contactorData.manufacturer', e.target.value)} readOnly={!isEditing} className="report-input" /></div>
          <div className="form-field"><label>I.C. Rating (kA):</label><input value={formData.contactorData.icRatingKA} onChange={e => setField('contactorData.icRatingKA', e.target.value)} readOnly={!isEditing} className="report-input" /></div>
          <div className="form-field"><label>Catalog Number:</label><input value={formData.contactorData.catalogNumber} onChange={e => setField('contactorData.catalogNumber', e.target.value)} readOnly={!isEditing} className="report-input" /></div>
          <div className="form-field"><label>Rated Voltage (kV):</label><input value={formData.contactorData.ratedVoltageKV} onChange={e => setField('contactorData.ratedVoltageKV', e.target.value)} readOnly={!isEditing} className="report-input" /></div>
          <div className="form-field"><label>Serial Number:</label><input value={formData.contactorData.serialNumber} onChange={e => setField('contactorData.serialNumber', e.target.value)} readOnly={!isEditing} className="report-input" /></div>
          <div className="form-field"><label>Operating Voltage (kV):</label><input value={formData.contactorData.operatingVoltageKV} onChange={e => setField('contactorData.operatingVoltageKV', e.target.value)} readOnly={!isEditing} className="report-input" /></div>
          <div className="form-field"><label>Type:</label><input value={formData.contactorData.type} onChange={e => setField('contactorData.type', e.target.value)} readOnly={!isEditing} className="report-input" /></div>
          <div className="form-field"><label>Ampacity:</label><input value={formData.contactorData.ampacity} onChange={e => setField('contactorData.ampacity', e.target.value)} readOnly={!isEditing} className="report-input" /></div>
          <div className="form-field"><label>Manufacturing Date:</label><input value={formData.contactorData.manufacturingDate} onChange={e => setField('contactorData.manufacturingDate', e.target.value)} readOnly={!isEditing} className="report-input" /></div>
          <div className="form-field"><label>Control Voltage (V):</label><input value={formData.contactorData.controlVoltageV} onChange={e => setField('contactorData.controlVoltageV', e.target.value)} readOnly={!isEditing} className="report-input" /></div>
        </div>
      </section>

      {/* Electrical Test - Contactor */}
      <section className="report-section">
        <div className="section-divider"></div>
        <h2 className="section-title">Electrical Test - Contactor</h2>
        <h3 style={{ marginBottom: 8, fontWeight: 600 }}>Insulation Resistance</h3>
        <div style={{ marginBottom: 8 }}>
          <label style={{ marginRight: 8 }}>Test Voltage:</label>
          <select value={formData.electricalTestContactor.insulationResistance.testVoltage} onChange={e => setField('electricalTestContactor.insulationResistance.testVoltage', e.target.value)} disabled={!isEditing} className="report-input" style={{ width: 120 }}>
            {insulationTestVoltageOptions.map(v => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>
        <div className="table-container">
          <table className="report-table">
            <thead>
              <tr><th>Test</th><th>State</th><th>P1 (MΩ)</th><th>P2 (MΩ)</th><th>P3 (MΩ)</th></tr>
            </thead>
            <tbody>
              {formData.electricalTestContactor.insulationResistance.readings.map((row, index) => (
                <tr key={`cir-${index}`}>
                  <td>{row.test}</td>
                  <td>{row.state}</td>
                  <td><input value={row.p1_mq} onChange={e => { const arr = [...formData.electricalTestContactor.insulationResistance.readings]; arr[index].p1_mq = e.target.value; setField('electricalTestContactor.insulationResistance.readings', arr); }} readOnly={!isEditing} className="report-input" /></td>
                  <td><input value={row.p2_mq} onChange={e => { const arr = [...formData.electricalTestContactor.insulationResistance.readings]; arr[index].p2_mq = e.target.value; setField('electricalTestContactor.insulationResistance.readings', arr); }} readOnly={!isEditing} className="report-input" /></td>
                  <td><input value={row.p3_mq} onChange={e => { const arr = [...formData.electricalTestContactor.insulationResistance.readings]; arr[index].p3_mq = e.target.value; setField('electricalTestContactor.insulationResistance.readings', arr); }} readOnly={!isEditing} className="report-input" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h3 style={{ marginTop: 16, marginBottom: 8, fontWeight: 600 }}>Temperature Corrected</h3>
        <div className="table-container">
          <table className="report-table">
            <thead>
              <tr><th>Test</th><th>State</th><th>P1 (MΩ)</th><th>P2 (MΩ)</th><th>P3 (MΩ)</th></tr>
            </thead>
            <tbody>
              {formData.electricalTestContactor.temperatureCorrected.readings.map((row, index) => (
                <tr key={`ctc-${index}`}>
                  <td>{row.test}</td>
                  <td>{row.state}</td>
                  <td><input value={row.p1_mq} readOnly className="report-input readonly calculated" /></td>
                  <td><input value={row.p2_mq} readOnly className="report-input readonly calculated" /></td>
                  <td><input value={row.p3_mq} readOnly className="report-input readonly calculated" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h3 style={{ marginTop: 16, marginBottom: 8, fontWeight: 600 }}>Vacuum Bottle Integrity</h3>
        <div className="table-container">
          <table className="report-table">
            <thead>
              <tr><th>Test Voltage</th><th>Duration</th><th>P1</th><th>P2</th><th>P3</th><th>Units</th></tr>
            </thead>
            <tbody>
              <tr>
                <td><input value={formData.electricalTestContactor.vacuumBottleIntegrity.testVoltage} onChange={e => setField('electricalTestContactor.vacuumBottleIntegrity.testVoltage', e.target.value)} readOnly={!isEditing} className="report-input" /></td>
                <td><input value={formData.electricalTestContactor.vacuumBottleIntegrity.testDuration} onChange={e => setField('electricalTestContactor.vacuumBottleIntegrity.testDuration', e.target.value)} readOnly={!isEditing} className="report-input" /></td>
                <td><input value={formData.electricalTestContactor.vacuumBottleIntegrity.p1} onChange={e => setField('electricalTestContactor.vacuumBottleIntegrity.p1', e.target.value)} readOnly={!isEditing} className="report-input" /></td>
                <td><input value={formData.electricalTestContactor.vacuumBottleIntegrity.p2} onChange={e => setField('electricalTestContactor.vacuumBottleIntegrity.p2', e.target.value)} readOnly={!isEditing} className="report-input" /></td>
                <td><input value={formData.electricalTestContactor.vacuumBottleIntegrity.p3} onChange={e => setField('electricalTestContactor.vacuumBottleIntegrity.p3', e.target.value)} readOnly={!isEditing} className="report-input" /></td>
                <td><input value={formData.electricalTestContactor.vacuumBottleIntegrity.units} onChange={e => setField('electricalTestContactor.vacuumBottleIntegrity.units', e.target.value)} readOnly={!isEditing} className="report-input" /></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Starting Reactor Data */}
      <section className="report-section">
        <div className="section-divider"></div>
        <h2 className="section-title">Starting Reactor Data</h2>
        <div className="form-grid">
          <div className="form-field"><label>Manufacturer:</label><input value={formData.startingReactorData.manufacturer} onChange={e => setField('startingReactorData.manufacturer', e.target.value)} readOnly={!isEditing} className="report-input" /></div>
          <div className="form-field"><label>Rated Current (A):</label><input value={formData.startingReactorData.ratedCurrentA} onChange={e => setField('startingReactorData.ratedCurrentA', e.target.value)} readOnly={!isEditing} className="report-input" /></div>
          <div className="form-field"><label>Catalog Number:</label><input value={formData.startingReactorData.catalogNumber} onChange={e => setField('startingReactorData.catalogNumber', e.target.value)} readOnly={!isEditing} className="report-input" /></div>
          <div className="form-field"><label>Rated Voltage (kV):</label><input value={formData.startingReactorData.ratedVoltageKV} onChange={e => setField('startingReactorData.ratedVoltageKV', e.target.value)} readOnly={!isEditing} className="report-input" /></div>
          <div className="form-field"><label>Serial Number:</label><input value={formData.startingReactorData.serialNumber} onChange={e => setField('startingReactorData.serialNumber', e.target.value)} readOnly={!isEditing} className="report-input" /></div>
          <div className="form-field"><label>Operating Voltage (kV):</label><input value={formData.startingReactorData.operatingVoltageKV} onChange={e => setField('startingReactorData.operatingVoltageKV', e.target.value)} readOnly={!isEditing} className="report-input" /></div>
        </div>
      </section>

      {/* Electrical Test - Reactor */}
      <section className="report-section">
        <div className="section-divider"></div>
        <h2 className="section-title">Electrical Test - Reactor</h2>
        <h3 style={{ marginBottom: 8, fontWeight: 600 }}>Insulation Resistance - Winding to Ground</h3>
        <div style={{ marginBottom: 8 }}>
          <label style={{ marginRight: 8 }}>Test Voltage:</label>
          <select value={formData.electricalTestReactor.insulationResistance.testVoltage} onChange={e => setField('electricalTestReactor.insulationResistance.testVoltage', e.target.value)} disabled={!isEditing} className="report-input" style={{ width: 120 }}>
            {insulationTestVoltageOptions.map(v => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>
        <div className="table-container">
          <table className="report-table">
            <thead>
              <tr><th>A Phase</th><th>B Phase</th><th>C Phase</th><th>Units</th></tr>
            </thead>
            <tbody>
              <tr>
                <td><input value={formData.electricalTestReactor.insulationResistance.windingToGround.aPhase} onChange={e => setField('electricalTestReactor.insulationResistance.windingToGround.aPhase', e.target.value)} readOnly={!isEditing} className="report-input" /></td>
                <td><input value={formData.electricalTestReactor.insulationResistance.windingToGround.bPhase} onChange={e => setField('electricalTestReactor.insulationResistance.windingToGround.bPhase', e.target.value)} readOnly={!isEditing} className="report-input" /></td>
                <td><input value={formData.electricalTestReactor.insulationResistance.windingToGround.cPhase} onChange={e => setField('electricalTestReactor.insulationResistance.windingToGround.cPhase', e.target.value)} readOnly={!isEditing} className="report-input" /></td>
                <td>
                  <select value={formData.electricalTestReactor.insulationResistance.windingToGround.units} onChange={e => setField('electricalTestReactor.insulationResistance.windingToGround.units', e.target.value)} disabled={!isEditing} className="report-input">
                    {insulationResistanceUnitOptions.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <h3 style={{ marginTop: 16, marginBottom: 8, fontWeight: 600 }}>Temperature Corrected - Winding to Ground</h3>
        <div className="table-container">
          <table className="report-table">
            <thead>
              <tr><th>A Phase</th><th>B Phase</th><th>C Phase</th><th>Units</th></tr>
            </thead>
            <tbody>
              <tr>
                <td><input value={formData.electricalTestReactor.temperatureCorrected.windingToGround.aPhase} readOnly className="report-input readonly calculated" /></td>
                <td><input value={formData.electricalTestReactor.temperatureCorrected.windingToGround.bPhase} readOnly className="report-input readonly calculated" /></td>
                <td><input value={formData.electricalTestReactor.temperatureCorrected.windingToGround.cPhase} readOnly className="report-input readonly calculated" /></td>
                <td><input value={formData.electricalTestReactor.temperatureCorrected.windingToGround.units} readOnly className="report-input readonly" /></td>
              </tr>
            </tbody>
          </table>
        </div>

        <h3 style={{ marginTop: 16, marginBottom: 8, fontWeight: 600 }}>Contact Resistance - As Found</h3>
        <div className="table-container">
          <table className="report-table">
            <thead>
              <tr><th>A Phase</th><th>B Phase</th><th>C Phase</th><th>Units</th></tr>
            </thead>
            <tbody>
              <tr>
                <td><input value={formData.electricalTestReactor.contactResistanceAsFound.aPhase} onChange={e => setField('electricalTestReactor.contactResistanceAsFound.aPhase', e.target.value)} readOnly={!isEditing} className="report-input" /></td>
                <td><input value={formData.electricalTestReactor.contactResistanceAsFound.bPhase} onChange={e => setField('electricalTestReactor.contactResistanceAsFound.bPhase', e.target.value)} readOnly={!isEditing} className="report-input" /></td>
                <td><input value={formData.electricalTestReactor.contactResistanceAsFound.cPhase} onChange={e => setField('electricalTestReactor.contactResistanceAsFound.cPhase', e.target.value)} readOnly={!isEditing} className="report-input" /></td>
                <td>
                  <select value={formData.electricalTestReactor.contactResistanceAsFound.units} onChange={e => setField('electricalTestReactor.contactResistanceAsFound.units', e.target.value)} disabled={!isEditing} className="report-input">
                    {contactResistanceUnitOptions.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <h3 style={{ marginTop: 16, marginBottom: 8, fontWeight: 600 }}>Contact Resistance - As Left</h3>
        <div className="table-container">
          <table className="report-table">
            <thead>
              <tr><th>A Phase</th><th>B Phase</th><th>C Phase</th><th>Units</th></tr>
            </thead>
            <tbody>
              <tr>
                <td><input value={formData.electricalTestReactor.contactResistanceAsLeft.aPhase} onChange={e => setField('electricalTestReactor.contactResistanceAsLeft.aPhase', e.target.value)} readOnly={!isEditing} className="report-input" /></td>
                <td><input value={formData.electricalTestReactor.contactResistanceAsLeft.bPhase} onChange={e => setField('electricalTestReactor.contactResistanceAsLeft.bPhase', e.target.value)} readOnly={!isEditing} className="report-input" /></td>
                <td><input value={formData.electricalTestReactor.contactResistanceAsLeft.cPhase} onChange={e => setField('electricalTestReactor.contactResistanceAsLeft.cPhase', e.target.value)} readOnly={!isEditing} className="report-input" /></td>
                <td>
                  <select value={formData.electricalTestReactor.contactResistanceAsLeft.units} onChange={e => setField('electricalTestReactor.contactResistanceAsLeft.units', e.target.value)} disabled={!isEditing} className="report-input">
                    {contactResistanceUnitOptions.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </td>
              </tr>
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
                <td><input value={formData.testEquipmentUsed.megohmmeter.name} onChange={e => setField('testEquipmentUsed.megohmmeter.name', e.target.value)} readOnly={!isEditing} className="report-input" /></td>
                <td><input value={formData.testEquipmentUsed.megohmmeter.serialNumber} onChange={e => setField('testEquipmentUsed.megohmmeter.serialNumber', e.target.value)} readOnly={!isEditing} className="report-input" /></td>
                <td><input value={formData.testEquipmentUsed.megohmmeter.ampId} onChange={e => setField('testEquipmentUsed.megohmmeter.ampId', e.target.value)} readOnly={!isEditing} className="report-input" /></td>
              </tr>
              <tr>
                <td>Low Resistance Ohmmeter</td>
                <td><input value={formData.testEquipmentUsed.lowResistanceOhmmeter.name} onChange={e => setField('testEquipmentUsed.lowResistanceOhmmeter.name', e.target.value)} readOnly={!isEditing} className="report-input" /></td>
                <td><input value={formData.testEquipmentUsed.lowResistanceOhmmeter.serialNumber} onChange={e => setField('testEquipmentUsed.lowResistanceOhmmeter.serialNumber', e.target.value)} readOnly={!isEditing} className="report-input" /></td>
                <td><input value={formData.testEquipmentUsed.lowResistanceOhmmeter.ampId} onChange={e => setField('testEquipmentUsed.lowResistanceOhmmeter.ampId', e.target.value)} readOnly={!isEditing} className="report-input" /></td>
              </tr>
              <tr>
                <td>Hi-Pot</td>
                <td><input value={formData.testEquipmentUsed.hipot.name} onChange={e => setField('testEquipmentUsed.hipot.name', e.target.value)} readOnly={!isEditing} className="report-input" /></td>
                <td><input value={formData.testEquipmentUsed.hipot.serialNumber} onChange={e => setField('testEquipmentUsed.hipot.serialNumber', e.target.value)} readOnly={!isEditing} className="report-input" /></td>
                <td><input value={formData.testEquipmentUsed.hipot.ampId} onChange={e => setField('testEquipmentUsed.hipot.ampId', e.target.value)} readOnly={!isEditing} className="report-input" /></td>
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

export default MediumVoltageMotorStarterMTSReport;


