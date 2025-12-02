// SmallLVDryTypeTransformerATS25Report.tsx - 7.2.1.1 Small Low Voltage Dry Type Transformer Test Sheet ATS 25
// Matches: small-lv-dry-type-transformer-ats25
// Database table: small_lv_dry_type_transformer_ats25_reports

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
const WINDING_CONNECTIONS = ['Delta', 'Wye', 'Single Phase'];
const WINDING_MATERIALS = ['', 'Copper', 'Aluminum'];
const TAP_POSITIONS = ['1', '2', '3', '4', '5', '6', '7'];

type StatusType = 'PASS' | 'FAIL' | 'LIMITED SERVICE';

interface InsulationRow {
  windingUnderTest: string;
  measured05Min: string;
  measured1Min: string;
  corrected05Min: string;
  corrected1Min: string;
}

interface TurnsRatioRow {
  primaryWinding: string;
  measuredRatio: string;
  percentDeviation: string;
  result: 'Pass' | 'Fail' | '';
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
    kva: string;
    tempRise: string;
    impedance: string;
    primaryVoltage1: string;
    primaryVoltage2: string;
    secondaryVoltage1: string;
    secondaryVoltage2: string;
    primaryWindingConnection: string;
    secondaryWindingConnection: string;
    primaryWindingMaterial: string;
    secondaryWindingMaterial: string;
    tapVoltage1: string;
    tapVoltage2: string;
    tapVoltage3: string;
    tapVoltage4: string;
    tapVoltage5: string;
    tapVoltage6: string;
    tapVoltage7: string;
    tapPositionLeft: string;
  };

  visualInspectionItems: Array<{ id: string; description: string; result: string }>;

  insulationTemperature: string;
  insulationTestVoltage: string;
  insulationDuration: string;
  insulationUnit: string;
  insulationRows: InsulationRow[];
  insulationCriteriaValue: string;
  insulationCriteriaUnits: string;
  dielectricAbsorptionRatio: {
    priToGnd: string;
    secToGnd: string;
    priToSec: string;
    criteria: string;
    result: 'Pass' | 'Fail' | '';
  };

  turnsRatio: {
    tapUnderTest: string;
    primaryWindingVoltage: string;
    secondaryWindingVoltage: string;
    calculatedRatio: string;
    rows: TurnsRatioRow[];
    differenceBetweenMR: string;
    differenceResult: 'Pass' | 'Fail' | '';
  };

  testEquipment: {
    megohmmeter: { name: string; serialNumber: string; ampId: string };
    ttrTestSet: { name: string; serialNumber: string; ampId: string };
  };
  comments: string;
}

// TCF table keyed by rounded °C
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
  { id: '7.2.1.1.A.1', description: 'Compare equipment nameplate data with drawings.', result: 'Select One' },
  { id: '7.2.1.1.A.2', description: 'Inspect physical and mechanical condition.', result: 'Select One' },
  { id: '7.2.1.1.A.3', description: 'Inspect anchorage, alignment, and grounding.', result: 'Select One' },
  { id: '7.2.1.1.A.4', description: 'Verify that resilient mounts are free and that any shipping brackets have been removed.', result: 'Select One' },
  { id: '7.2.1.1.A.5', description: 'Verify the unit is clean.', result: 'Select One' },
  { id: '7.2.1.1.A.6', description: 'Verify tightness of accessible bolted electrical connections by calibrated torque-wrench method.', result: 'Select One' },
  { id: '7.2.1.1.A.7', description: 'Verify that as-left tap connections are as specified.', result: 'Select One' },
  { id: '7.2.1.1.A.8', description: '*Perform thermographic survey in accordance with Section 9.', result: 'Select One' }
];

const DEFAULT_INSULATION_ROWS: InsulationRow[] = [
  { windingUnderTest: 'Primary to Ground', measured05Min: '', measured1Min: '', corrected05Min: '', corrected1Min: '' },
  { windingUnderTest: 'Secondary to Ground', measured05Min: '', measured1Min: '', corrected05Min: '', corrected1Min: '' },
  { windingUnderTest: 'Primary to Secondary', measured05Min: '', measured1Min: '', corrected05Min: '', corrected1Min: '' }
];

const DEFAULT_TURNS_RATIO_ROWS: TurnsRatioRow[] = [
  { primaryWinding: 'H0-H1', measuredRatio: '', percentDeviation: '', result: '' },
  { primaryWinding: 'H0-H2', measuredRatio: '', percentDeviation: '', result: '' },
  { primaryWinding: 'H0-H3', measuredRatio: '', percentDeviation: '', result: '' }
];

const initialFormData: FormData = {
  customerName: '', customerLocation: '', userName: '', date: new Date().toISOString().split('T')[0],
  identifier: '', jobNumber: '', technicians: '',
  temperature: { fahrenheit: 68, celsius: 20, tcf: 1, humidity: null },
  substation: '', eqptLocation: '', status: 'PASS',
  nameplate: {
    manufacturer: '', catalogNumber: '', serialNumber: '', kva: '', tempRise: '', impedance: '',
    primaryVoltage1: '', primaryVoltage2: '', secondaryVoltage1: '', secondaryVoltage2: '',
    primaryWindingConnection: 'Delta', secondaryWindingConnection: 'Wye', primaryWindingMaterial: '', secondaryWindingMaterial: '',
    tapVoltage1: '', tapVoltage2: '', tapVoltage3: '', tapVoltage4: '', tapVoltage5: '', tapVoltage6: '', tapVoltage7: '',
    tapPositionLeft: ''
  },
  visualInspectionItems: JSON.parse(JSON.stringify(DEFAULT_VISUAL_ITEMS)),
  insulationTemperature: '',
  insulationTestVoltage: '1000V',
  insulationDuration: '1 min',
  insulationUnit: 'MΩ',
  insulationRows: JSON.parse(JSON.stringify(DEFAULT_INSULATION_ROWS)),
  insulationCriteriaValue: '≥ 500',
  insulationCriteriaUnits: 'MΩ',
  dielectricAbsorptionRatio: { priToGnd: '', secToGnd: '', priToSec: '', criteria: '≥ 1.00', result: '' },
  turnsRatio: {
    tapUnderTest: '3',
    primaryWindingVoltage: '480.00',
    secondaryWindingVoltage: '120.00',
    calculatedRatio: '4.0000',
    rows: JSON.parse(JSON.stringify(DEFAULT_TURNS_RATIO_ROWS)),
    differenceBetweenMR: '',
    differenceResult: ''
  },
  testEquipment: {
    megohmmeter: { name: '', serialNumber: '', ampId: '' },
    ttrTestSet: { name: '', serialNumber: '', ampId: '' }
  },
  comments: ''
};

interface SmallLVDryTypeTransformerATS25ReportProps {
  job?: any;
  reportData?: any;
  onSave?: (data: any) => void;
  isEditing?: boolean;
}

const SmallLVDryTypeTransformerATS25Report: React.FC<SmallLVDryTypeTransformerATS25ReportProps> = ({
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
    setFormData(prev => ({
      ...prev,
      temperature: { ...prev.temperature, tcf },
      insulationRows: prev.insulationRows.map(row => ({
        ...row,
        corrected05Min: row.measured05Min ? (parseFloat(row.measured05Min) * tcf).toFixed(2) : '',
        corrected1Min: row.measured1Min ? (parseFloat(row.measured1Min) * tcf).toFixed(2) : ''
      }))
    }));
  }, [formData.temperature.celsius]);

  // Auto-calculate turns ratio
  useEffect(() => {
    const primary = parseFloat(formData.turnsRatio.primaryWindingVoltage) || 0;
    const secondary = parseFloat(formData.turnsRatio.secondaryWindingVoltage) || 0;
    const calculatedRatio = secondary > 0 ? (primary / secondary).toFixed(4) : '';
    
    setFormData(prev => ({
      ...prev,
      turnsRatio: {
        ...prev.turnsRatio,
        calculatedRatio,
        rows: prev.turnsRatio.rows.map(row => {
          const measured = parseFloat(row.measuredRatio) || 0;
          const calc = parseFloat(calculatedRatio) || 0;
          const deviation = calc > 0 ? (((measured - calc) / calc) * 100).toFixed(2) : '';
          const result = deviation && Math.abs(parseFloat(deviation)) <= 0.5 ? 'Pass' : (deviation ? 'Fail' : '');
          return { ...row, percentDeviation: deviation, result: result as 'Pass' | 'Fail' | '' };
        })
      }
    }));
  }, [formData.turnsRatio.primaryWindingVoltage, formData.turnsRatio.secondaryWindingVoltage, formData.turnsRatio.rows.map(r => r.measuredRatio).join(',')]);

  const loadFromProps = (data: any) => {
    const reportInfo = data.report_info || {};
    const vm = data.visual_mechanical || {};
    const vmItems = vm.items || data.visualInspectionItems || [];
    const ir = data.insulation_resistance || {};
    const tr = data.turns_ratio || data.turnsRatio || {};
    const te = data.test_equipment || data.testEquipment || reportInfo.testEquipment || {};

    setFormData(prev => ({
      ...prev,
      customerName: reportInfo.customer || data.customerName || prev.customerName,
      customerLocation: reportInfo.address || data.customerLocation || prev.customerLocation,
      userName: reportInfo.userName || data.userName || prev.userName,
      date: reportInfo.date || data.date || prev.date,
      technicians: reportInfo.technicians || data.technicians || prev.technicians,
      identifier: reportInfo.identifier || data.identifier || prev.identifier,
      substation: reportInfo.substation || data.substation || prev.substation,
      eqptLocation: reportInfo.eqptLocation || data.eqptLocation || prev.eqptLocation,
      temperature: reportInfo.temperature || data.temperature || prev.temperature,
      status: reportInfo.status || data.status || prev.status,
      nameplate: reportInfo.nameplate || data.nameplate || prev.nameplate,
      visualInspectionItems: vmItems.length ? vmItems : prev.visualInspectionItems,
      insulationTemperature: ir.insulationTemperature || data.insulationTemperature || prev.insulationTemperature,
      insulationTestVoltage: ir.testVoltage || data.insulationTestVoltage || prev.insulationTestVoltage,
      insulationDuration: ir.duration || data.insulationDuration || prev.insulationDuration,
      insulationUnit: ir.unit || data.insulationUnit || prev.insulationUnit,
      insulationRows: ir.rows || data.insulationRows || prev.insulationRows,
      insulationCriteriaValue: ir.criteriaValue || data.insulationCriteriaValue || prev.insulationCriteriaValue,
      insulationCriteriaUnits: ir.criteriaUnits || data.insulationCriteriaUnits || prev.insulationCriteriaUnits,
      dielectricAbsorptionRatio: ir.dielectricAbsorptionRatio || data.dielectricAbsorptionRatio || prev.dielectricAbsorptionRatio,
      turnsRatio: tr.tapUnderTest ? tr : (data.turnsRatio || prev.turnsRatio),
      testEquipment: te.megohmmeter ? te : prev.testEquipment,
      comments: data.comments || prev.comments
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
    
    setFormData(prev => ({
      ...prev,
      temperature: { ...prev.temperature, fahrenheit, celsius }
    }));
  };

  const handleVisualInspectionChange = (index: number, result: string) => {
    const newItems = [...formData.visualInspectionItems];
    newItems[index] = { ...newItems[index], result };
    setFormData(prev => ({ ...prev, visualInspectionItems: newItems }));
  };

  const handleInsulationRowChange = (index: number, field: keyof InsulationRow, value: string) => {
    const newRows = [...formData.insulationRows];
    newRows[index] = { ...newRows[index], [field]: value };
    setFormData(prev => ({ ...prev, insulationRows: newRows }));
  };

  const handleTurnsRatioRowChange = (index: number, field: keyof TurnsRatioRow, value: string) => {
    const newRows = [...formData.turnsRatio.rows];
    newRows[index] = { ...newRows[index], [field]: value };
    setFormData(prev => ({
      ...prev,
      turnsRatio: { ...prev.turnsRatio, rows: newRows }
    }));
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
          <h1>7.2.1.1 Small Low Voltage Dry Type Transformer Test Sheet ATS 25</h1>
          <p className="neta-ref">NETA - ATS 7.2.1.1</p>
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
              <td className="label-cell">Substation:</td>
              <td><input type="text" value={formData.substation} onChange={(e) => handleInputChange('substation', e.target.value)} readOnly={!isEditing} className="table-input" /></td>
              <td className="label-cell">Equipment Location:</td>
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

      {/* Temperature */}
      <div className="report-section">
        <div className="section-divider"></div>
        <h2 className="section-title">Environmental Conditions</h2>
        <table className="data-table">
          <tbody>
            <tr>
              <td className="label-cell">Temperature (°F):</td>
              <td><input type="number" value={formData.temperature.fahrenheit} onChange={(e) => handleTemperatureChange('fahrenheit', parseFloat(e.target.value) || 0)} readOnly={!isEditing} className="table-input" /></td>
              <td className="label-cell">Temperature (°C):</td>
              <td><input type="number" value={formData.temperature.celsius} onChange={(e) => handleTemperatureChange('celsius', parseFloat(e.target.value) || 0)} readOnly={!isEditing} className="table-input" /></td>
              <td className="label-cell">TCF:</td>
              <td><input type="text" value={formData.temperature.tcf.toFixed(3)} readOnly className="table-input formula-field" /></td>
              <td className="label-cell">Humidity (%):</td>
              <td><input type="number" value={formData.temperature.humidity ?? ''} onChange={(e) => handleNestedChange('temperature', 'humidity', parseFloat(e.target.value) || null)} readOnly={!isEditing} className="table-input" /></td>
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
              <td className="label-cell">Catalog Number:</td>
              <td><input type="text" value={formData.nameplate.catalogNumber} onChange={(e) => handleNestedChange('nameplate', 'catalogNumber', e.target.value)} readOnly={!isEditing} className="table-input" /></td>
            </tr>
            <tr>
              <td className="label-cell">Serial Number:</td>
              <td><input type="text" value={formData.nameplate.serialNumber} onChange={(e) => handleNestedChange('nameplate', 'serialNumber', e.target.value)} readOnly={!isEditing} className="table-input" /></td>
              <td className="label-cell">KVA:</td>
              <td><input type="text" value={formData.nameplate.kva} onChange={(e) => handleNestedChange('nameplate', 'kva', e.target.value)} readOnly={!isEditing} className="table-input" /></td>
            </tr>
            <tr>
              <td className="label-cell">Temp Rise:</td>
              <td><input type="text" value={formData.nameplate.tempRise} onChange={(e) => handleNestedChange('nameplate', 'tempRise', e.target.value)} readOnly={!isEditing} className="table-input" /></td>
              <td className="label-cell">Impedance (%):</td>
              <td><input type="text" value={formData.nameplate.impedance} onChange={(e) => handleNestedChange('nameplate', 'impedance', e.target.value)} readOnly={!isEditing} className="table-input" /></td>
            </tr>
            <tr>
              <td className="label-cell">Primary Voltage 1:</td>
              <td><input type="text" value={formData.nameplate.primaryVoltage1} onChange={(e) => handleNestedChange('nameplate', 'primaryVoltage1', e.target.value)} readOnly={!isEditing} className="table-input" /></td>
              <td className="label-cell">Primary Voltage 2:</td>
              <td><input type="text" value={formData.nameplate.primaryVoltage2} onChange={(e) => handleNestedChange('nameplate', 'primaryVoltage2', e.target.value)} readOnly={!isEditing} className="table-input" /></td>
            </tr>
            <tr>
              <td className="label-cell">Secondary Voltage 1:</td>
              <td><input type="text" value={formData.nameplate.secondaryVoltage1} onChange={(e) => handleNestedChange('nameplate', 'secondaryVoltage1', e.target.value)} readOnly={!isEditing} className="table-input" /></td>
              <td className="label-cell">Secondary Voltage 2:</td>
              <td><input type="text" value={formData.nameplate.secondaryVoltage2} onChange={(e) => handleNestedChange('nameplate', 'secondaryVoltage2', e.target.value)} readOnly={!isEditing} className="table-input" /></td>
            </tr>
            <tr>
              <td className="label-cell">Primary Winding:</td>
              <td>
                <select value={formData.nameplate.primaryWindingConnection} onChange={(e) => handleNestedChange('nameplate', 'primaryWindingConnection', e.target.value)} disabled={!isEditing} className="table-input">
                  {WINDING_CONNECTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </td>
              <td className="label-cell">Secondary Winding:</td>
              <td>
                <select value={formData.nameplate.secondaryWindingConnection} onChange={(e) => handleNestedChange('nameplate', 'secondaryWindingConnection', e.target.value)} disabled={!isEditing} className="table-input">
                  {WINDING_CONNECTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Tap Configuration */}
      <div className="report-section">
        <div className="section-divider"></div>
        <h2 className="section-title">Tap Configuration</h2>
        <table className="data-table">
          <thead>
            <tr>
              <th>Tap 1</th>
              <th>Tap 2</th>
              <th>Tap 3</th>
              <th>Tap 4</th>
              <th>Tap 5</th>
              <th>Tap 6</th>
              <th>Tap 7</th>
              <th>Tap Position Left</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><input type="text" value={formData.nameplate.tapVoltage1} onChange={(e) => handleNestedChange('nameplate', 'tapVoltage1', e.target.value)} readOnly={!isEditing} className="table-input" /></td>
              <td><input type="text" value={formData.nameplate.tapVoltage2} onChange={(e) => handleNestedChange('nameplate', 'tapVoltage2', e.target.value)} readOnly={!isEditing} className="table-input" /></td>
              <td><input type="text" value={formData.nameplate.tapVoltage3} onChange={(e) => handleNestedChange('nameplate', 'tapVoltage3', e.target.value)} readOnly={!isEditing} className="table-input" /></td>
              <td><input type="text" value={formData.nameplate.tapVoltage4} onChange={(e) => handleNestedChange('nameplate', 'tapVoltage4', e.target.value)} readOnly={!isEditing} className="table-input" /></td>
              <td><input type="text" value={formData.nameplate.tapVoltage5} onChange={(e) => handleNestedChange('nameplate', 'tapVoltage5', e.target.value)} readOnly={!isEditing} className="table-input" /></td>
              <td><input type="text" value={formData.nameplate.tapVoltage6} onChange={(e) => handleNestedChange('nameplate', 'tapVoltage6', e.target.value)} readOnly={!isEditing} className="table-input" /></td>
              <td><input type="text" value={formData.nameplate.tapVoltage7} onChange={(e) => handleNestedChange('nameplate', 'tapVoltage7', e.target.value)} readOnly={!isEditing} className="table-input" /></td>
              <td>
                <select value={formData.nameplate.tapPositionLeft} onChange={(e) => handleNestedChange('nameplate', 'tapPositionLeft', e.target.value)} disabled={!isEditing} className="table-input">
                  <option value="">Select...</option>
                  {TAP_POSITIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </td>
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
              <th style={{ width: '100px' }}>Item</th>
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

      {/* Insulation Resistance Test */}
      <div className="report-section">
        <div className="section-divider"></div>
        <h2 className="section-title">Insulation Resistance Test</h2>
        <table className="data-table" style={{ marginBottom: '16px' }}>
          <tbody>
            <tr>
              <td className="label-cell">Insulation Temp (°C):</td>
              <td><input type="text" value={formData.insulationTemperature} onChange={(e) => handleInputChange('insulationTemperature', e.target.value)} readOnly={!isEditing} className="table-input" /></td>
              <td className="label-cell">Test Voltage:</td>
              <td>
                <select value={formData.insulationTestVoltage} onChange={(e) => handleInputChange('insulationTestVoltage', e.target.value)} disabled={!isEditing} className="table-input">
                  {INSULATION_RESISTANCE_TEST_VOLTAGES.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </td>
              <td className="label-cell">Unit:</td>
              <td>
                <select value={formData.insulationUnit} onChange={(e) => handleInputChange('insulationUnit', e.target.value)} disabled={!isEditing} className="table-input">
                  {INSULATION_RESISTANCE_UNITS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </td>
            </tr>
          </tbody>
        </table>
        <div className="table-container" style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th rowSpan={2}>Winding Under Test</th>
                <th colSpan={2}>Measured ({formData.insulationUnit})</th>
                <th colSpan={2}>Corrected to 20°C ({formData.insulationUnit})</th>
              </tr>
              <tr>
                <th>0.5 min</th>
                <th>1 min</th>
                <th>0.5 min</th>
                <th>1 min</th>
              </tr>
            </thead>
            <tbody>
              {formData.insulationRows.map((row, index) => (
                <tr key={index}>
                  <td><input type="text" value={row.windingUnderTest} onChange={(e) => handleInsulationRowChange(index, 'windingUnderTest', e.target.value)} readOnly={!isEditing} className="table-input" /></td>
                  <td><input type="text" value={row.measured05Min} onChange={(e) => handleInsulationRowChange(index, 'measured05Min', e.target.value)} readOnly={!isEditing} className="table-input" /></td>
                  <td><input type="text" value={row.measured1Min} onChange={(e) => handleInsulationRowChange(index, 'measured1Min', e.target.value)} readOnly={!isEditing} className="table-input" /></td>
                  <td><input type="text" value={row.corrected05Min} readOnly className="table-input formula-field" /></td>
                  <td><input type="text" value={row.corrected1Min} readOnly className="table-input formula-field" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ marginTop: '8px', fontSize: '0.875rem', color: '#6b7280' }}>Criteria: {formData.insulationCriteriaValue} {formData.insulationCriteriaUnits}</p>
      </div>

      {/* Dielectric Absorption Ratio */}
      <div className="report-section">
        <div className="section-divider"></div>
        <h2 className="section-title">Dielectric Absorption Ratio (1min/30sec)</h2>
        <table className="data-table">
          <thead>
            <tr>
              <th>Pri to Gnd</th>
              <th>Sec to Gnd</th>
              <th>Pri to Sec</th>
              <th>Criteria</th>
              <th>Result</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><input type="text" value={formData.dielectricAbsorptionRatio.priToGnd} onChange={(e) => handleNestedChange('dielectricAbsorptionRatio', 'priToGnd', e.target.value)} readOnly={!isEditing} className="table-input" /></td>
              <td><input type="text" value={formData.dielectricAbsorptionRatio.secToGnd} onChange={(e) => handleNestedChange('dielectricAbsorptionRatio', 'secToGnd', e.target.value)} readOnly={!isEditing} className="table-input" /></td>
              <td><input type="text" value={formData.dielectricAbsorptionRatio.priToSec} onChange={(e) => handleNestedChange('dielectricAbsorptionRatio', 'priToSec', e.target.value)} readOnly={!isEditing} className="table-input" /></td>
              <td><input type="text" value={formData.dielectricAbsorptionRatio.criteria} onChange={(e) => handleNestedChange('dielectricAbsorptionRatio', 'criteria', e.target.value)} readOnly={!isEditing} className="table-input" /></td>
              <td>
                <select value={formData.dielectricAbsorptionRatio.result} onChange={(e) => handleNestedChange('dielectricAbsorptionRatio', 'result', e.target.value)} disabled={!isEditing} className="table-input">
                  <option value="">Select...</option>
                  <option value="Pass">Pass</option>
                  <option value="Fail">Fail</option>
                </select>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Turns Ratio Test */}
      <div className="report-section">
        <div className="section-divider"></div>
        <h2 className="section-title">Turns Ratio Test</h2>
        <table className="data-table" style={{ marginBottom: '16px' }}>
          <tbody>
            <tr>
              <td className="label-cell">Tap Under Test:</td>
              <td>
                <select value={formData.turnsRatio.tapUnderTest} onChange={(e) => handleNestedChange('turnsRatio', 'tapUnderTest', e.target.value)} disabled={!isEditing} className="table-input">
                  {TAP_POSITIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </td>
              <td className="label-cell">Primary Winding Voltage:</td>
              <td><input type="text" value={formData.turnsRatio.primaryWindingVoltage} onChange={(e) => handleNestedChange('turnsRatio', 'primaryWindingVoltage', e.target.value)} readOnly={!isEditing} className="table-input" /></td>
            </tr>
            <tr>
              <td className="label-cell">Secondary Winding Voltage:</td>
              <td><input type="text" value={formData.turnsRatio.secondaryWindingVoltage} onChange={(e) => handleNestedChange('turnsRatio', 'secondaryWindingVoltage', e.target.value)} readOnly={!isEditing} className="table-input" /></td>
              <td className="label-cell">Calculated Ratio:</td>
              <td><input type="text" value={formData.turnsRatio.calculatedRatio} readOnly className="table-input formula-field" /></td>
            </tr>
          </tbody>
        </table>
        <table className="data-table">
          <thead>
            <tr>
              <th>Primary Winding</th>
              <th>Measured Ratio</th>
              <th>% Deviation</th>
              <th>Result</th>
            </tr>
          </thead>
          <tbody>
            {formData.turnsRatio.rows.map((row, index) => (
              <tr key={index}>
                <td><input type="text" value={row.primaryWinding} onChange={(e) => handleTurnsRatioRowChange(index, 'primaryWinding', e.target.value)} readOnly={!isEditing} className="table-input" /></td>
                <td><input type="text" value={row.measuredRatio} onChange={(e) => handleTurnsRatioRowChange(index, 'measuredRatio', e.target.value)} readOnly={!isEditing} className="table-input" /></td>
                <td><input type="text" value={row.percentDeviation} readOnly className="table-input formula-field" /></td>
                <td><input type="text" value={row.result} readOnly className={`table-input ${row.result === 'Pass' ? 'status-pass' : row.result === 'Fail' ? 'status-fail' : ''}`} /></td>
              </tr>
            ))}
          </tbody>
        </table>
        <table className="data-table" style={{ marginTop: '16px' }}>
          <tbody>
            <tr>
              <td className="label-cell">Difference Between Measured Ratios (%):</td>
              <td><input type="text" value={formData.turnsRatio.differenceBetweenMR} onChange={(e) => handleNestedChange('turnsRatio', 'differenceBetweenMR', e.target.value)} readOnly={!isEditing} className="table-input" /></td>
              <td className="label-cell">Result:</td>
              <td>
                <select value={formData.turnsRatio.differenceResult} onChange={(e) => handleNestedChange('turnsRatio', 'differenceResult', e.target.value)} disabled={!isEditing} className="table-input">
                  <option value="">Select...</option>
                  <option value="Pass">Pass</option>
                  <option value="Fail">Fail</option>
                </select>
              </td>
            </tr>
          </tbody>
        </table>
        <p style={{ marginTop: '8px', fontSize: '0.875rem', color: '#6b7280' }}>Criteria: ≤ 0.5% deviation from calculated ratio</p>
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
              <td className="label-cell">Megohmmeter</td>
              <td><input type="text" value={formData.testEquipment.megohmmeter.name} onChange={(e) => setFormData(prev => ({ ...prev, testEquipment: { ...prev.testEquipment, megohmmeter: { ...prev.testEquipment.megohmmeter, name: e.target.value } } }))} readOnly={!isEditing} className="table-input" /></td>
              <td><input type="text" value={formData.testEquipment.megohmmeter.serialNumber} onChange={(e) => setFormData(prev => ({ ...prev, testEquipment: { ...prev.testEquipment, megohmmeter: { ...prev.testEquipment.megohmmeter, serialNumber: e.target.value } } }))} readOnly={!isEditing} className="table-input" /></td>
              <td><input type="text" value={formData.testEquipment.megohmmeter.ampId} onChange={(e) => setFormData(prev => ({ ...prev, testEquipment: { ...prev.testEquipment, megohmmeter: { ...prev.testEquipment.megohmmeter, ampId: e.target.value } } }))} readOnly={!isEditing} className="table-input" /></td>
            </tr>
            <tr>
              <td className="label-cell">TTR Test Set</td>
              <td><input type="text" value={formData.testEquipment.ttrTestSet.name} onChange={(e) => setFormData(prev => ({ ...prev, testEquipment: { ...prev.testEquipment, ttrTestSet: { ...prev.testEquipment.ttrTestSet, name: e.target.value } } }))} readOnly={!isEditing} className="table-input" /></td>
              <td><input type="text" value={formData.testEquipment.ttrTestSet.serialNumber} onChange={(e) => setFormData(prev => ({ ...prev, testEquipment: { ...prev.testEquipment, ttrTestSet: { ...prev.testEquipment.ttrTestSet, serialNumber: e.target.value } } }))} readOnly={!isEditing} className="table-input" /></td>
              <td><input type="text" value={formData.testEquipment.ttrTestSet.ampId} onChange={(e) => setFormData(prev => ({ ...prev, testEquipment: { ...prev.testEquipment, ttrTestSet: { ...prev.testEquipment.ttrTestSet, ampId: e.target.value } } }))} readOnly={!isEditing} className="table-input" /></td>
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

export default SmallLVDryTypeTransformerATS25Report;

