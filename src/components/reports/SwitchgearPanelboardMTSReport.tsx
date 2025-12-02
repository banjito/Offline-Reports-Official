import React, { useState, useEffect } from 'react';
import './ReportStyles.css';

// Temperature Correction Factor Table
const TCF_TABLE: { [key: string]: number } = {
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
  '66': 8.32, '67': 8.74, '68': 9.16, '69': 9.58, '70': 10,
  '71': 10.52, '72': 11.04, '73': 11.56, '74': 12.08, '75': 12.6,
  '76': 13.24, '77': 13.88, '78': 14.52, '79': 15.16, '80': 15.8,
  '81': 16.64, '82': 17.48, '83': 18.32, '84': 19.16, '85': 20,
  '86': 21.04, '87': 22.08, '88': 23.12, '89': 24.16, '90': 25.2,
  '91': 26.45, '92': 27.7, '93': 28.95, '94': 30.2, '95': 31.6,
  '96': 33.28, '97': 34.96, '98': 36.64, '99': 38.32, '100': 40
};

const getTCF = (celsius: number): number => {
  const roundedCelsius = Math.round(celsius);
  return TCF_TABLE[roundedCelsius.toString()] ?? 1;
};

// Dropdown Options
const VISUAL_INSPECTION_OPTIONS = ["Select One", "Satisfactory", "Unsatisfactory", "Cleaned", "See Comments", "Not Applicable"];
const INSULATION_RESISTANCE_UNITS = ["kΩ", "MΩ", "GΩ"];
const INSULATION_RESISTANCE_TEST_VOLTAGES = ["250V", "500V", "1000V", "2500V", "5000V"];
const CONTACT_RESISTANCE_UNITS = ["µΩ", "mΩ", "Ω"];
const DIELECTRIC_WITHSTAND_UNITS = ["µA", "mA"];
const DIELECTRIC_WITHSTAND_TEST_VOLTAGES = [
  "1.6 kVAC", "2.2 kVAC", "14 kVAC", "27 kVAC", "37 kVAC", "45 kVAC", "60 kVAC", "120 kVAC",
  "2.3 kVDC", "3.1 kVDC", "20 kVDC", "37.5 kVDC"
];

interface InsulationResistanceRow {
  busSection: string;
  ag: string; bg: string; cg: string;
  ab: string; bc: string; ca: string;
  an: string; bn: string; cn: string;
}

interface ContactResistanceRow {
  busSection: string;
  aPhase: string; bPhase: string; cPhase: string;
  neutral: string; ground: string;
}

interface DielectricWithstandRow {
  busSection: string;
  ag: string; bg: string; cg: string;
}

interface FormData {
  customerName: string;
  customerLocation: string;
  userName: string;
  date: string;
  identifier: string;
  jobNumber: string;
  technicians: string;
  temperature: { fahrenheit: number; celsius: number; tcf: number; humidity: number };
  substation: string;
  eqptLocation: string;
  status: 'PASS' | 'FAIL' | 'LIMITED SERVICE';

  nameplate: {
    manufacturer: string;
    catalogNumber: string;
    serialNumber: string;
    series: string;
    type: string;
    systemVoltage: string;
    ratedVoltage: string;
    ratedCurrent: string;
    aicRating: string;
    phaseConfiguration: string;
  };

  visualInspectionItems: Array<{ id: string; description: string; result: string }>;

  measuredInsulationResistance: InsulationResistanceRow[];
  insulationResistanceUnit: string;
  insulationResistanceTestVoltage: string;
  tempCorrectedInsulationResistance: InsulationResistanceRow[];

  contactResistanceTests: ContactResistanceRow[];
  contactResistanceUnit: string;

  dielectricWithstandTests: DielectricWithstandRow[];
  dielectricWithstandUnit: string;
  dielectricWithstandTestVoltage: string;

  testEquipment: {
    megohmmeter: { name: string; serialNumber: string; ampId: string };
    lowResistanceOhmmeter: { name: string; serialNumber: string; ampId: string };
    hipot: { name: string; serialNumber: string; ampId: string };
  };
  comments: string;
}

const initialVisualInspectionItems = [
  { id: '7.1.A.1', description: 'Inspect physical, electrical, and mechanical condition.', result: 'Select One' },
  { id: '7.1.A.2', description: 'Inspect anchorage, alignment, grounding, and required area clearances.', result: 'Select One' },
  { id: '7.1.A.3', description: 'Prior to cleaning the unit, perform as-found tests.', result: 'Select One' },
  { id: '7.1.A.4', description: 'Clean the unit.', result: 'Select One' },
  { id: '7.1.A.5', description: 'Verify that fuse and/or circuit breaker sizes and types correspond to drawings and coordination study as well as to the circuit breaker address for microprocessorcommunication packages.', result: 'Select One' },
  { id: '7.1.A.6', description: 'Verify that current and voltage transformer ratios correspond to drawings.', result: 'Select One' },
  { id: '7.1.A.7', description: 'Verify that wiring connections are tight and that wiring is secure to prevent damage during routine operation of moving parts.', result: 'Select One' },
  { id: '7.1.A.8.1', description: 'Use of a low-resistance ohmmeter in accordance with Section 7.1.B.1.', result: 'Select One' },
  { id: '7.1.A.9', description: 'Confirm correct operation and sequencing of electrical and mechanical interlock systems.', result: 'Select One' },
  { id: '7.1.A.10', description: 'Use appropriate lubrication on moving current-carrying parts and on moving and sliding surfaces.', result: 'Select One' },
  { id: '7.1.A.11', description: 'Inspect insulators for evidence of physical damage or contaminated surfaces.', result: 'Select One' },
  { id: '7.1.A.12', description: 'Verify correct barrier and shutter installation and operation.', result: 'Select One' },
  { id: '7.1.A.13', description: 'Exercise all active components.', result: 'Select One' },
  { id: '7.1.A.14', description: 'Inspect mechanical indicating devices for correct operation.', result: 'Select One' },
  { id: '7.1.A.15', description: 'Verify that filters are in place, filters are clean and free from debris, and vents are clear', result: 'Select One' }
];

const defaultBusSections = ['Bus 1', 'Bus 2', 'Bus 3', 'Bus 4', 'Bus 5', 'Bus 6'];

const createInitialInsulationRows = (): InsulationResistanceRow[] => 
  defaultBusSections.map(bs => ({ busSection: bs, ag: '', bg: '', cg: '', ab: '', bc: '', ca: '', an: '', bn: '', cn: '' }));

const createInitialContactRows = (): ContactResistanceRow[] =>
  defaultBusSections.map(bs => ({ busSection: bs, aPhase: '', bPhase: '', cPhase: '', neutral: '', ground: '' }));

const createInitialDielectricRows = (): DielectricWithstandRow[] =>
  defaultBusSections.map(bs => ({ busSection: bs, ag: '', bg: '', cg: '' }));

const initialFormData: FormData = {
  customerName: '', customerLocation: '', userName: '', date: new Date().toISOString().split('T')[0],
  identifier: '', jobNumber: '', technicians: '',
  temperature: { fahrenheit: 68, celsius: 20, tcf: 1, humidity: 0 },
  substation: '', eqptLocation: '', status: 'PASS',
  nameplate: {
    manufacturer: '', catalogNumber: '', serialNumber: '', series: '', type: '',
    systemVoltage: '', ratedVoltage: '', ratedCurrent: '', aicRating: '', phaseConfiguration: ''
  },
  visualInspectionItems: JSON.parse(JSON.stringify(initialVisualInspectionItems)),
  measuredInsulationResistance: createInitialInsulationRows(),
  insulationResistanceUnit: 'MΩ',
  insulationResistanceTestVoltage: '1000V',
  tempCorrectedInsulationResistance: createInitialInsulationRows(),
  contactResistanceTests: createInitialContactRows(),
  contactResistanceUnit: 'µΩ',
  dielectricWithstandTests: createInitialDielectricRows(),
  dielectricWithstandUnit: 'µA',
  dielectricWithstandTestVoltage: '2.3 kVDC',
  testEquipment: {
    megohmmeter: { name: '', serialNumber: '', ampId: '' },
    lowResistanceOhmmeter: { name: '', serialNumber: '', ampId: '' },
    hipot: { name: '', serialNumber: '', ampId: '' }
  },
  comments: ''
};

interface ReportProps {
  reportData?: any;
  onSave?: (data: any) => void;
  job?: any;
}

// Helper to ensure arrays
const ensureArray = <T,>(val: any, fallback: T[]): T[] => {
  if (Array.isArray(val)) return val;
  if (val && typeof val === 'object') return Object.values(val);
  return fallback;
};

const SwitchgearPanelboardMTSReport: React.FC<ReportProps> = ({ reportData, onSave, job }) => {
  const [formData, setFormData] = useState<FormData>(JSON.parse(JSON.stringify(initialFormData)));
  const [isEditing, setIsEditing] = useState(true);

  // Load data from props
  useEffect(() => {
    if (reportData) {
      loadFromProps(reportData);
    }
  }, [reportData]);

  // Load job info
  useEffect(() => {
    if (job) {
      setFormData(prev => ({
        ...prev,
        customerName: job.customer_name || job.customerName || prev.customerName,
        customerLocation: job.address || job.customerLocation || prev.customerLocation,
        jobNumber: job.job_number || job.jobNumber || prev.jobNumber
      }));
    }
  }, [job]);

  // Recalculate TCF and corrected values when temperature changes
  useEffect(() => {
    const newTcf = getTCF(formData.temperature.celsius);
    
    // Calculate temperature corrected values
    const correctedRows = formData.measuredInsulationResistance.map(row => {
      const corrected: InsulationResistanceRow = { ...row };
      ['ag', 'bg', 'cg', 'ab', 'bc', 'ca', 'an', 'bn', 'cn'].forEach(key => {
        const val = parseFloat(row[key as keyof InsulationResistanceRow] as string);
        if (!isNaN(val)) {
          corrected[key as keyof InsulationResistanceRow] = (val * newTcf).toFixed(2);
        }
      });
      return corrected;
    });

    setFormData(prev => ({
      ...prev,
      temperature: { ...prev.temperature, tcf: newTcf },
      tempCorrectedInsulationResistance: correctedRows
    }));
  }, [formData.temperature.celsius, formData.measuredInsulationResistance]);

  const loadFromProps = (data: any) => {
    const prev = initialFormData;
    const ri = data.report_info || data.reportInfo || data || {};
    const np = ri.nameplate || data.nameplate || {};
    const ir = ri.insulation_resistance || data.insulation_resistance || data.insulationResistance || {};
    const cr = ri.contact_resistance || data.contact_resistance || data.contactResistance || {};
    const dw = ri.dielectric_withstand || data.dielectric_withstand || data.dielectricWithstand || {};
    const te = ri.test_equipment || data.test_equipment || data.testEquipment || {};
    const temp = ri.temperature || data.temperature || {};

    setFormData({
      customerName: ri.customerName || data.customer_name || prev.customerName,
      customerLocation: ri.customerLocation || data.customer_location || prev.customerLocation,
      userName: ri.userName || data.user_name || prev.userName,
      date: ri.date || data.date || prev.date,
      identifier: ri.identifier || data.identifier || prev.identifier,
      jobNumber: ri.jobNumber || data.job_number || prev.jobNumber,
      technicians: ri.technicians || data.technicians || prev.technicians,
      temperature: {
        fahrenheit: temp.fahrenheit ?? prev.temperature.fahrenheit,
        celsius: temp.celsius ?? prev.temperature.celsius,
        tcf: temp.tcf ?? prev.temperature.tcf,
        humidity: temp.humidity ?? prev.temperature.humidity
      },
      substation: ri.substation || data.substation || prev.substation,
      eqptLocation: ri.eqptLocation || data.eqpt_location || prev.eqptLocation,
      status: ri.status || data.status || prev.status,
      nameplate: {
        manufacturer: np.manufacturer || prev.nameplate.manufacturer,
        catalogNumber: np.catalogNumber || np.catalog_number || prev.nameplate.catalogNumber,
        serialNumber: np.serialNumber || np.serial_number || prev.nameplate.serialNumber,
        series: np.series || prev.nameplate.series,
        type: np.type || prev.nameplate.type,
        systemVoltage: np.systemVoltage || np.system_voltage || prev.nameplate.systemVoltage,
        ratedVoltage: np.ratedVoltage || np.rated_voltage || prev.nameplate.ratedVoltage,
        ratedCurrent: np.ratedCurrent || np.rated_current || prev.nameplate.ratedCurrent,
        aicRating: np.aicRating || np.aic_rating || prev.nameplate.aicRating,
        phaseConfiguration: np.phaseConfiguration || np.phase_configuration || prev.nameplate.phaseConfiguration
      },
      visualInspectionItems: ensureArray(
        ri.visualInspectionItems || data.visual_inspection_items || data.visualInspectionItems,
        prev.visualInspectionItems
      ),
      measuredInsulationResistance: ensureArray(
        ir.measured || ir.tests || data.measuredInsulationResistance,
        prev.measuredInsulationResistance
      ),
      insulationResistanceUnit: ir.unit || data.insulationResistanceUnit || prev.insulationResistanceUnit,
      insulationResistanceTestVoltage: ir.testVoltage || ir.test_voltage || data.insulationResistanceTestVoltage || prev.insulationResistanceTestVoltage,
      tempCorrectedInsulationResistance: ensureArray(
        ir.corrected || ir.correctedTests || data.tempCorrectedInsulationResistance,
        prev.tempCorrectedInsulationResistance
      ),
      contactResistanceTests: ensureArray(
        cr.tests || data.contactResistanceTests,
        prev.contactResistanceTests
      ),
      contactResistanceUnit: cr.unit || data.contactResistanceUnit || prev.contactResistanceUnit,
      dielectricWithstandTests: ensureArray(
        dw.tests || data.dielectricWithstandTests,
        prev.dielectricWithstandTests
      ),
      dielectricWithstandUnit: dw.unit || data.dielectricWithstandUnit || prev.dielectricWithstandUnit,
      dielectricWithstandTestVoltage: dw.testVoltage || dw.test_voltage || data.dielectricWithstandTestVoltage || prev.dielectricWithstandTestVoltage,
      testEquipment: {
        megohmmeter: te.megohmmeter || prev.testEquipment.megohmmeter,
        lowResistanceOhmmeter: te.lowResistanceOhmmeter || te.low_resistance_ohmmeter || prev.testEquipment.lowResistanceOhmmeter,
        hipot: te.hipot || prev.testEquipment.hipot
      },
      comments: ri.comments || data.comments || prev.comments
    });
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => {
      const keys = field.split('.');
      if (keys.length === 1) {
        return { ...prev, [field]: value };
      }
      const newData = { ...prev };
      let current: any = newData;
      for (let i = 0; i < keys.length - 1; i++) {
        current[keys[i]] = { ...current[keys[i]] };
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;
      return newData;
    });
  };

  const handleFahrenheitChange = (f: number) => {
    const c = Math.round((f - 32) * 5 / 9);
    setFormData(prev => ({ ...prev, temperature: { ...prev.temperature, fahrenheit: f, celsius: c } }));
  };

  const handleVisualChange = (index: number, value: string) => {
    const newItems = [...formData.visualInspectionItems];
    newItems[index] = { ...newItems[index], result: value };
    setFormData(prev => ({ ...prev, visualInspectionItems: newItems }));
  };

  const handleInsulationChange = (index: number, field: keyof InsulationResistanceRow, value: string) => {
    const newRows = [...formData.measuredInsulationResistance];
    newRows[index] = { ...newRows[index], [field]: value };
    setFormData(prev => ({ ...prev, measuredInsulationResistance: newRows }));
  };

  const handleContactChange = (index: number, field: keyof ContactResistanceRow, value: string) => {
    const newRows = [...formData.contactResistanceTests];
    newRows[index] = { ...newRows[index], [field]: value };
    setFormData(prev => ({ ...prev, contactResistanceTests: newRows }));
  };

  const handleDielectricChange = (index: number, field: keyof DielectricWithstandRow, value: string) => {
    const newRows = [...formData.dielectricWithstandTests];
    newRows[index] = { ...newRows[index], [field]: value };
    setFormData(prev => ({ ...prev, dielectricWithstandTests: newRows }));
  };

  const handleSave = () => {
    if (onSave) {
      onSave(formData);
    }
  };

  return (
    <div className="report-container">
      {/* Header */}
      <div className="report-header">
        <h1 className="report-title">Switchgear & Panelboard MTS Report</h1>
        <div className="header-actions">
          <button
            onClick={() => setFormData(prev => ({
              ...prev,
              status: prev.status === 'PASS' ? 'FAIL' : prev.status === 'FAIL' ? 'LIMITED SERVICE' : 'PASS'
            }))}
            className={`status-badge ${formData.status === 'PASS' ? 'status-pass' : formData.status === 'FAIL' ? 'status-fail' : 'status-limited'}`}
          >
            {formData.status}
          </button>
          <button onClick={handleSave} className="save-btn">Save Report</button>
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
              <td><input type="text" value={formData.customerName} readOnly className="table-input" style={{ backgroundColor: '#f3f4f6' }} /></td>
              <td className="label-cell">Job #:</td>
              <td><input type="text" value={formData.jobNumber} readOnly className="table-input" style={{ backgroundColor: '#f3f4f6' }} /></td>
              <td className="label-cell">Date:</td>
              <td><input type="date" value={formData.date} onChange={(e) => handleInputChange('date', e.target.value)} className="table-input" /></td>
            </tr>
            <tr>
              <td className="label-cell">Address:</td>
              <td colSpan={3}><input type="text" value={formData.customerLocation} readOnly className="table-input" style={{ backgroundColor: '#f3f4f6', width: '100%' }} /></td>
              <td className="label-cell">Technicians:</td>
              <td><input type="text" value={formData.technicians} onChange={(e) => handleInputChange('technicians', e.target.value)} className="table-input" /></td>
            </tr>
            <tr>
              <td className="label-cell">Identifier:</td>
              <td><input type="text" value={formData.identifier} onChange={(e) => handleInputChange('identifier', e.target.value)} className="table-input" /></td>
              <td className="label-cell">Substation:</td>
              <td><input type="text" value={formData.substation} onChange={(e) => handleInputChange('substation', e.target.value)} className="table-input" /></td>
              <td className="label-cell">Eqpt. Location:</td>
              <td><input type="text" value={formData.eqptLocation} onChange={(e) => handleInputChange('eqptLocation', e.target.value)} className="table-input" /></td>
            </tr>
            <tr>
              <td className="label-cell">Temp (°F):</td>
              <td><input type="number" value={formData.temperature.fahrenheit} onChange={(e) => handleFahrenheitChange(parseFloat(e.target.value))} className="table-input" style={{ width: '80px' }} /></td>
              <td className="label-cell">Temp (°C):</td>
              <td><input type="number" value={formData.temperature.celsius} readOnly className="table-input" style={{ width: '80px', backgroundColor: '#f3f4f6' }} /></td>
              <td className="label-cell">TCF:</td>
              <td><input type="text" value={formData.temperature.tcf.toFixed(3)} readOnly className="table-input" style={{ width: '80px', backgroundColor: '#f3f4f6' }} /></td>
            </tr>
            <tr>
              <td className="label-cell">Humidity %:</td>
              <td><input type="number" value={formData.temperature.humidity || ''} onChange={(e) => handleInputChange('temperature.humidity', parseFloat(e.target.value))} className="table-input" style={{ width: '80px' }} /></td>
              <td className="label-cell">User:</td>
              <td colSpan={3}><input type="text" value={formData.userName} onChange={(e) => handleInputChange('userName', e.target.value)} className="table-input" /></td>
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
              <td><input type="text" value={formData.nameplate.manufacturer} onChange={(e) => handleInputChange('nameplate.manufacturer', e.target.value)} className="table-input" /></td>
              <td className="label-cell">Catalog Number:</td>
              <td><input type="text" value={formData.nameplate.catalogNumber} onChange={(e) => handleInputChange('nameplate.catalogNumber', e.target.value)} className="table-input" /></td>
              <td className="label-cell">Serial Number:</td>
              <td><input type="text" value={formData.nameplate.serialNumber} onChange={(e) => handleInputChange('nameplate.serialNumber', e.target.value)} className="table-input" /></td>
            </tr>
            <tr>
              <td className="label-cell">Series:</td>
              <td><input type="text" value={formData.nameplate.series} onChange={(e) => handleInputChange('nameplate.series', e.target.value)} className="table-input" /></td>
              <td className="label-cell">Type:</td>
              <td><input type="text" value={formData.nameplate.type} onChange={(e) => handleInputChange('nameplate.type', e.target.value)} className="table-input" /></td>
              <td className="label-cell">System Voltage:</td>
              <td><input type="text" value={formData.nameplate.systemVoltage} onChange={(e) => handleInputChange('nameplate.systemVoltage', e.target.value)} className="table-input" /></td>
            </tr>
            <tr>
              <td className="label-cell">Rated Voltage:</td>
              <td><input type="text" value={formData.nameplate.ratedVoltage} onChange={(e) => handleInputChange('nameplate.ratedVoltage', e.target.value)} className="table-input" /></td>
              <td className="label-cell">Rated Current:</td>
              <td><input type="text" value={formData.nameplate.ratedCurrent} onChange={(e) => handleInputChange('nameplate.ratedCurrent', e.target.value)} className="table-input" /></td>
              <td className="label-cell">AIC Rating:</td>
              <td><input type="text" value={formData.nameplate.aicRating} onChange={(e) => handleInputChange('nameplate.aicRating', e.target.value)} className="table-input" /></td>
            </tr>
            <tr>
              <td className="label-cell">Phase Config:</td>
              <td><input type="text" value={formData.nameplate.phaseConfiguration} onChange={(e) => handleInputChange('nameplate.phaseConfiguration', e.target.value)} className="table-input" /></td>
              <td colSpan={4}></td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Visual and Mechanical Inspection */}
      <div className="report-section">
        <div className="section-divider"></div>
        <h2 className="section-title">Visual and Mechanical Inspection</h2>
        <div className="table-container" style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '12%' }}>NETA Section</th>
                <th style={{ width: '68%' }}>Description</th>
                <th style={{ width: '20%' }}>Result</th>
              </tr>
            </thead>
            <tbody>
              {formData.visualInspectionItems.map((item, index) => (
                <tr key={item.id}>
                  <td style={{ fontWeight: 500 }}>{item.id}</td>
                  <td style={{ whiteSpace: 'normal' }}>{item.description}</td>
                  <td>
                    <select value={item.result} onChange={(e) => handleVisualChange(index, e.target.value)} disabled={!isEditing} className="table-input">
                      {VISUAL_INSPECTION_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Electrical Tests - Measured Insulation Resistance */}
      <div className="report-section">
        <div className="section-divider"></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 className="section-title" style={{ marginBottom: 0 }}>Electrical Tests - Measured Insulation Resistance Values</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.875rem' }}>Test Voltage:</span>
            <select value={formData.insulationResistanceTestVoltage} onChange={(e) => handleInputChange('insulationResistanceTestVoltage', e.target.value)} className="table-input" style={{ width: '100px' }}>
              {INSULATION_RESISTANCE_TEST_VOLTAGES.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>
        </div>
        <div className="table-container" style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '8%' }}>Bus Section</th>
                <th colSpan={9} style={{ textAlign: 'center' }}>Insulation Resistance</th>
                <th style={{ width: '8%' }}>Units</th>
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
              {formData.measuredInsulationResistance.map((row, index) => (
                <tr key={index}>
                  <td><input type="text" value={row.busSection} readOnly className="table-input" style={{ backgroundColor: '#f3f4f6' }} /></td>
                  {(['ag', 'bg', 'cg', 'ab', 'bc', 'ca', 'an', 'bn', 'cn'] as const).map(key => (
                    <td key={key}><input type="text" value={row[key]} onChange={(e) => handleInsulationChange(index, key, e.target.value)} className="table-input" /></td>
                  ))}
                  <td>
                    <select value={formData.insulationResistanceUnit} onChange={(e) => handleInputChange('insulationResistanceUnit', e.target.value)} className="table-input">
                      {INSULATION_RESISTANCE_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
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
                <th style={{ width: '8%' }}>Bus Section</th>
                <th colSpan={9} style={{ textAlign: 'center' }}>Insulation Resistance</th>
                <th style={{ width: '8%' }}>Units</th>
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
              {formData.tempCorrectedInsulationResistance.map((row, index) => (
                <tr key={index}>
                  <td><input type="text" value={row.busSection} readOnly className="table-input" style={{ backgroundColor: '#f3f4f6' }} /></td>
                  {(['ag', 'bg', 'cg', 'ab', 'bc', 'ca', 'an', 'bn', 'cn'] as const).map(key => (
                    <td key={key}><input type="text" value={row[key]} readOnly className="table-input" style={{ backgroundColor: '#f3f4f6' }} /></td>
                  ))}
                  <td><input type="text" value={formData.insulationResistanceUnit} readOnly className="table-input" style={{ backgroundColor: '#f3f4f6' }} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Contact Resistance */}
      <div className="report-section">
        <div className="section-divider"></div>
        <h2 className="section-title">Contact Resistance</h2>
        <div className="table-container" style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '12%' }}>Bus Section</th>
                <th colSpan={5} style={{ textAlign: 'center' }}>Contact Resistance</th>
                <th style={{ width: '10%' }}>Units</th>
              </tr>
              <tr>
                <th></th>
                <th>A Phase</th><th>B Phase</th><th>C Phase</th>
                <th>Neutral</th><th>Ground</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {formData.contactResistanceTests.map((row, index) => (
                <tr key={index}>
                  <td><input type="text" value={row.busSection} onChange={(e) => handleContactChange(index, 'busSection', e.target.value)} className="table-input" /></td>
                  {(['aPhase', 'bPhase', 'cPhase', 'neutral', 'ground'] as const).map(key => (
                    <td key={key}><input type="text" value={row[key]} onChange={(e) => handleContactChange(index, key, e.target.value)} className="table-input" /></td>
                  ))}
                  <td>
                    <select value={formData.contactResistanceUnit} onChange={(e) => handleInputChange('contactResistanceUnit', e.target.value)} className="table-input">
                      {CONTACT_RESISTANCE_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dielectric Withstand */}
      <div className="report-section">
        <div className="section-divider"></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 className="section-title" style={{ marginBottom: 0 }}>Dielectric Withstand</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.875rem' }}>Test Voltage:</span>
            <select value={formData.dielectricWithstandTestVoltage} onChange={(e) => handleInputChange('dielectricWithstandTestVoltage', e.target.value)} className="table-input" style={{ width: '120px' }}>
              {DIELECTRIC_WITHSTAND_TEST_VOLTAGES.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>
        </div>
        <div className="table-container" style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '15%' }}>Bus Section</th>
                <th colSpan={3} style={{ textAlign: 'center' }}>Dielectric Withstand</th>
                <th style={{ width: '10%' }}>Units</th>
              </tr>
              <tr>
                <th></th>
                <th>A-G</th><th>B-G</th><th>C-G</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {formData.dielectricWithstandTests.map((row, index) => (
                <tr key={index}>
                  <td><input type="text" value={row.busSection} readOnly className="table-input" style={{ backgroundColor: '#f3f4f6' }} /></td>
                  {(['ag', 'bg', 'cg'] as const).map(key => (
                    <td key={key}><input type="text" value={row[key]} onChange={(e) => handleDielectricChange(index, key, e.target.value)} className="table-input" /></td>
                  ))}
                  <td>
                    <select value={formData.dielectricWithstandUnit} onChange={(e) => handleInputChange('dielectricWithstandUnit', e.target.value)} className="table-input">
                      {DIELECTRIC_WITHSTAND_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Test Equipment Used */}
      <div className="report-section">
        <div className="section-divider"></div>
        <h2 className="section-title">Test Equipment Used</h2>
        <table className="data-table">
          <tbody>
            <tr>
              <td className="label-cell">Megohmmeter:</td>
              <td><input type="text" value={formData.testEquipment.megohmmeter.name} onChange={(e) => handleInputChange('testEquipment.megohmmeter.name', e.target.value)} className="table-input" /></td>
              <td className="label-cell">Serial Number:</td>
              <td><input type="text" value={formData.testEquipment.megohmmeter.serialNumber} onChange={(e) => handleInputChange('testEquipment.megohmmeter.serialNumber', e.target.value)} className="table-input" /></td>
              <td className="label-cell">AMP ID:</td>
              <td><input type="text" value={formData.testEquipment.megohmmeter.ampId} onChange={(e) => handleInputChange('testEquipment.megohmmeter.ampId', e.target.value)} className="table-input" /></td>
            </tr>
            <tr>
              <td className="label-cell">Low Resistance Ohmmeter:</td>
              <td><input type="text" value={formData.testEquipment.lowResistanceOhmmeter.name} onChange={(e) => handleInputChange('testEquipment.lowResistanceOhmmeter.name', e.target.value)} className="table-input" /></td>
              <td className="label-cell">Serial Number:</td>
              <td><input type="text" value={formData.testEquipment.lowResistanceOhmmeter.serialNumber} onChange={(e) => handleInputChange('testEquipment.lowResistanceOhmmeter.serialNumber', e.target.value)} className="table-input" /></td>
              <td className="label-cell">AMP ID:</td>
              <td><input type="text" value={formData.testEquipment.lowResistanceOhmmeter.ampId} onChange={(e) => handleInputChange('testEquipment.lowResistanceOhmmeter.ampId', e.target.value)} className="table-input" /></td>
            </tr>
            <tr>
              <td className="label-cell">Hipot:</td>
              <td><input type="text" value={formData.testEquipment.hipot.name} onChange={(e) => handleInputChange('testEquipment.hipot.name', e.target.value)} className="table-input" /></td>
              <td className="label-cell">Serial Number:</td>
              <td><input type="text" value={formData.testEquipment.hipot.serialNumber} onChange={(e) => handleInputChange('testEquipment.hipot.serialNumber', e.target.value)} className="table-input" /></td>
              <td className="label-cell">AMP ID:</td>
              <td><input type="text" value={formData.testEquipment.hipot.ampId} onChange={(e) => handleInputChange('testEquipment.hipot.ampId', e.target.value)} className="table-input" /></td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Comments */}
      <div className="report-section">
        <div className="section-divider"></div>
        <h2 className="section-title">Comments</h2>
        <textarea
          value={formData.comments}
          onChange={(e) => handleInputChange('comments', e.target.value)}
          rows={4}
          className="comments-textarea"
          placeholder="Enter any additional comments..."
        />
      </div>
    </div>
  );
};

export default SwitchgearPanelboardMTSReport;

