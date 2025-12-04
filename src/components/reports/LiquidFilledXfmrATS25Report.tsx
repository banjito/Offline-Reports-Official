// LiquidFilledXfmrATS25Report.tsx - 7.2.2 Liquid Filled Xfmr. Visual, Mechanical, Insulation Resistance Test ATS 25
// Matches: liquid-filled-xfmr-ats25
// Database table: liquid_filled_xfmr_ats25_reports

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
  testVoltage: string;
  measured05Min: string;
  measured1Min: string;
  measured10Min: string;
  corrected05Min: string;
  corrected1Min: string;
  corrected10Min: string;
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

  indicatorGaugeValues: {
    oilLevel: string;
    tankPressure: string;
    oilTemperature: string;
    windingTemperature: string;
    oilTempRange: string;
    windingTempRange: string;
  };

  insulationTemperature: string;
  insulationUnit: string;
  insulationRows: InsulationRow[];
  dielectricAbsorption: {
    primary: string;
    secondary: string;
    priToSec: string;
    acceptable: 'Pass' | 'Fail' | '';
  };
  polarizationIndex: {
    primary: string;
    secondary: string;
    priToSec: string;
    acceptable: 'Pass' | 'Fail' | '';
  };

  testEquipment: {
    megohmmeter: { name: string; serialNumber: string; ampId: string };
    ttrTestSet: { name: string; serialNumber: string; ampId: string };
  };
  visualMechanicalComments: string;
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
  { id: '7.2.2.A.1', description: 'Compare equipment nameplate data with drawings.', result: 'Select One' },
  { id: '7.2.2.A.2', description: 'Inspect physical and mechanical condition.', result: 'Select One' },
  { id: '7.2.2.A.3', description: 'Inspect impact recorder prior to unloading.', result: 'Select One' },
  { id: '7.2.2.A.5', description: 'Inspect anchorage, alignment, and grounding.', result: 'Select One' },
  { id: '7.2.2.A.6', description: 'Verify the presence of PCB content labeling.', result: 'Select One' },
  { id: '7.2.2.A.7', description: 'Verify removal of any shipping bracing after placement.', result: 'Select One' },
  { id: '7.2.2.A.8', description: 'Verify the bushings are clean.', result: 'Select One' },
  { id: '7.2.2.A.9', description: 'Verify that alarm, control, and trip settings on temperature and level indicators are as specified.', result: 'Select One' },
  { id: '7.2.2.A.10', description: 'Verify operation of alarm, control, and trip circuits from temperature and level indicators, pressure relief device, gas accumulator, and fault pressure relay.', result: 'Select One' },
  { id: '7.2.2.A.11', description: 'Verify that cooling fans and pumps operate correctly and have appropriate overcurrent protection.', result: 'Select One' },
  { id: '7.2.2.A.12', description: 'Verify tightness of accessible bolted electrical connections by calibrated torque-wrench method.', result: 'Select One' },
  { id: '7.2.2.A.13', description: 'Verify correct liquid level in tanks and bushings.', result: 'Select One' },
  { id: '7.2.2.A.14', description: 'Verify valves are in the correct operating position.', result: 'Select One' },
  { id: '7.2.2.A.15', description: 'Verify that positive pressure is maintained on gas-blanketed transformers.', result: 'Select One' },
  { id: '7.2.2.A.16', description: 'Perform inspections and mechanical tests as recommended by the manufacturer.', result: 'Select One' },
  { id: '7.2.2.A.17', description: 'Test load tap-changer in accordance with Section 7.12.3.', result: 'Select One' },
  { id: '7.2.2.A.18', description: 'Verify presence of transformer surge arresters.', result: 'Select One' },
  { id: '7.2.2.A.19', description: 'Verify de-energized tap-changer position is left as specified.', result: 'Select One' }
];

const DEFAULT_INSULATION_ROWS: InsulationRow[] = [
  { windingUnderTest: 'Primary to Ground', testVoltage: '5000V', measured05Min: '', measured1Min: '', measured10Min: '', corrected05Min: '', corrected1Min: '', corrected10Min: '' },
  { windingUnderTest: 'Secondary to Ground', testVoltage: '1000V', measured05Min: '', measured1Min: '', measured10Min: '', corrected05Min: '', corrected1Min: '', corrected10Min: '' },
  { windingUnderTest: 'Primary to Secondary', testVoltage: '5000V', measured05Min: '', measured1Min: '', measured10Min: '', corrected05Min: '', corrected1Min: '', corrected10Min: '' }
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
  indicatorGaugeValues: {
    oilLevel: '', tankPressure: '', oilTemperature: '', windingTemperature: '', oilTempRange: '', windingTempRange: ''
  },
  insulationTemperature: '',
  insulationUnit: 'MΩ',
  insulationRows: JSON.parse(JSON.stringify(DEFAULT_INSULATION_ROWS)),
  dielectricAbsorption: { primary: '', secondary: '', priToSec: '', acceptable: '' },
  polarizationIndex: { primary: '', secondary: '', priToSec: '', acceptable: '' },
  testEquipment: {
    megohmmeter: { name: '', serialNumber: '', ampId: '' },
    ttrTestSet: { name: '', serialNumber: '', ampId: '' }
  },
  visualMechanicalComments: '',
  comments: ''
};

interface LiquidFilledXfmrATS25ReportProps {
  job?: any;
  reportData?: any;
  onSave?: (data: any) => void;
  isEditing?: boolean;
}

const LiquidFilledXfmrATS25Report: React.FC<LiquidFilledXfmrATS25ReportProps> = ({
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

  // Auto-calculate corrected values when temperature or measured values change
  useEffect(() => {
    const tcf = getTCF(formData.temperature.celsius);
    setFormData(prev => {
      const rows = Array.isArray(prev.insulationRows) ? prev.insulationRows : initialFormData.insulationRows;
      return {
        ...prev,
        temperature: { ...prev.temperature, tcf },
        insulationRows: rows.map(row => ({
          ...row,
          corrected05Min: row.measured05Min ? (parseFloat(row.measured05Min) * tcf).toFixed(2) : '',
          corrected1Min: row.measured1Min ? (parseFloat(row.measured1Min) * tcf).toFixed(2) : '',
          corrected10Min: row.measured10Min ? (parseFloat(row.measured10Min) * tcf).toFixed(2) : ''
        }))
      };
    });
  }, [formData.temperature.celsius, (formData.insulationRows || []).map(r => r.measured05Min + r.measured1Min + r.measured10Min).join(',')]);

  const loadFromProps = (data: any) => {
    const reportInfo = data.report_info || {};
    const vm = data.visual_mechanical || {};
    const vmItems = vm.items || data.visualInspectionItems || [];
    const ir = data.insulation_resistance || {};
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
      indicatorGaugeValues: reportInfo.indicatorGaugeValues || data.indicatorGaugeValues || prev.indicatorGaugeValues,
      visualInspectionItems: vmItems.length ? vmItems : prev.visualInspectionItems,
      visualMechanicalComments: vm.comments || data.visualMechanicalComments || prev.visualMechanicalComments,
      insulationTemperature: ir.insulationTemperature || data.insulationTemperature || prev.insulationTemperature,
      insulationUnit: ir.unit || data.insulationUnit || prev.insulationUnit,
      insulationRows: ir.rows || data.insulationRows || prev.insulationRows,
      dielectricAbsorption: ir.dielectricAbsorption || data.dielectricAbsorption || prev.dielectricAbsorption,
      polarizationIndex: ir.polarizationIndex || data.polarizationIndex || prev.polarizationIndex,
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

  const handleSaveReport = () => {
    if (onSave) {
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
        indicator_gauge_values: formData.indicatorGaugeValues,
        insulation_resistance: {
          rows: formData.insulationRows,
          dielectricAbsorption: formData.dielectricAbsorption,
          polarizationIndex: formData.polarizationIndex
        },
        test_equipment_used: formData.testEquipment,
        comments: formData.comments
      };
      onSave(savePayload);
      console.log('📝 Report saved:', savePayload);
    }
  };

  if (loading) {
    return <div className="report-container"><p>Loading report...</p></div>;
  }

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
          <h1>7.2.2 Liquid Filled Xfmr. Visual, Mechanical, Insulation Resistance Test ATS 25</h1>
          <p className="neta-ref">NETA - ATS 7.2.2</p>
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
            <tr>
              <td className="label-cell">Primary Material:</td>
              <td>
                <select value={formData.nameplate.primaryWindingMaterial} onChange={(e) => handleNestedChange('nameplate', 'primaryWindingMaterial', e.target.value)} disabled={!isEditing} className="table-input">
                  {WINDING_MATERIALS.map(opt => <option key={opt} value={opt}>{opt || 'Select...'}</option>)}
                </select>
              </td>
              <td className="label-cell">Secondary Material:</td>
              <td>
                <select value={formData.nameplate.secondaryWindingMaterial} onChange={(e) => handleNestedChange('nameplate', 'secondaryWindingMaterial', e.target.value)} disabled={!isEditing} className="table-input">
                  {WINDING_MATERIALS.map(opt => <option key={opt} value={opt}>{opt || 'Select...'}</option>)}
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

      {/* Indicator/Gauge Values */}
      <div className="report-section">
        <div className="section-divider"></div>
        <h2 className="section-title">Indicator/Gauge Values</h2>
        <table className="data-table">
          <tbody>
            <tr>
              <td className="label-cell">Oil Level:</td>
              <td><input type="text" value={formData.indicatorGaugeValues.oilLevel} onChange={(e) => handleNestedChange('indicatorGaugeValues', 'oilLevel', e.target.value)} readOnly={!isEditing} className="table-input" /></td>
              <td className="label-cell">Tank Pressure:</td>
              <td><input type="text" value={formData.indicatorGaugeValues.tankPressure} onChange={(e) => handleNestedChange('indicatorGaugeValues', 'tankPressure', e.target.value)} readOnly={!isEditing} className="table-input" /></td>
            </tr>
            <tr>
              <td className="label-cell">Oil Temperature:</td>
              <td><input type="text" value={formData.indicatorGaugeValues.oilTemperature} onChange={(e) => handleNestedChange('indicatorGaugeValues', 'oilTemperature', e.target.value)} readOnly={!isEditing} className="table-input" /></td>
              <td className="label-cell">Oil Temp Range:</td>
              <td><input type="text" value={formData.indicatorGaugeValues.oilTempRange} onChange={(e) => handleNestedChange('indicatorGaugeValues', 'oilTempRange', e.target.value)} readOnly={!isEditing} className="table-input" /></td>
            </tr>
            <tr>
              <td className="label-cell">Winding Temperature:</td>
              <td><input type="text" value={formData.indicatorGaugeValues.windingTemperature} onChange={(e) => handleNestedChange('indicatorGaugeValues', 'windingTemperature', e.target.value)} readOnly={!isEditing} className="table-input" /></td>
              <td className="label-cell">Winding Temp Range:</td>
              <td><input type="text" value={formData.indicatorGaugeValues.windingTempRange} onChange={(e) => handleNestedChange('indicatorGaugeValues', 'windingTempRange', e.target.value)} readOnly={!isEditing} className="table-input" /></td>
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
              <th style={{ width: '80px' }}>Item</th>
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
        <div style={{ marginTop: '16px' }}>
          <label className="form-label">Visual/Mechanical Comments:</label>
          <textarea value={formData.visualMechanicalComments} onChange={(e) => handleInputChange('visualMechanicalComments', e.target.value)} readOnly={!isEditing} rows={3} className="comments-textarea" />
        </div>
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
          <table className="data-table" style={{ minWidth: '900px' }}>
            <thead>
              <tr>
                <th rowSpan={2}>Winding Under Test</th>
                <th rowSpan={2}>Test Voltage</th>
                <th colSpan={3}>Measured ({formData.insulationUnit})</th>
                <th colSpan={3}>Corrected to 20°C ({formData.insulationUnit})</th>
              </tr>
              <tr>
                <th>0.5 min</th>
                <th>1 min</th>
                <th>10 min</th>
                <th>0.5 min</th>
                <th>1 min</th>
                <th>10 min</th>
              </tr>
            </thead>
            <tbody>
              {formData.insulationRows.map((row, index) => (
                <tr key={index}>
                  <td><input type="text" value={row.windingUnderTest} onChange={(e) => handleInsulationRowChange(index, 'windingUnderTest', e.target.value)} readOnly={!isEditing} className="table-input" /></td>
                  <td>
                    <select value={row.testVoltage} onChange={(e) => handleInsulationRowChange(index, 'testVoltage', e.target.value)} disabled={!isEditing} className="table-input">
                      {INSULATION_RESISTANCE_TEST_VOLTAGES.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </td>
                  <td><input type="text" value={row.measured05Min} onChange={(e) => handleInsulationRowChange(index, 'measured05Min', e.target.value)} readOnly={!isEditing} className="table-input" /></td>
                  <td><input type="text" value={row.measured1Min} onChange={(e) => handleInsulationRowChange(index, 'measured1Min', e.target.value)} readOnly={!isEditing} className="table-input" /></td>
                  <td><input type="text" value={row.measured10Min} onChange={(e) => handleInsulationRowChange(index, 'measured10Min', e.target.value)} readOnly={!isEditing} className="table-input" /></td>
                  <td><input type="text" value={row.corrected05Min} readOnly className="table-input formula-field" /></td>
                  <td><input type="text" value={row.corrected1Min} readOnly className="table-input formula-field" /></td>
                  <td><input type="text" value={row.corrected10Min} readOnly className="table-input formula-field" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dielectric Absorption & Polarization Index */}
      <div className="report-section">
        <div className="section-divider"></div>
        <h2 className="section-title">Dielectric Absorption & Polarization Index</h2>
        <table className="data-table">
          <thead>
            <tr>
              <th></th>
              <th>Primary</th>
              <th>Secondary</th>
              <th>Pri to Sec</th>
              <th>Acceptable</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="label-cell">Dielectric Absorption (1min/30sec)</td>
              <td><input type="text" value={formData.dielectricAbsorption.primary} onChange={(e) => handleNestedChange('dielectricAbsorption', 'primary', e.target.value)} readOnly={!isEditing} className="table-input" /></td>
              <td><input type="text" value={formData.dielectricAbsorption.secondary} onChange={(e) => handleNestedChange('dielectricAbsorption', 'secondary', e.target.value)} readOnly={!isEditing} className="table-input" /></td>
              <td><input type="text" value={formData.dielectricAbsorption.priToSec} onChange={(e) => handleNestedChange('dielectricAbsorption', 'priToSec', e.target.value)} readOnly={!isEditing} className="table-input" /></td>
              <td>
                <select value={formData.dielectricAbsorption.acceptable} onChange={(e) => handleNestedChange('dielectricAbsorption', 'acceptable', e.target.value)} disabled={!isEditing} className="table-input">
                  <option value="">Select...</option>
                  <option value="Pass">Pass</option>
                  <option value="Fail">Fail</option>
                </select>
              </td>
            </tr>
            <tr>
              <td className="label-cell">Polarization Index (10min/1min)</td>
              <td><input type="text" value={formData.polarizationIndex.primary} onChange={(e) => handleNestedChange('polarizationIndex', 'primary', e.target.value)} readOnly={!isEditing} className="table-input" /></td>
              <td><input type="text" value={formData.polarizationIndex.secondary} onChange={(e) => handleNestedChange('polarizationIndex', 'secondary', e.target.value)} readOnly={!isEditing} className="table-input" /></td>
              <td><input type="text" value={formData.polarizationIndex.priToSec} onChange={(e) => handleNestedChange('polarizationIndex', 'priToSec', e.target.value)} readOnly={!isEditing} className="table-input" /></td>
              <td>
                <select value={formData.polarizationIndex.acceptable} onChange={(e) => handleNestedChange('polarizationIndex', 'acceptable', e.target.value)} disabled={!isEditing} className="table-input">
                  <option value="">Select...</option>
                  <option value="Pass">Pass</option>
                  <option value="Fail">Fail</option>
                </select>
              </td>
            </tr>
          </tbody>
        </table>
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

export default LiquidFilledXfmrATS25Report;

