// SwitchgearSwitchboardATS25Report.tsx - 7.1.1 Switchgear & Switchboard Assemblies Test Sheet ATS 25
// Matches: switchgear-switchboard-assemblies-ats25
// Database table: switchgear_switchboard_ats25_reports

import React, { useState, useEffect } from 'react';
import './ReportStyles.css';

const VISUAL_INSPECTION_OPTIONS = [
  'Select One',
  'Satisfactory',
  'Unsatisfactory',
  'Cleaned',
  'See Comments',
  'Not Applicable'
];

const INSULATION_RESISTANCE_TEST_VOLTAGES = ['250V', '500V', '1000V', '2500V', '5000V'];
const INSULATION_RESISTANCE_UNITS = ['kΩ', 'MΩ', 'GΩ'];
const CONTACT_RESISTANCE_UNITS = ['µΩ', 'mΩ', 'Ω'];
const DIELECTRIC_WITHSTAND_UNITS = ['µA', 'mA'];
const DIELECTRIC_TEST_VOLTAGES = ['1.6 kVAC','2.2 kVAC','14 kVAC','27 kVAC','37 kVAC','45 kVAC','60 kVAC','120 kVAC','2.3 kVDC','3.1 kVDC','20 kVDC','37.5 kVDC'];
const RATED_VOLTAGE_OPTIONS = ['250','480','600','1000','2500','5000','8000','15000','25000','34500','46000'];

type StatusType = 'PASS' | 'FAIL' | 'LIMITED SERVICE';

interface InsulationRow { 
  busSection: string; 
  ag: string; bg: string; cg: string; 
  ab: string; bc: string; ca: string; 
  an: string; bn: string; cn: string; 
}

interface ContactRow { 
  busSection: string; 
  aPhase: string; bPhase: string; cPhase: string; 
  neutral: string; ground: string; 
}

interface DielectricRow { 
  busSection: string; 
  ag: string; bg: string; cg: string; 
  result?: 'PASS' | 'FAIL' | ''; 
}

interface FormData {
  customerName: string;
  customerLocation: string;
  userName: string;
  date: string;
  identifier: string;
  jobNumber: string;
  technicians: string;
  temperature: { fahrenheit: number; celsius: number; tcf: number; humidity: number | null };
  substation: string;
  eqptLocation: string;
  status: StatusType;

  nameplate: {
    manufacturer: string;
    catalogNumber: string;
    serialNumber: string;
    series: string;
    type: string;
    ratedVoltage: string;
    systemVoltage: string;
    ratedCurrent: string;
    aicRating: string;
    phaseConfiguration: string;
  };

  visualInspectionItems: Array<{ id: string; description: string; result: string; comments?: string }>;

  // Contact Resistance (comes first in web app)
  contactResistance: ContactRow[];
  contactUnit: string;
  contactEvaluation: { deviation: string; criteria: string; result: StatusType | 'N/A' }[];
  contactNeutral: { criteria: string; result: StatusType | 'N/A' };
  contactGround: { criteria: string; result: StatusType | 'N/A' };

  // Insulation Resistance
  insulationMeasured: InsulationRow[];
  insulationUnit: string;
  insulationTestVoltage: string;
  tempCorrected: InsulationRow[];
  criteriaValue: string;
  criteriaUnits: string;

  // Dielectric Withstand
  dielectricWithstand: DielectricRow[];
  dielectricUnit: string;
  dielectricTestVoltage: string;
  dielectricTestDuration: string;

  testEquipment: {
    megohmmeter: { name: string; serialNumber: string; ampId: string };
    lowResistanceOhmmeter: { name: string; serialNumber: string; ampId: string };
    hipot: { name: string; serialNumber: string; ampId: string };
  };
  comments: string;
}

const TCF_TABLE: { [k: string]: number } = {
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
  '41': 2.628, '42': 2.756, '43': 2.884, '44': 3.012, '45': 3.15,
  '46': 3.316, '47': 3.482, '48': 3.648, '49': 3.814, '50': 3.98,
  '51': 4.184, '52': 4.388, '53': 4.592, '54': 4.796, '55': 5,
  '56': 5.26, '57': 5.52, '58': 5.78, '59': 6.04, '60': 6.3,
  '61': 6.62, '62': 6.94, '63': 7.26, '64': 7.58, '65': 7.9,
  '66': 8.32, '67': 8.74, '68': 9.16, '69': 9.58, '70': 10
};

const getTCF = (celsius: number): number => TCF_TABLE[Math.round(celsius).toString()] ?? 1;

const defaultBus = ['Section 1', 'Section 2', 'Section 3', 'Section 4', 'Section 5'];

const DEFAULT_VISUAL_ITEMS = [
  { id: '7.1.1.A.1', description: 'Compare equipment nameplate data with drawings.', result: 'Select One' },
  { id: '7.1.1.A.2', description: 'Inspect physical, electrical, and mechanical condition.', result: 'Select One' },
  { id: '7.1.1.A.3', description: 'Inspect anchorage, alignment, grounding, and required area clearances.', result: 'Select One' },
  { id: '7.1.1.A.4', description: 'Verify unit is clean and all shipping bracing and loose parts removed.', result: 'Select One' },
  { id: '7.1.1.A.5', description: 'Compare mimic diagram and device labeling with drawings.', result: 'Select One' },
  { id: '7.1.1.A.6', description: 'Verify fuse and circuit breaker sizes and types correspond to drawings and coordination study.', result: 'Select One' },
  { id: '7.1.1.A.7', description: 'Verify CT and PT ratios correspond to drawings.', result: 'Select One' },
  { id: '7.1.1.A.8', description: 'Verify tight wiring connections and secure wiring for moving parts.', result: 'Select One' },
  { id: '7.1.1.A.9', description: 'Verify tightness of accessible bolted electrical connections by calibrated torque-wrench method.', result: 'Select One' },
  { id: '7.1.1.A.10', description: 'Confirm correct operation/sequencing of electrical and mechanical interlock systems.', result: 'Select One' },
  { id: '7.1.1.A.11', description: 'Verify appropriate lubrication on moving current-carrying parts and sliding surfaces.', result: 'Select One' },
  { id: '7.1.1.A.12', description: 'Inspect insulators for damage or contamination.', result: 'Select One' },
  { id: '7.1.1.A.13', description: 'Verify correct barrier and shutter installation and operation.', result: 'Select One' },
  { id: '7.1.1.A.14', description: 'Exercise all active components.', result: 'Select One' },
  { id: '7.1.1.A.15', description: 'Inspect mechanical indicating devices for correct operation.', result: 'Select One' },
  { id: '7.1.1.A.16', description: 'Verify filters are in place and vents are clear.', result: 'Select One' },
  { id: '7.1.1.A.17', description: 'Visual/mechanical inspection of instrument transformers per Section 7.19.', result: 'Select One' },
  { id: '7.1.1.A.18', description: 'Visual/mechanical inspection of surge arresters per Section 7.19.', result: 'Select One' },
  { id: '7.1.1.A.19', description: 'Inspect control power transformers.', result: 'Select One' },
  { id: '7.1.1.A.20', description: '*Perform thermographic survey per Section 9.', result: 'Select One' }
];

const initialFormData: FormData = {
  customerName: '', customerLocation: '', userName: '', date: new Date().toISOString().split('T')[0],
  identifier: '', jobNumber: '', technicians: '',
  temperature: { fahrenheit: 68, celsius: 20, tcf: 1, humidity: null },
  substation: '', eqptLocation: '', status: 'PASS',
  nameplate: { manufacturer: '', catalogNumber: '', serialNumber: '', series: '', type: '', ratedVoltage: '', systemVoltage: '', ratedCurrent: '', aicRating: '', phaseConfiguration: '' },
  visualInspectionItems: JSON.parse(JSON.stringify(DEFAULT_VISUAL_ITEMS)),
  contactResistance: defaultBus.map(b => ({ busSection: b, aPhase: '', bPhase: '', cPhase: '', neutral: '', ground: '' })),
  contactUnit: 'µΩ',
  contactEvaluation: defaultBus.map(() => ({ deviation: 'N/A', criteria: '<50%', result: 'N/A' as const })),
  contactNeutral: { criteria: 'N/A', result: 'N/A' },
  contactGround: { criteria: 'N/A', result: 'N/A' },
  insulationMeasured: defaultBus.map(b => ({ busSection: b, ag: '', bg: '', cg: '', ab: '', bc: '', ca: '', an: '', bn: '', cn: '' })),
  insulationUnit: 'MΩ', insulationTestVoltage: '1000V',
  tempCorrected: defaultBus.map(b => ({ busSection: b, ag: '', bg: '', cg: '', ab: '', bc: '', ca: '', an: '', bn: '', cn: '' })),
  criteriaValue: '≥ 25', criteriaUnits: 'MΩ',
  dielectricWithstand: defaultBus.map(b => ({ busSection: b, ag: '', bg: '', cg: '', result: '' })),
  dielectricUnit: 'µA', dielectricTestVoltage: '2.3 kVDC', dielectricTestDuration: '1 min.',
  testEquipment: {
    megohmmeter: { name: '', serialNumber: '', ampId: '' },
    lowResistanceOhmmeter: { name: '', serialNumber: '', ampId: '' },
    hipot: { name: '', serialNumber: '', ampId: '' }
  },
  comments: ''
};

interface SwitchgearSwitchboardATS25ReportProps {
  job?: any;
  reportData?: any;
  onSave?: (data: any) => void;
  isEditing?: boolean;
}

const SwitchgearSwitchboardATS25Report: React.FC<SwitchgearSwitchboardATS25ReportProps> = ({
  job,
  reportData: initialReportData,
  onSave,
  isEditing = true
}) => {
  const [formData, setFormData] = useState<FormData>(JSON.parse(JSON.stringify(initialFormData)));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    try {
      if (initialReportData) {
        loadFromProps(initialReportData);
      }
      if (job) {
        setFormData(prev => ({
          ...prev,
          customerName: job.customer_name || job.customerName || prev.customerName,
          customerLocation: job.site_address || job.siteAddress || prev.customerLocation,
          jobNumber: job.job_number || job.jobNumber || prev.jobNumber
        }));
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, [initialReportData, job]);

  // Auto-calculate TCF and corrected values
  useEffect(() => {
    const tcf = getTCF(formData.temperature.celsius);
    setFormData(prev => {
      const insulationRows = Array.isArray(prev.insulationMeasured) ? prev.insulationMeasured : initialFormData.insulationMeasured;
      const corrected = insulationRows.map(row => {
        const correctedRow: InsulationRow = { busSection: row.busSection, ag: '', bg: '', cg: '', ab: '', bc: '', ca: '', an: '', bn: '', cn: '' };
        (['ag', 'bg', 'cg', 'ab', 'bc', 'ca', 'an', 'bn', 'cn'] as const).forEach(key => {
          if (row[key]) correctedRow[key] = (parseFloat(row[key]) * tcf).toFixed(2);
        });
        return correctedRow;
      });
      return { ...prev, temperature: { ...prev.temperature, tcf }, tempCorrected: corrected };
    });
  }, [formData.temperature.celsius, formData.insulationMeasured]);

  const loadFromProps = (data: any) => {
    const ri = data.report_info || {};
    const np = ri.nameplate || data.nameplate || {};
    const vm = data.visual_mechanical || {};
    const vmItems = vm.items || data.visualInspectionItems || [];
    const ir = data.insulation_resistance || {};
    const cr = data.contact_resistance || {};
    const te = data.test_equipment || ri.testEquipment || {};

    // Helper to ensure array fields are valid arrays
    const ensureArray = <T,>(value: any, fallback: T[]): T[] => {
      return Array.isArray(value) ? value : fallback;
    };

    setFormData(prev => ({
      ...prev,
      customerName: ri.customer || data.customerName || prev.customerName,
      customerLocation: ri.address || data.customerLocation || prev.customerLocation,
      userName: ri.userName || data.userName || prev.userName,
      date: ri.date || data.date || prev.date,
      technicians: ri.technicians || data.technicians || prev.technicians,
      identifier: ri.identifier || data.identifier || prev.identifier,
      substation: ri.substation || data.substation || prev.substation,
      eqptLocation: ri.eqptLocation || data.eqptLocation || prev.eqptLocation,
      temperature: ri.temperature || data.temperature || prev.temperature,
      status: ri.status || data.status || prev.status,
      nameplate: {
        manufacturer: np.manufacturer || prev.nameplate.manufacturer,
        catalogNumber: np.catalogNumber || prev.nameplate.catalogNumber,
        serialNumber: np.serialNumber || prev.nameplate.serialNumber,
        series: np.series || prev.nameplate.series,
        type: np.type || prev.nameplate.type,
        ratedVoltage: np.ratedVoltage || prev.nameplate.ratedVoltage,
        systemVoltage: np.systemVoltage || prev.nameplate.systemVoltage,
        ratedCurrent: np.ratedCurrent || prev.nameplate.ratedCurrent,
        aicRating: np.aicRating || prev.nameplate.aicRating,
        phaseConfiguration: np.phaseConfiguration || prev.nameplate.phaseConfiguration
      },
      visualInspectionItems: ensureArray(vmItems.length ? vmItems : data.visualInspectionItems, prev.visualInspectionItems),
      // Contact resistance - web app uses "tests" key
      contactResistance: ensureArray(cr.tests || data.contactResistance, prev.contactResistance),
      contactUnit: cr.unit || data.contactUnit || prev.contactUnit,
      contactEvaluation: ensureArray(cr.evaluation || data.contactEvaluation, prev.contactEvaluation),
      contactNeutral: cr.neutral || data.contactNeutral || prev.contactNeutral,
      contactGround: cr.ground || data.contactGround || prev.contactGround,
      // Insulation resistance - web app uses "tests" and "correctedTests" keys
      insulationMeasured: ensureArray(ir.tests || data.insulationMeasured, prev.insulationMeasured),
      insulationUnit: ir.unit || data.insulationUnit || prev.insulationUnit,
      insulationTestVoltage: ir.testVoltage || data.insulationTestVoltage || prev.insulationTestVoltage,
      tempCorrected: ensureArray(ir.correctedTests || data.tempCorrected, prev.tempCorrected),
      criteriaValue: ir.criteriaValue || data.criteriaValue || prev.criteriaValue,
      criteriaUnits: ir.criteriaUnits || data.criteriaUnits || prev.criteriaUnits,
      // Dielectric withstand - web app stores in contact_resistance
      dielectricWithstand: ensureArray(cr.dielectricTests || data.dielectricWithstand, prev.dielectricWithstand),
      dielectricUnit: cr.dielectricUnit || data.dielectricUnit || prev.dielectricUnit,
      dielectricTestVoltage: cr.dielectricTestVoltage || data.dielectricTestVoltage || prev.dielectricTestVoltage,
      dielectricTestDuration: cr.dielectricDuration || data.dielectricTestDuration || prev.dielectricTestDuration,
      testEquipment: te.megohmmeter ? te : prev.testEquipment,
      comments: data.comments || vm.comments || prev.comments
    }));
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNestedChange = (section: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [section]: { ...(prev as any)[section], [field]: value }
    }));
  };

  const handleTemperatureChange = (type: 'fahrenheit' | 'celsius', value: number) => {
    let fahrenheit = formData.temperature.fahrenheit;
    let celsius = formData.temperature.celsius;
    if (type === 'fahrenheit') {
      fahrenheit = value;
      celsius = Math.round((value - 32) * 5 / 9);
    } else {
      celsius = value;
      fahrenheit = Math.round(value * 9 / 5 + 32);
    }
    setFormData(prev => ({ ...prev, temperature: { ...prev.temperature, fahrenheit, celsius } }));
  };

  const handleVisualInspectionChange = (index: number, result: string) => {
    const newItems = [...formData.visualInspectionItems];
    newItems[index] = { ...newItems[index], result };
    setFormData(prev => ({ ...prev, visualInspectionItems: newItems }));
  };

  const handleInsulationChange = (index: number, field: keyof InsulationRow, value: string) => {
    const newRows = [...formData.insulationMeasured];
    newRows[index] = { ...newRows[index], [field]: value };
    setFormData(prev => ({ ...prev, insulationMeasured: newRows }));
  };

  const handleContactChange = (index: number, field: keyof ContactRow, value: string) => {
    const newRows = [...formData.contactResistance];
    newRows[index] = { ...newRows[index], [field]: value };
    setFormData(prev => ({ ...prev, contactResistance: newRows }));
  };

  const handleDielectricChange = (index: number, field: keyof DielectricRow, value: string) => {
    const newRows = [...formData.dielectricWithstand];
    newRows[index] = { ...newRows[index], [field]: value };
    setFormData(prev => ({ ...prev, dielectricWithstand: newRows }));
  };

  if (loading) {
    return <div className="report-container"><p>Loading report...</p></div>;
  }

  const handleSaveReport = () => {
    if (onSave) {
      // Build the save payload matching the web app structure
      const savePayload = {
        ...formData,
        report_info: {
          customer: formData.customerName,
          address: formData.customerLocation,
          jobNumber: formData.jobNumber,
          identifier: formData.identifier,
          technicians: formData.technicians,
          date: formData.date,
          substation: formData.substation,
          eqptLocation: formData.eqptLocation,
          temperature: formData.temperature,
          status: formData.status
        },
        nameplate_data: formData.nameplate,
        visual_inspection_items: formData.visualInspectionItems,
        contact_resistance: {
          tests: formData.contactResistance,
          unit: formData.contactUnit,
          evaluation: formData.contactEvaluation,
          neutral: formData.contactNeutral,
          ground: formData.contactGround,
          dielectricTests: formData.dielectricWithstand,
          dielectricUnit: formData.dielectricUnit,
          dielectricTestVoltage: formData.dielectricTestVoltage,
          dielectricDuration: formData.dielectricTestDuration
        },
        insulation_resistance: {
          tests: formData.insulationMeasured,
          correctedTests: formData.tempCorrected,
          unit: formData.insulationUnit,
          testVoltage: formData.insulationTestVoltage,
          criteriaValue: formData.criteriaValue,
          criteriaUnits: formData.criteriaUnits
        },
        test_equipment_used: formData.testEquipment,
        comments: formData.comments
      };
      onSave(savePayload);
      console.log('📝 Report saved:', savePayload);
    }
  };

  return (
    <div className="report-container">
      {/* Save Button Bar */}
      {isEditing && onSave && (
        <div className="report-action-bar">
          <button onClick={handleSaveReport} className="btn-save-report">
            💾 Save Report
          </button>
          <span className="save-hint">Click to save changes locally. Use "Sync to Database" in app header to upload.</span>
        </div>
      )}

      {/* Print Header */}
      <div className="print-header">
        <img 
          src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/AMP%20Logo-FdmXGeXuGBlr2AcoAFFlM8AqzmoyM1.png" 
          alt="AMP Logo" 
          className="print-logo"
        />
        <div className="print-title">
          <h1>7.1.1 Switchgear & Switchboard Assemblies Test Sheet ATS 25</h1>
          <p className="neta-ref">NETA - ATS 7.1.1</p>
        </div>
        <div className={`status-badge ${formData.status === 'PASS' ? 'status-pass' : formData.status === 'FAIL' ? 'status-fail' : ''}`}>
          {formData.status}
        </div>
      </div>

      {/* Job Information */}
      <div className="report-section">
        <div className="section-divider"></div>
        <h2 className="section-title">Job Information</h2>
        <table className="data-table">
          <tbody>
            <tr>
              <td className="label-cell">Customer:</td>
              <td><input type="text" value={formData.customerName} onChange={(e) => handleInputChange('customerName', e.target.value)} readOnly={!isEditing} className="table-input" /></td>
              <td className="label-cell">Job Number:</td>
              <td><input type="text" value={formData.jobNumber} onChange={(e) => handleInputChange('jobNumber', e.target.value)} readOnly={!isEditing} className="table-input" /></td>
            </tr>
            <tr>
              <td className="label-cell">Location:</td>
              <td colSpan={3}><input type="text" value={formData.customerLocation} onChange={(e) => handleInputChange('customerLocation', e.target.value)} readOnly={!isEditing} className="table-input" /></td>
            </tr>
            <tr>
              <td className="label-cell">Date:</td>
              <td><input type="date" value={formData.date} onChange={(e) => handleInputChange('date', e.target.value)} readOnly={!isEditing} className="table-input" /></td>
              <td className="label-cell">Technicians:</td>
              <td><input type="text" value={formData.technicians} onChange={(e) => handleInputChange('technicians', e.target.value)} readOnly={!isEditing} className="table-input" /></td>
            </tr>
            <tr>
              <td className="label-cell">Temp (°F):</td>
              <td>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input type="number" value={formData.temperature.fahrenheit} onChange={(e) => handleTemperatureChange('fahrenheit', parseFloat(e.target.value) || 0)} readOnly={!isEditing} className="table-input" style={{ width: '80px' }} />
                  <span>{formData.temperature.celsius}°C</span>
                  <span style={{ marginLeft: '16px' }}>TCF: {formData.temperature.tcf.toFixed(3)}</span>
                </div>
              </td>
              <td className="label-cell">Humidity (%):</td>
              <td><input type="number" value={formData.temperature.humidity ?? ''} onChange={(e) => handleNestedChange('temperature', 'humidity', parseFloat(e.target.value) || null)} readOnly={!isEditing} className="table-input" /></td>
            </tr>
            <tr>
              <td className="label-cell">Substation:</td>
              <td><input type="text" value={formData.substation} onChange={(e) => handleInputChange('substation', e.target.value)} readOnly={!isEditing} className="table-input" /></td>
              <td className="label-cell">Eqpt. Location:</td>
              <td><input type="text" value={formData.eqptLocation} onChange={(e) => handleInputChange('eqptLocation', e.target.value)} readOnly={!isEditing} className="table-input" /></td>
            </tr>
            <tr>
              <td className="label-cell">Identifier:</td>
              <td><input type="text" value={formData.identifier} onChange={(e) => handleInputChange('identifier', e.target.value)} readOnly={!isEditing} className="table-input" /></td>
              <td className="label-cell">Status:</td>
              <td>
                {isEditing ? (
                  <select value={formData.status} onChange={(e) => handleInputChange('status', e.target.value)} className="table-input">
                    <option value="PASS">PASS</option>
                    <option value="FAIL">FAIL</option>
                    <option value="LIMITED SERVICE">LIMITED SERVICE</option>
                  </select>
                ) : (
                  <span className={formData.status === 'PASS' ? 'status-pass-text' : 'status-fail-text'}>{formData.status}</span>
                )}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Nameplate Data */}
      <div className="report-section">
        <div className="section-divider"></div>
        <h2 className="section-title">Nameplate Data</h2>
        <table className="data-table">
          <tbody>
            <tr>
              <td className="label-cell">Manufacturer:</td>
              <td><input type="text" value={formData.nameplate.manufacturer} onChange={(e) => handleNestedChange('nameplate', 'manufacturer', e.target.value)} readOnly={!isEditing} className="table-input" /></td>
              <td className="label-cell">Catalog No.:</td>
              <td><input type="text" value={formData.nameplate.catalogNumber} onChange={(e) => handleNestedChange('nameplate', 'catalogNumber', e.target.value)} readOnly={!isEditing} className="table-input" /></td>
              <td className="label-cell">Serial Number:</td>
              <td><input type="text" value={formData.nameplate.serialNumber} onChange={(e) => handleNestedChange('nameplate', 'serialNumber', e.target.value)} readOnly={!isEditing} className="table-input" /></td>
            </tr>
            <tr>
              <td className="label-cell">Series:</td>
              <td><input type="text" value={formData.nameplate.series} onChange={(e) => handleNestedChange('nameplate', 'series', e.target.value)} readOnly={!isEditing} className="table-input" /></td>
              <td className="label-cell">Type:</td>
              <td><input type="text" value={formData.nameplate.type} onChange={(e) => handleNestedChange('nameplate', 'type', e.target.value)} readOnly={!isEditing} className="table-input" /></td>
              <td className="label-cell">System Voltage (V):</td>
              <td><input type="text" value={formData.nameplate.systemVoltage} onChange={(e) => handleNestedChange('nameplate', 'systemVoltage', e.target.value)} readOnly={!isEditing} className="table-input" /></td>
            </tr>
            <tr>
              <td className="label-cell">Rated Voltage (V):</td>
              <td>
                <select value={formData.nameplate.ratedVoltage} onChange={(e) => handleNestedChange('nameplate', 'ratedVoltage', e.target.value)} disabled={!isEditing} className="table-input">
                  <option value="">Select...</option>
                  {RATED_VOLTAGE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </td>
              <td className="label-cell">Rated Current (A):</td>
              <td><input type="text" value={formData.nameplate.ratedCurrent} onChange={(e) => handleNestedChange('nameplate', 'ratedCurrent', e.target.value)} readOnly={!isEditing} className="table-input" /></td>
              <td className="label-cell">AIC Rating (kA):</td>
              <td><input type="text" value={formData.nameplate.aicRating} onChange={(e) => handleNestedChange('nameplate', 'aicRating', e.target.value)} readOnly={!isEditing} className="table-input" /></td>
            </tr>
            <tr>
              <td className="label-cell">Phase Config:</td>
              <td><input type="text" value={formData.nameplate.phaseConfiguration} onChange={(e) => handleNestedChange('nameplate', 'phaseConfiguration', e.target.value)} readOnly={!isEditing} className="table-input" /></td>
              <td colSpan={4}></td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Visual and Mechanical Inspection */}
      <div className="report-section">
        <div className="section-divider"></div>
        <h2 className="section-title">Visual and Mechanical Inspection</h2>
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: '100px' }}>NETA Section</th>
              <th>Description</th>
              <th style={{ width: '150px' }}>Result</th>
            </tr>
          </thead>
          <tbody>
            {formData.visualInspectionItems.map((item, index) => (
              <tr key={item.id}>
                <td>{item.id}</td>
                <td style={{ textAlign: 'left' }}>{item.description}</td>
                <td>
                  <select value={item.result} onChange={(e) => handleVisualInspectionChange(index, e.target.value)} disabled={!isEditing} className="table-input">
                    {VISUAL_INSPECTION_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Electrical - Contact Resistance Tests (comes BEFORE Insulation in web app) */}
      <div className="report-section">
        <div className="section-divider"></div>
        <h2 className="section-title">Electrical - Contact Resistance Tests</h2>
        <div className="table-container" style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Bus Section</th>
                <th colSpan={5}>Contact Resistance</th>
                <th>Units</th>
              </tr>
              <tr>
                <th></th>
                <th>A-Phase</th>
                <th>B-Phase</th>
                <th>C-Phase</th>
                <th>Neutral</th>
                <th>Ground</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {formData.contactResistance.map((row, index) => (
                <tr key={index}>
                  <td><input type="text" value={row.busSection} onChange={(e) => handleContactChange(index, 'busSection', e.target.value)} readOnly={!isEditing} className="table-input" /></td>
                  <td><input type="text" value={row.aPhase} onChange={(e) => handleContactChange(index, 'aPhase', e.target.value)} readOnly={!isEditing} className="table-input" /></td>
                  <td><input type="text" value={row.bPhase} onChange={(e) => handleContactChange(index, 'bPhase', e.target.value)} readOnly={!isEditing} className="table-input" /></td>
                  <td><input type="text" value={row.cPhase} onChange={(e) => handleContactChange(index, 'cPhase', e.target.value)} readOnly={!isEditing} className="table-input" /></td>
                  <td><input type="text" value={row.neutral} onChange={(e) => handleContactChange(index, 'neutral', e.target.value)} readOnly={!isEditing} className="table-input" /></td>
                  <td><input type="text" value={row.ground} onChange={(e) => handleContactChange(index, 'ground', e.target.value)} readOnly={!isEditing} className="table-input" /></td>
                  <td>
                    <select value={formData.contactUnit} onChange={(e) => handleInputChange('contactUnit', e.target.value)} disabled={!isEditing} className="table-input">
                      {CONTACT_RESISTANCE_UNITS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Electrical - Insulation Resistance Tests */}
      <div className="report-section">
        <div className="section-divider"></div>
        <h2 className="section-title">Electrical - Insulation Resistance Tests</h2>
        <table className="data-table" style={{ marginBottom: '16px' }}>
          <tbody>
            <tr>
              <td className="label-cell">Insulation Temp (°F):</td>
              <td><input type="number" value={formData.temperature.fahrenheit} onChange={(e) => handleTemperatureChange('fahrenheit', parseFloat(e.target.value) || 0)} readOnly={!isEditing} className="table-input" style={{ width: '80px' }} /></td>
              <td className="label-cell">TCF:</td>
              <td><input type="text" value={formData.temperature.tcf.toFixed(3)} readOnly className="table-input formula-field" style={{ width: '80px' }} /></td>
              <td className="label-cell">Test Voltage:</td>
              <td>
                <select value={formData.insulationTestVoltage} onChange={(e) => handleInputChange('insulationTestVoltage', e.target.value)} disabled={!isEditing} className="table-input">
                  {INSULATION_RESISTANCE_TEST_VOLTAGES.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </td>
            </tr>
          </tbody>
        </table>
        <div className="table-container" style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Bus Section</th>
                <th colSpan={9}>Insulation Resistance</th>
                <th>Units</th>
              </tr>
              <tr>
                <th></th>
                <th>A-G</th><th>B-G</th><th>C-G</th>
                <th>A-B</th><th>B-C</th><th>C-A</th>
                <th>A-N</th><th>B-N</th><th>C-N</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {formData.insulationMeasured.map((row, index) => (
                <tr key={index}>
                  <td><input type="text" value={row.busSection} onChange={(e) => handleInsulationChange(index, 'busSection', e.target.value)} readOnly={!isEditing} className="table-input" /></td>
                  <td><input type="text" value={row.ag} onChange={(e) => handleInsulationChange(index, 'ag', e.target.value)} readOnly={!isEditing} className="table-input" /></td>
                  <td><input type="text" value={row.bg} onChange={(e) => handleInsulationChange(index, 'bg', e.target.value)} readOnly={!isEditing} className="table-input" /></td>
                  <td><input type="text" value={row.cg} onChange={(e) => handleInsulationChange(index, 'cg', e.target.value)} readOnly={!isEditing} className="table-input" /></td>
                  <td><input type="text" value={row.ab} onChange={(e) => handleInsulationChange(index, 'ab', e.target.value)} readOnly={!isEditing} className="table-input" /></td>
                  <td><input type="text" value={row.bc} onChange={(e) => handleInsulationChange(index, 'bc', e.target.value)} readOnly={!isEditing} className="table-input" /></td>
                  <td><input type="text" value={row.ca} onChange={(e) => handleInsulationChange(index, 'ca', e.target.value)} readOnly={!isEditing} className="table-input" /></td>
                  <td><input type="text" value={row.an} onChange={(e) => handleInsulationChange(index, 'an', e.target.value)} readOnly={!isEditing} className="table-input" /></td>
                  <td><input type="text" value={row.bn} onChange={(e) => handleInsulationChange(index, 'bn', e.target.value)} readOnly={!isEditing} className="table-input" /></td>
                  <td><input type="text" value={row.cn} onChange={(e) => handleInsulationChange(index, 'cn', e.target.value)} readOnly={!isEditing} className="table-input" /></td>
                  <td>
                    <select value={formData.insulationUnit} onChange={(e) => handleInputChange('insulationUnit', e.target.value)} disabled={!isEditing} className="table-input">
                      {INSULATION_RESISTANCE_UNITS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Temperature Corrected Values */}
      <div className="report-section">
        <div className="section-divider"></div>
        <h2 className="section-title">Temperature Corrected Values</h2>
        <div className="table-container" style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Bus Section</th>
                <th colSpan={9}>Insulation Resistance</th>
                <th>Units</th>
              </tr>
            </thead>
            <tbody>
              {formData.tempCorrected.map((row, index) => (
                <tr key={index}>
                  <td>{row.busSection}</td>
                  <td><input type="text" value={row.ag} readOnly className="table-input formula-field" /></td>
                  <td><input type="text" value={row.bg} readOnly className="table-input formula-field" /></td>
                  <td><input type="text" value={row.cg} readOnly className="table-input formula-field" /></td>
                  <td><input type="text" value={row.ab} readOnly className="table-input formula-field" /></td>
                  <td><input type="text" value={row.bc} readOnly className="table-input formula-field" /></td>
                  <td><input type="text" value={row.ca} readOnly className="table-input formula-field" /></td>
                  <td><input type="text" value={row.an} readOnly className="table-input formula-field" /></td>
                  <td><input type="text" value={row.bn} readOnly className="table-input formula-field" /></td>
                  <td><input type="text" value={row.cn} readOnly className="table-input formula-field" /></td>
                  <td>{formData.insulationUnit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ marginTop: '8px', fontSize: '0.875rem', color: '#6b7280' }}>Table 100.1 Criteria: {formData.criteriaValue} {formData.criteriaUnits}</p>
      </div>

      {/* Electrical - Dielectric Withstand Tests */}
      <div className="report-section">
        <div className="section-divider"></div>
        <h2 className="section-title">Electrical - Dielectric Withstand Tests</h2>
        <table className="data-table" style={{ marginBottom: '16px' }}>
          <tbody>
            <tr>
              <td className="label-cell">Test Voltage:</td>
              <td>
                <select value={formData.dielectricTestVoltage} onChange={(e) => handleInputChange('dielectricTestVoltage', e.target.value)} disabled={!isEditing} className="table-input">
                  {DIELECTRIC_TEST_VOLTAGES.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </td>
              <td className="label-cell">Test Duration:</td>
              <td><input type="text" value={formData.dielectricTestDuration} onChange={(e) => handleInputChange('dielectricTestDuration', e.target.value)} readOnly={!isEditing} className="table-input" /></td>
            </tr>
          </tbody>
        </table>
        <div className="table-container" style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Bus Section</th>
                <th colSpan={3}>Dielectric Withstand</th>
                <th>Units</th>
                <th>Results</th>
              </tr>
              <tr>
                <th></th>
                <th>A-G</th><th>B-G</th><th>C-G</th>
                <th></th><th></th>
              </tr>
            </thead>
            <tbody>
              {formData.dielectricWithstand.map((row, index) => (
                <tr key={index}>
                  <td>{row.busSection}</td>
                  <td><input type="text" value={row.ag} onChange={(e) => handleDielectricChange(index, 'ag', e.target.value)} readOnly={!isEditing} className="table-input" /></td>
                  <td><input type="text" value={row.bg} onChange={(e) => handleDielectricChange(index, 'bg', e.target.value)} readOnly={!isEditing} className="table-input" /></td>
                  <td><input type="text" value={row.cg} onChange={(e) => handleDielectricChange(index, 'cg', e.target.value)} readOnly={!isEditing} className="table-input" /></td>
                  <td>
                    <select value={formData.dielectricUnit} onChange={(e) => handleInputChange('dielectricUnit', e.target.value)} disabled={!isEditing} className="table-input">
                      {DIELECTRIC_WITHSTAND_UNITS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </td>
                  <td>
                    <select value={row.result || ''} onChange={(e) => handleDielectricChange(index, 'result', e.target.value)} disabled={!isEditing} className="table-input">
                      <option value="">Select...</option>
                      <option value="PASS">PASS</option>
                      <option value="FAIL">FAIL</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Test Equipment */}
      <div className="report-section">
        <div className="section-divider"></div>
        <h2 className="section-title">Test Equipment Used</h2>
        <table className="data-table">
          <thead>
            <tr>
              <th>Equipment</th>
              <th>Name/Model</th>
              <th>Serial Number</th>
              <th>AMP ID</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="label-cell">Low Resistance Ohmmeter</td>
              <td><input type="text" value={formData.testEquipment.lowResistanceOhmmeter.name} onChange={(e) => setFormData(prev => ({ ...prev, testEquipment: { ...prev.testEquipment, lowResistanceOhmmeter: { ...prev.testEquipment.lowResistanceOhmmeter, name: e.target.value } } }))} readOnly={!isEditing} className="table-input" /></td>
              <td><input type="text" value={formData.testEquipment.lowResistanceOhmmeter.serialNumber} onChange={(e) => setFormData(prev => ({ ...prev, testEquipment: { ...prev.testEquipment, lowResistanceOhmmeter: { ...prev.testEquipment.lowResistanceOhmmeter, serialNumber: e.target.value } } }))} readOnly={!isEditing} className="table-input" /></td>
              <td><input type="text" value={formData.testEquipment.lowResistanceOhmmeter.ampId} onChange={(e) => setFormData(prev => ({ ...prev, testEquipment: { ...prev.testEquipment, lowResistanceOhmmeter: { ...prev.testEquipment.lowResistanceOhmmeter, ampId: e.target.value } } }))} readOnly={!isEditing} className="table-input" /></td>
            </tr>
            <tr>
              <td className="label-cell">Megohmmeter</td>
              <td><input type="text" value={formData.testEquipment.megohmmeter.name} onChange={(e) => setFormData(prev => ({ ...prev, testEquipment: { ...prev.testEquipment, megohmmeter: { ...prev.testEquipment.megohmmeter, name: e.target.value } } }))} readOnly={!isEditing} className="table-input" /></td>
              <td><input type="text" value={formData.testEquipment.megohmmeter.serialNumber} onChange={(e) => setFormData(prev => ({ ...prev, testEquipment: { ...prev.testEquipment, megohmmeter: { ...prev.testEquipment.megohmmeter, serialNumber: e.target.value } } }))} readOnly={!isEditing} className="table-input" /></td>
              <td><input type="text" value={formData.testEquipment.megohmmeter.ampId} onChange={(e) => setFormData(prev => ({ ...prev, testEquipment: { ...prev.testEquipment, megohmmeter: { ...prev.testEquipment.megohmmeter, ampId: e.target.value } } }))} readOnly={!isEditing} className="table-input" /></td>
            </tr>
            <tr>
              <td className="label-cell">Hipot</td>
              <td><input type="text" value={formData.testEquipment.hipot.name} onChange={(e) => setFormData(prev => ({ ...prev, testEquipment: { ...prev.testEquipment, hipot: { ...prev.testEquipment.hipot, name: e.target.value } } }))} readOnly={!isEditing} className="table-input" /></td>
              <td><input type="text" value={formData.testEquipment.hipot.serialNumber} onChange={(e) => setFormData(prev => ({ ...prev, testEquipment: { ...prev.testEquipment, hipot: { ...prev.testEquipment.hipot, serialNumber: e.target.value } } }))} readOnly={!isEditing} className="table-input" /></td>
              <td><input type="text" value={formData.testEquipment.hipot.ampId} onChange={(e) => setFormData(prev => ({ ...prev, testEquipment: { ...prev.testEquipment, hipot: { ...prev.testEquipment.hipot, ampId: e.target.value } } }))} readOnly={!isEditing} className="table-input" /></td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Comments */}
      <div className="report-section">
        <div className="section-divider"></div>
        <h2 className="section-title">Comments</h2>
        <textarea value={formData.comments} onChange={(e) => handleInputChange('comments', e.target.value)} readOnly={!isEditing} rows={6} className="comments-textarea" placeholder="Enter any additional comments..." />
      </div>
    </div>
  );
};

export default SwitchgearSwitchboardATS25Report;
