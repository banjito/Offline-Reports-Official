// PanelboardAssembliesATS25Report.tsx - 7.1.2 Panelboard Assemblies Test Sheet ATS 25
// Matches: panelboard-assemblies-ats25
// Database table: panelboard_assemblies_ats25_reports

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
const RATED_VOLTAGE_OPTIONS = ['250','480','600','1000','2500','5000','8000','15000','25000','34500','46000'];

type StatusType = 'PASS' | 'FAIL' | 'LIMITED SERVICE';

interface InsulationRowSimple { 
  section: string; 
  p1: string; 
  p2: string; 
  p3: string; 
}

interface ContactRow { 
  busSection: string; 
  aPhase: string; bPhase: string; cPhase: string; 
  neutral: string; ground: string; 
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

  insulationMeasured: InsulationRowSimple[];
  insulationUnit: string;
  insulationTestVoltage: string;
  insulationDuration: string;
  tempCorrected: InsulationRowSimple[];
  criteriaValue: string;
  criteriaUnits: string;

  contactResistance: ContactRow[];
  contactUnit: string;
  contactEvaluation: { deviation: string; criteria: string; result: StatusType | 'N/A' }[];
  contactNeutral: { criteria: string; result: StatusType | 'N/A' };
  contactGround: { criteria: string; result: StatusType | 'N/A' };
  torqueVerificationUsingLROhm: 'Yes' | 'No';

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
  '56': 5.26, '57': 5.52, '58': 5.78, '59': 6.04, '60': 6.3
};

const getTCF = (celsius: number): number => TCF_TABLE[Math.round(celsius).toString()] ?? 1;

const DEFAULT_VISUAL_ITEMS = [
  { id: '7.1.2.A.1', description: 'Compare equipment nameplate data with drawings.', result: 'Select One' },
  { id: '7.1.2.A.2', description: 'Inspect physical, electrical, and mechanical condition.', result: 'Select One' },
  { id: '7.1.2.A.3', description: 'Inspect anchorage, alignment, grounding, and required area clearances.', result: 'Select One' },
  { id: '7.1.2.A.4', description: 'Verify the unit is clean and all shipping bracing and loose parts have been removed.', result: 'Select One' },
  { id: '7.1.2.A.5', description: 'Verify that fuse and circuit breaker sizes and types correspond to drawings and coordination study.', result: 'Select One' },
  { id: '7.1.2.A.6', description: 'Verify that wiring connections are tight and secure to prevent damage during operation of moving parts.', result: 'Select One' },
  { id: '7.1.2.A.7', description: 'Verify tightness of accessible bolted electrical connections by calibrated torque-wrench method. Use manufacturer data or Table 100.12.', result: 'Select One' },
  { id: '7.1.2.A.8', description: 'Inspect insulators for evidence of physical damage or contaminated surfaces.', result: 'Select One' },
  { id: '7.1.2.A.9', description: 'Verify correct barrier installation.', result: 'Select One' },
  { id: '7.1.2.A.10', description: 'Perform visual and mechanical inspection on surge protective devices.', result: 'Select One' },
  { id: '7.1.2.A.11', description: 'Exercise all active components.', result: 'Select One' },
  { id: '7.1.2.A.12', description: '*Perform thermographic survey in accordance with Section 9.', result: 'Select One' }
];

const DEFAULT_INSULATION_ROWS: InsulationRowSimple[] = [
  { section: 'Phase to Phase', p1: '', p2: '', p3: '' },
  { section: 'Phase to Ground', p1: '', p2: '', p3: '' },
  { section: 'Phase to Neutral', p1: '', p2: '', p3: '' }
];

const initialFormData: FormData = {
  customerName: '', customerLocation: '', userName: '', date: new Date().toISOString().split('T')[0],
  identifier: '', jobNumber: '', technicians: '',
  temperature: { fahrenheit: 68, celsius: 20, tcf: 1, humidity: null },
  substation: '', eqptLocation: '', status: 'PASS',
  nameplate: { manufacturer: '', catalogNumber: '', serialNumber: '', series: '', type: '', ratedVoltage: '', systemVoltage: '', ratedCurrent: '', aicRating: '', phaseConfiguration: '' },
  visualInspectionItems: JSON.parse(JSON.stringify(DEFAULT_VISUAL_ITEMS)),
  insulationMeasured: JSON.parse(JSON.stringify(DEFAULT_INSULATION_ROWS)),
  insulationUnit: 'MΩ', insulationTestVoltage: '1000V', insulationDuration: '1 min',
  tempCorrected: JSON.parse(JSON.stringify(DEFAULT_INSULATION_ROWS)),
  criteriaValue: '≥ 25', criteriaUnits: 'MΩ',
  contactResistance: [{ busSection: 'Panelboard', aPhase: '', bPhase: '', cPhase: '', neutral: '', ground: '' }],
  contactUnit: 'µΩ',
  contactEvaluation: [{ deviation: 'N/A', criteria: '<50%', result: 'N/A' }],
  contactNeutral: { criteria: 'N/A', result: 'N/A' },
  contactGround: { criteria: 'N/A', result: 'N/A' },
  torqueVerificationUsingLROhm: 'Yes',
  testEquipment: {
    megohmmeter: { name: '', serialNumber: '', ampId: '' },
    lowResistanceOhmmeter: { name: '', serialNumber: '', ampId: '' },
    hipot: { name: '', serialNumber: '', ampId: '' }
  },
  comments: ''
};

interface PanelboardAssembliesATS25ReportProps {
  job?: any;
  reportData?: any;
  onSave?: (data: any) => void;
  isEditing?: boolean;
}

const PanelboardAssembliesATS25Report: React.FC<PanelboardAssembliesATS25ReportProps> = ({
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
      const corrected = prev.insulationMeasured.map(row => {
        const correctedRow: InsulationRowSimple = { section: row.section, p1: '', p2: '', p3: '' };
        (['p1', 'p2', 'p3'] as const).forEach(key => {
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
        manufacturer: np.manufacturer || ri.manufacturer || prev.nameplate.manufacturer,
        catalogNumber: np.catalogNumber || ri.catalogNumber || prev.nameplate.catalogNumber,
        serialNumber: np.serialNumber || ri.serialNumber || prev.nameplate.serialNumber,
        series: np.series || ri.series || prev.nameplate.series,
        type: np.type || ri.type || prev.nameplate.type,
        ratedVoltage: np.ratedVoltage || ri.ratedVoltage || prev.nameplate.ratedVoltage,
        systemVoltage: np.systemVoltage || ri.systemVoltage || prev.nameplate.systemVoltage,
        ratedCurrent: np.ratedCurrent || ri.ratedCurrent || prev.nameplate.ratedCurrent,
        aicRating: np.aicRating || ri.aicRating || prev.nameplate.aicRating,
        phaseConfiguration: np.phaseConfiguration || ri.phaseConfiguration || prev.nameplate.phaseConfiguration
      },
      visualInspectionItems: ensureArray(vmItems.length ? vmItems : data.visualInspectionItems, prev.visualInspectionItems),
      insulationMeasured: ensureArray(ir.tests || data.insulationMeasured, prev.insulationMeasured),
      insulationUnit: ir.unit || data.insulationUnit || prev.insulationUnit,
      insulationTestVoltage: ir.testVoltage || data.insulationTestVoltage || prev.insulationTestVoltage,
      insulationDuration: ir.duration || data.insulationDuration || prev.insulationDuration,
      tempCorrected: ensureArray(ir.correctedTests || data.tempCorrected, prev.tempCorrected),
      criteriaValue: ir.criteriaValue || data.criteriaValue || prev.criteriaValue,
      criteriaUnits: ir.criteriaUnits || data.criteriaUnits || prev.criteriaUnits,
      contactResistance: ensureArray(cr.tests || data.contactResistance, prev.contactResistance),
      contactUnit: cr.unit || data.contactUnit || prev.contactUnit,
      contactEvaluation: ensureArray(cr.evaluation || data.contactEvaluation, prev.contactEvaluation),
      contactNeutral: cr.neutral || data.contactNeutral || prev.contactNeutral,
      contactGround: cr.ground || data.contactGround || prev.contactGround,
      torqueVerificationUsingLROhm: ri.torqueVerificationUsingLROhm || data.torqueVerificationUsingLROhm || prev.torqueVerificationUsingLROhm,
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

  const handleInsulationChange = (index: number, field: keyof InsulationRowSimple, value: string) => {
    const newRows = [...formData.insulationMeasured];
    newRows[index] = { ...newRows[index], [field]: value };
    setFormData(prev => ({ ...prev, insulationMeasured: newRows }));
  };

  const handleContactChange = (index: number, field: keyof ContactRow, value: string) => {
    const newRows = [...formData.contactResistance];
    newRows[index] = { ...newRows[index], [field]: value };
    setFormData(prev => ({ ...prev, contactResistance: newRows }));
  };

  // Evaluate row result based on criteria
  const evaluateRowResult = (row: InsulationRowSimple): string => {
    const criteriaNum = parseFloat(formData.criteriaValue.replace(/[^0-9.]/g, '')) || 25;
    const values = [row.p1, row.p2, row.p3].filter(v => v).map(v => parseFloat(v) || 0);
    if (values.length === 0) return '';
    const allPass = values.every(v => v >= criteriaNum);
    return allPass ? 'PASS' : 'FAIL';
  };

  if (loading) {
    return <div className="report-container"><p>Loading report...</p></div>;
  }

  return (
    <div className="report-container">
      {/* Print Header */}
      <div className="print-header">
        <img 
          src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/AMP%20Logo-FdmXGeXuGBlr2AcoAFFlM8AqzmoyM1.png" 
          alt="AMP Logo" 
          className="print-logo"
        />
        <div className="print-title">
          <h1>7.1.2 Panelboard Assemblies Test Sheet ATS 25</h1>
          <p className="neta-ref">NETA - ATS 7.1.2</p>
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

      {/* Electrical - Insulation Resistance Tests */}
      <div className="report-section">
        <div className="section-divider"></div>
        <h2 className="section-title">Electrical - Insulation Resistance Tests</h2>
        <table className="data-table" style={{ marginBottom: '16px' }}>
          <tbody>
            <tr>
              <td className="label-cell">TCF:</td>
              <td><input type="text" value={formData.temperature.tcf.toFixed(3)} readOnly className="table-input formula-field" style={{ width: '80px' }} /></td>
              <td className="label-cell">Test Voltage:</td>
              <td>
                <select value={formData.insulationTestVoltage} onChange={(e) => handleInputChange('insulationTestVoltage', e.target.value)} disabled={!isEditing} className="table-input">
                  {INSULATION_RESISTANCE_TEST_VOLTAGES.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </td>
              <td className="label-cell">Duration:</td>
              <td><input type="text" value={formData.insulationDuration} onChange={(e) => handleInputChange('insulationDuration', e.target.value)} readOnly={!isEditing} className="table-input" style={{ width: '80px' }} /></td>
            </tr>
          </tbody>
        </table>
        <div className="table-container" style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Test Points</th>
                <th colSpan={3}>Measured Values</th>
                <th colSpan={3}>Temp. Corrected Values</th>
                <th>Units</th>
                <th colSpan={2}>Table 100.1 Criteria</th>
                <th>Results</th>
              </tr>
              <tr>
                <th></th>
                <th>P1 (P1-P2)</th><th>P2 (P2-P3)</th><th>P3 (P3-P1)</th>
                <th>P1 (P1-P2)</th><th>P2 (P2-P3)</th><th>P3 (P3-P1)</th>
                <th></th>
                <th>Value</th><th>Units</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {formData.insulationMeasured.map((row, index) => (
                <tr key={index}>
                  <td><input type="text" value={row.section} readOnly className="table-input" /></td>
                  <td><input type="text" value={row.p1} onChange={(e) => handleInsulationChange(index, 'p1', e.target.value)} readOnly={!isEditing} className="table-input" /></td>
                  <td><input type="text" value={row.p2} onChange={(e) => handleInsulationChange(index, 'p2', e.target.value)} readOnly={!isEditing} className="table-input" /></td>
                  <td><input type="text" value={row.p3} onChange={(e) => handleInsulationChange(index, 'p3', e.target.value)} readOnly={!isEditing} className="table-input" /></td>
                  <td><input type="text" value={formData.tempCorrected[index]?.p1 || ''} readOnly className="table-input formula-field" /></td>
                  <td><input type="text" value={formData.tempCorrected[index]?.p2 || ''} readOnly className="table-input formula-field" /></td>
                  <td><input type="text" value={formData.tempCorrected[index]?.p3 || ''} readOnly className="table-input formula-field" /></td>
                  <td>
                    <select value={formData.insulationUnit} onChange={(e) => handleInputChange('insulationUnit', e.target.value)} disabled={!isEditing} className="table-input">
                      {INSULATION_RESISTANCE_UNITS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </td>
                  <td>{formData.criteriaValue}</td>
                  <td>{formData.criteriaUnits}</td>
                  <td className={evaluateRowResult(formData.tempCorrected[index] || row) === 'PASS' ? 'status-pass-text' : evaluateRowResult(formData.tempCorrected[index] || row) === 'FAIL' ? 'status-fail-text' : ''}>
                    {evaluateRowResult(formData.tempCorrected[index] || row)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Electrical - Contact Resistance Test for Torque Verification */}
      <div className="report-section">
        <div className="section-divider"></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 className="section-title" style={{ marginBottom: 0 }}>Electrical - Contact Resistance Test for Torque Verification</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.875rem' }}>Forming Torque Verification using Low-Resistance Ohmmeter?</span>
            <select value={formData.torqueVerificationUsingLROhm} onChange={(e) => handleInputChange('torqueVerificationUsingLROhm', e.target.value)} disabled={!isEditing} className="table-input" style={{ width: '80px' }}>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
          {/* Resistance Measurements Table */}
          <div className="table-container" style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th colSpan={6}>Resistance Measurements</th>
                </tr>
                <tr>
                  <th>Pole 1</th><th>Pole 2</th><th>Pole 3</th>
                  <th>Neutral</th><th>Ground</th><th>Units</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><input type="text" value={formData.contactResistance[0]?.aPhase || ''} onChange={(e) => handleContactChange(0, 'aPhase', e.target.value)} readOnly={!isEditing} className="table-input" /></td>
                  <td><input type="text" value={formData.contactResistance[0]?.bPhase || ''} onChange={(e) => handleContactChange(0, 'bPhase', e.target.value)} readOnly={!isEditing} className="table-input" /></td>
                  <td><input type="text" value={formData.contactResistance[0]?.cPhase || ''} onChange={(e) => handleContactChange(0, 'cPhase', e.target.value)} readOnly={!isEditing} className="table-input" /></td>
                  <td><input type="text" value={formData.contactResistance[0]?.neutral || ''} onChange={(e) => handleContactChange(0, 'neutral', e.target.value)} readOnly={!isEditing} className="table-input" /></td>
                  <td><input type="text" value={formData.contactResistance[0]?.ground || ''} onChange={(e) => handleContactChange(0, 'ground', e.target.value)} readOnly={!isEditing} className="table-input" /></td>
                  <td>
                    <select value={formData.contactUnit} onChange={(e) => handleInputChange('contactUnit', e.target.value)} disabled={!isEditing} className="table-input">
                      {CONTACT_RESISTANCE_UNITS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          {/* Phase Value Deviation + Result Table */}
          <div className="table-container" style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Phase Value Deviation</th>
                  <th>Result</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ verticalAlign: 'top' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '0.75rem' }}>Measured</span>
                      <span style={{ fontWeight: 600 }}>{formData.contactEvaluation[0]?.deviation || '-'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.75rem' }}>Criteria</span>
                      <select value={formData.contactEvaluation[0]?.criteria || '<50%'} onChange={(e) => {
                        const list = [...formData.contactEvaluation];
                        list[0] = { ...(list[0] || { deviation: 'N/A', result: 'N/A' }), criteria: e.target.value };
                        setFormData(prev => ({ ...prev, contactEvaluation: list }));
                      }} disabled={!isEditing} className="table-input" style={{ width: '80px' }}>
                        <option value="<10%">&lt;10%</option>
                        <option value="<25%">&lt;25%</option>
                        <option value="<50%">&lt;50%</option>
                        <option value="<75%">&lt;75%</option>
                        <option value="<100%">&lt;100%</option>
                      </select>
                    </div>
                  </td>
                  <td style={{ verticalAlign: 'middle', textAlign: 'center' }}>
                    <select value={formData.contactEvaluation[0]?.result || 'N/A'} onChange={(e) => {
                      const list = [...formData.contactEvaluation];
                      list[0] = { ...(list[0] || { deviation: 'N/A', criteria: '<50%' }), result: e.target.value as any };
                      setFormData(prev => ({ ...prev, contactEvaluation: list }));
                    }} disabled={!isEditing} className="table-input">
                      <option value="PASS">PASS</option>
                      <option value="FAIL">FAIL</option>
                      <option value="LIMITED SERVICE">LIMITED SERVICE</option>
                      <option value="N/A">N/A</option>
                    </select>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
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

export default PanelboardAssembliesATS25Report;

