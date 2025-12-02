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
const TEST_VOLTAGE_OPTIONS = ["250V", "500V", "1000V", "2500V", "5000V"];
const PASS_FAIL_OPTIONS = ["PASS", "FAIL", "N/A"];
const CONNECTION_OPTIONS = ["Delta", "Wye", "Single Phase"];
const MATERIAL_OPTIONS = ["Aluminum", "Copper"];

interface InsulationTest {
  winding: string;
  testVoltage: string;
  measured0_5Min: string;
  measured1Min: string;
  units: string;
  corrected0_5Min: string;
  corrected1Min: string;
  correctedUnits: string;
  tableMinimum: string;
  tableMinimumUnits: string;
}

interface TurnsRatioTest {
  tap: string;
  nameplateVoltage: string;
  calculatedRatio: string;
  measuredH1H2: string;
  devH1H2: string;
  passFailH1H2: string;
  measuredH2H3: string;
  devH2H3: string;
  passFailH2H3: string;
  measuredH3H1: string;
  devH3H1: string;
  passFailH3H1: string;
}

interface FormData {
  customer: string;
  address: string;
  user: string;
  date: string;
  identifier: string;
  jobNumber: string;
  technicians: string;
  temperature: { fahrenheit: number; celsius: number; tcf: number; humidity: number };
  substation: string;
  eqptLocation: string;

  nameplate: {
    manufacturer: string;
    kvaBase: string;
    kvaCooling: string;
    voltsPrimary: string;
    voltsPrimaryInternal: string;
    voltsSecondary: string;
    voltsSecondaryInternal: string;
    connectionsPrimary: string;
    connectionsSecondary: string;
    windingMaterialPrimary: string;
    windingMaterialSecondary: string;
    catalogNumber: string;
    tempRise: string;
    serialNumber: string;
    impedance: string;
    tapVoltages: string[];
    tapPosition: string;
    tapPositionLeftVolts: string;
    tapPositionLeftPercent: string;
  };

  visualInspectionItems: Array<{ netaSection: string; description: string; result: string }>;
  visualInspectionComments: string;

  insulationResistance: {
    tests: InsulationTest[];
    dielectricAbsorptionRatio: {
      calculatedAs: string;
      priToGnd: string;
      secToGnd: string;
      priToSec: string;
      passFail: string;
      minimumDAR: string;
    };
  };

  turnsRatio: {
    secondaryWindingVoltage: string;
    tests: TurnsRatioTest[];
  };

  testEquipment: {
    megohmmeter: { name: string; serialNumber: string; ampId: string };
    ttrTestSet: { name: string; serialNumber: string; ampId: string };
  };

  comments: string;
  status: 'PASS' | 'FAIL';
}

const initialVisualInspectionItems = [
  { netaSection: '7.2.1.1.A.1', description: 'Inspect physical and mechanical condition.', result: '' },
  { netaSection: '7.2.1.1.A.2', description: 'Inspect anchorage, alignment, and grounding.', result: '' },
  { netaSection: '7.2.1.1.A.3', description: '*Prior to cleaning the unit, perform as-found tests.', result: '' },
  { netaSection: '7.2.1.1.A.4', description: 'Clean the unit.', result: '' },
  { netaSection: '7.2.1.1.A.5', description: 'Inspect bolted electrical connections for high resistance using a low-resistance ohmmeter', result: '' },
  { netaSection: '7.2.1.1.A.6.1', description: 'Perform as-left tests.', result: '' },
  { netaSection: '7.2.1.1.A.7', description: 'Verify that as-left tap connections are as specified.', result: '' },
];

const initialInsulationResistanceTests: InsulationTest[] = [
  { winding: 'Primary to Ground', testVoltage: '1000V', measured0_5Min: '', measured1Min: '', units: 'GΩ', corrected0_5Min: '', corrected1Min: '', correctedUnits: 'GΩ', tableMinimum: '100.5', tableMinimumUnits: 'GΩ' },
  { winding: 'Secondary to Ground', testVoltage: '500V', measured0_5Min: '', measured1Min: '', units: 'GΩ', corrected0_5Min: '', corrected1Min: '', correctedUnits: 'GΩ', tableMinimum: '', tableMinimumUnits: 'GΩ' },
  { winding: 'Primary to Secondary', testVoltage: '1000V', measured0_5Min: '', measured1Min: '', units: 'GΩ', corrected0_5Min: '', corrected1Min: '', correctedUnits: 'GΩ', tableMinimum: '', tableMinimumUnits: 'GΩ' },
];

const initialTurnsRatioTests: TurnsRatioTest[] = [
  { tap: '1', nameplateVoltage: '', calculatedRatio: '', measuredH1H2: '', devH1H2: '', passFailH1H2: 'N/A', measuredH2H3: '', devH2H3: '', passFailH2H3: 'N/A', measuredH3H1: '', devH3H1: '', passFailH3H1: 'N/A' },
  { tap: '2', nameplateVoltage: '', calculatedRatio: '', measuredH1H2: '', devH1H2: '', passFailH1H2: 'N/A', measuredH2H3: '', devH2H3: '', passFailH2H3: 'N/A', measuredH3H1: '', devH3H1: '', passFailH3H1: 'N/A' },
  { tap: '3', nameplateVoltage: '', calculatedRatio: '', measuredH1H2: '', devH1H2: '', passFailH1H2: 'N/A', measuredH2H3: '', devH2H3: '', passFailH2H3: 'N/A', measuredH3H1: '', devH3H1: '', passFailH3H1: 'N/A' },
  { tap: '4', nameplateVoltage: '', calculatedRatio: '', measuredH1H2: '', devH1H2: '', passFailH1H2: 'N/A', measuredH2H3: '', devH2H3: '', passFailH2H3: 'N/A', measuredH3H1: '', devH3H1: '', passFailH3H1: 'N/A' },
  { tap: '5', nameplateVoltage: '', calculatedRatio: '', measuredH1H2: '', devH1H2: '', passFailH1H2: 'N/A', measuredH2H3: '', devH2H3: '', passFailH2H3: 'N/A', measuredH3H1: '', devH3H1: '', passFailH3H1: 'N/A' },
];

const initialFormData: FormData = {
  customer: '', address: '', user: '', date: new Date().toISOString().split('T')[0],
  identifier: '', jobNumber: '', technicians: '',
  temperature: { fahrenheit: 68, celsius: 20, tcf: 1, humidity: 0 },
  substation: '', eqptLocation: '', status: 'PASS',
  nameplate: {
    manufacturer: '', kvaBase: '', kvaCooling: '', voltsPrimary: '', voltsPrimaryInternal: '',
    voltsSecondary: '', voltsSecondaryInternal: '', connectionsPrimary: 'Delta', connectionsSecondary: 'Wye',
    windingMaterialPrimary: 'Copper', windingMaterialSecondary: 'Copper', catalogNumber: '', tempRise: '',
    serialNumber: '', impedance: '', tapVoltages: ['', '', '', '', '', '', ''], tapPosition: '1',
    tapPositionLeftVolts: '', tapPositionLeftPercent: ''
  },
  visualInspectionItems: JSON.parse(JSON.stringify(initialVisualInspectionItems)),
  visualInspectionComments: '',
  insulationResistance: {
    tests: JSON.parse(JSON.stringify(initialInsulationResistanceTests)),
    dielectricAbsorptionRatio: { calculatedAs: '1 min / 0.5 min', priToGnd: '', secToGnd: '', priToSec: '', passFail: 'N/A', minimumDAR: '1.25' }
  },
  turnsRatio: {
    secondaryWindingVoltage: '',
    tests: JSON.parse(JSON.stringify(initialTurnsRatioTests))
  },
  testEquipment: {
    megohmmeter: { name: '', serialNumber: '', ampId: '' },
    ttrTestSet: { name: '', serialNumber: '', ampId: '' }
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

const TwoSmallDryTypeXfmrATSReport: React.FC<ReportProps> = ({ reportData, onSave, job }) => {
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
        customer: job.customer_name || job.customerName || job.customer || prev.customer,
        address: job.address || job.customerLocation || prev.address,
        jobNumber: job.job_number || job.jobNumber || prev.jobNumber
      }));
    }
  }, [job]);

  // Recalculate TCF when temperature changes
  useEffect(() => {
    const newTcf = getTCF(formData.temperature.celsius);
    setFormData(prev => ({
      ...prev,
      temperature: { ...prev.temperature, tcf: newTcf }
    }));
  }, [formData.temperature.celsius]);

  const loadFromProps = (data: any) => {
    const prev = initialFormData;
    const ri = data.report_info || data.reportInfo || data || {};
    const np = ri.nameplate || data.nameplate || {};
    const ir = ri.insulationResistance || data.insulationResistance || data.insulation_resistance || {};
    const tr = ri.turnsRatio || data.turnsRatio || data.turns_ratio || {};
    const te = ri.testEquipment || data.testEquipment || data.test_equipment || {};
    const temp = ri.temperature || data.temperature || {};

    setFormData({
      customer: ri.customer || data.customer || prev.customer,
      address: ri.address || data.address || prev.address,
      user: ri.user || data.user || prev.user,
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
        kvaBase: np.kvaBase || np.kva_base || prev.nameplate.kvaBase,
        kvaCooling: np.kvaCooling || np.kva_cooling || prev.nameplate.kvaCooling,
        voltsPrimary: np.voltsPrimary || np.volts_primary || prev.nameplate.voltsPrimary,
        voltsPrimaryInternal: np.voltsPrimaryInternal || np.volts_primary_internal || prev.nameplate.voltsPrimaryInternal,
        voltsSecondary: np.voltsSecondary || np.volts_secondary || prev.nameplate.voltsSecondary,
        voltsSecondaryInternal: np.voltsSecondaryInternal || np.volts_secondary_internal || prev.nameplate.voltsSecondaryInternal,
        connectionsPrimary: np.connectionsPrimary || np.connections_primary || prev.nameplate.connectionsPrimary,
        connectionsSecondary: np.connectionsSecondary || np.connections_secondary || prev.nameplate.connectionsSecondary,
        windingMaterialPrimary: np.windingMaterialPrimary || np.winding_material_primary || prev.nameplate.windingMaterialPrimary,
        windingMaterialSecondary: np.windingMaterialSecondary || np.winding_material_secondary || prev.nameplate.windingMaterialSecondary,
        catalogNumber: np.catalogNumber || np.catalog_number || prev.nameplate.catalogNumber,
        tempRise: np.tempRise || np.temp_rise || prev.nameplate.tempRise,
        serialNumber: np.serialNumber || np.serial_number || prev.nameplate.serialNumber,
        impedance: np.impedance || prev.nameplate.impedance,
        tapVoltages: ensureArray(np.tapVoltages || np.tap_voltages, prev.nameplate.tapVoltages),
        tapPosition: np.tapPosition || np.tap_position || prev.nameplate.tapPosition,
        tapPositionLeftVolts: np.tapPositionLeftVolts || np.tap_position_left_volts || prev.nameplate.tapPositionLeftVolts,
        tapPositionLeftPercent: np.tapPositionLeftPercent || np.tap_position_left_percent || prev.nameplate.tapPositionLeftPercent
      },
      visualInspectionItems: ensureArray(
        ri.visualInspectionItems || data.visual_inspection_items || data.visualInspectionItems,
        prev.visualInspectionItems
      ),
      visualInspectionComments: ri.visualInspectionComments || data.visual_inspection_comments || prev.visualInspectionComments,
      insulationResistance: {
        tests: ensureArray(ir.tests, prev.insulationResistance.tests),
        dielectricAbsorptionRatio: ir.dielectricAbsorptionRatio || ir.dielectric_absorption_ratio || prev.insulationResistance.dielectricAbsorptionRatio
      },
      turnsRatio: {
        secondaryWindingVoltage: tr.secondaryWindingVoltage || tr.secondary_winding_voltage || prev.turnsRatio.secondaryWindingVoltage,
        tests: ensureArray(tr.tests, prev.turnsRatio.tests)
      },
      testEquipment: {
        megohmmeter: te.megohmmeter || prev.testEquipment.megohmmeter,
        ttrTestSet: te.ttrTestSet || te.ttr_test_set || prev.testEquipment.ttrTestSet
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

  const handleInsulationChange = (index: number, field: keyof InsulationTest, value: string) => {
    const newTests = [...formData.insulationResistance.tests];
    newTests[index] = { ...newTests[index], [field]: value };
    setFormData(prev => ({ ...prev, insulationResistance: { ...prev.insulationResistance, tests: newTests } }));
  };

  const handleTurnsRatioChange = (index: number, field: keyof TurnsRatioTest, value: string) => {
    const newTests = [...formData.turnsRatio.tests];
    newTests[index] = { ...newTests[index], [field]: value };
    setFormData(prev => ({ ...prev, turnsRatio: { ...prev.turnsRatio, tests: newTests } }));
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
        <h1 className="report-title">Two Small Dry Type Transformer ATS Report</h1>
        <div className="header-actions">
          <button
            onClick={() => setFormData(prev => ({ ...prev, status: prev.status === 'PASS' ? 'FAIL' : 'PASS' }))}
            className={`status-badge ${formData.status === 'PASS' ? 'status-pass' : 'status-fail'}`}
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
              <td><input type="text" value={formData.customer} readOnly className="table-input" style={{ backgroundColor: '#f3f4f6' }} /></td>
              <td className="label-cell">Job #:</td>
              <td><input type="text" value={formData.jobNumber} readOnly className="table-input" style={{ backgroundColor: '#f3f4f6' }} /></td>
              <td className="label-cell">Date:</td>
              <td><input type="date" value={formData.date} onChange={(e) => handleInputChange('date', e.target.value)} className="table-input" /></td>
            </tr>
            <tr>
              <td className="label-cell">Address:</td>
              <td colSpan={3}><input type="text" value={formData.address} readOnly className="table-input" style={{ backgroundColor: '#f3f4f6', width: '100%' }} /></td>
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
              <td colSpan={3}><input type="text" value={formData.user} onChange={(e) => handleInputChange('user', e.target.value)} className="table-input" /></td>
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
              <td className="label-cell">Catalog #:</td>
              <td><input type="text" value={formData.nameplate.catalogNumber} onChange={(e) => handleInputChange('nameplate.catalogNumber', e.target.value)} className="table-input" /></td>
              <td className="label-cell">Serial #:</td>
              <td><input type="text" value={formData.nameplate.serialNumber} onChange={(e) => handleInputChange('nameplate.serialNumber', e.target.value)} className="table-input" /></td>
            </tr>
            <tr>
              <td className="label-cell">KVA Base/Cooling:</td>
              <td>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <input type="text" value={formData.nameplate.kvaBase} onChange={(e) => handleInputChange('nameplate.kvaBase', e.target.value)} className="table-input" style={{ width: '60px' }} placeholder="Base" />
                  <span>/</span>
                  <input type="text" value={formData.nameplate.kvaCooling} onChange={(e) => handleInputChange('nameplate.kvaCooling', e.target.value)} className="table-input" style={{ width: '60px' }} placeholder="Cooling" />
                </div>
              </td>
              <td className="label-cell">Temp Rise (°C):</td>
              <td><input type="text" value={formData.nameplate.tempRise} onChange={(e) => handleInputChange('nameplate.tempRise', e.target.value)} className="table-input" /></td>
              <td className="label-cell">Impedance (%):</td>
              <td><input type="text" value={formData.nameplate.impedance} onChange={(e) => handleInputChange('nameplate.impedance', e.target.value)} className="table-input" /></td>
            </tr>
          </tbody>
        </table>

        {/* Volts / Connections / Winding Material */}
        <table className="data-table" style={{ marginTop: '16px' }}>
          <thead>
            <tr>
              <th style={{ width: '12%' }}></th>
              <th style={{ width: '22%' }}>Volts</th>
              <th style={{ width: '33%' }}>Connections</th>
              <th style={{ width: '33%' }}>Winding Material</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="label-cell">Primary</td>
              <td>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <input type="text" value={formData.nameplate.voltsPrimary} onChange={(e) => handleInputChange('nameplate.voltsPrimary', e.target.value)} className="table-input" style={{ width: '60px' }} />
                  <span>/</span>
                  <input type="text" value={formData.nameplate.voltsPrimaryInternal} onChange={(e) => handleInputChange('nameplate.voltsPrimaryInternal', e.target.value)} className="table-input" style={{ width: '60px' }} />
                </div>
              </td>
              <td>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {CONNECTION_OPTIONS.map(opt => (
                    <label key={`pri-${opt}`} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <input type="radio" name="connectionsPrimary" value={opt} checked={formData.nameplate.connectionsPrimary === opt} onChange={(e) => handleInputChange('nameplate.connectionsPrimary', e.target.value)} disabled={!isEditing} />
                      <span style={{ fontSize: '0.875rem' }}>{opt}</span>
                    </label>
                  ))}
                </div>
              </td>
              <td>
                <div style={{ display: 'flex', gap: '16px' }}>
                  {MATERIAL_OPTIONS.map(opt => (
                    <label key={`pri-mat-${opt}`} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <input type="radio" name="windingMaterialPrimary" value={opt} checked={formData.nameplate.windingMaterialPrimary === opt} onChange={(e) => handleInputChange('nameplate.windingMaterialPrimary', e.target.value)} disabled={!isEditing} />
                      <span style={{ fontSize: '0.875rem' }}>{opt}</span>
                    </label>
                  ))}
                </div>
              </td>
            </tr>
            <tr>
              <td className="label-cell">Secondary</td>
              <td>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <input type="text" value={formData.nameplate.voltsSecondary} onChange={(e) => handleInputChange('nameplate.voltsSecondary', e.target.value)} className="table-input" style={{ width: '60px' }} />
                  <span>/</span>
                  <input type="text" value={formData.nameplate.voltsSecondaryInternal} onChange={(e) => handleInputChange('nameplate.voltsSecondaryInternal', e.target.value)} className="table-input" style={{ width: '60px' }} />
                </div>
              </td>
              <td>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {CONNECTION_OPTIONS.map(opt => (
                    <label key={`sec-${opt}`} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <input type="radio" name="connectionsSecondary" value={opt} checked={formData.nameplate.connectionsSecondary === opt} onChange={(e) => handleInputChange('nameplate.connectionsSecondary', e.target.value)} disabled={!isEditing} />
                      <span style={{ fontSize: '0.875rem' }}>{opt}</span>
                    </label>
                  ))}
                </div>
              </td>
              <td>
                <div style={{ display: 'flex', gap: '16px' }}>
                  {MATERIAL_OPTIONS.map(opt => (
                    <label key={`sec-mat-${opt}`} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <input type="radio" name="windingMaterialSecondary" value={opt} checked={formData.nameplate.windingMaterialSecondary === opt} onChange={(e) => handleInputChange('nameplate.windingMaterialSecondary', e.target.value)} disabled={!isEditing} />
                      <span style={{ fontSize: '0.875rem' }}>{opt}</span>
                    </label>
                  ))}
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        {/* Tap Configuration */}
        <h3 style={{ fontSize: '1rem', fontWeight: 500, marginTop: '16px', marginBottom: '8px' }}>Tap Configuration</h3>
        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px', marginBottom: '4px' }}>
            {[1, 2, 3, 4, 5, 6, 7].map(i => (
              <div key={i} style={{ textAlign: 'center', fontSize: '0.875rem', fontWeight: 500 }}>{i}</div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' }}>
            {formData.nameplate.tapVoltages.map((tv, index) => (
              <input
                key={index}
                type="text"
                value={tv}
                onChange={(e) => {
                  const newTaps = [...formData.nameplate.tapVoltages];
                  newTaps[index] = e.target.value;
                  handleInputChange('nameplate.tapVoltages', newTaps);
                }}
                className="table-input"
                style={{ textAlign: 'center' }}
              />
            ))}
          </div>
        </div>
        <table className="data-table">
          <tbody>
            <tr>
              <td className="label-cell">Tap Position:</td>
              <td>
                <select value={formData.nameplate.tapPosition} onChange={(e) => handleInputChange('nameplate.tapPosition', e.target.value)} className="table-input" style={{ width: '80px' }}>
                  {[1, 2, 3, 4, 5, 6, 7].map(n => <option key={n} value={n.toString()}>{n}</option>)}
                </select>
              </td>
              <td className="label-cell">Tap Position Left:</td>
              <td colSpan={3}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input type="text" value={formData.nameplate.tapPosition} readOnly className="table-input" style={{ width: '40px', backgroundColor: '#f3f4f6' }} />
                  <span>/</span>
                  <input type="text" value={formData.nameplate.tapPositionLeftVolts} onChange={(e) => handleInputChange('nameplate.tapPositionLeftVolts', e.target.value)} className="table-input" placeholder="Volts" style={{ width: '80px' }} />
                  <input type="text" value={formData.nameplate.tapPositionLeftPercent} onChange={(e) => handleInputChange('nameplate.tapPositionLeftPercent', e.target.value)} className="table-input" placeholder="%" style={{ width: '60px' }} />
                </div>
              </td>
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
                <th style={{ width: '15%' }}>NETA Section</th>
                <th style={{ width: '60%' }}>Description</th>
                <th style={{ width: '25%' }}>Result</th>
              </tr>
            </thead>
            <tbody>
              {formData.visualInspectionItems.map((item, index) => (
                <tr key={item.netaSection}>
                  <td style={{ fontWeight: 500 }}>{item.netaSection}</td>
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

      {/* Insulation Resistance Tests */}
      <div className="report-section">
        <div className="section-divider"></div>
        <h2 className="section-title">Electrical Tests - Insulation Resistance</h2>
        <div className="table-container" style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Winding</th>
                <th>Test Voltage</th>
                <th>0.5 Min</th>
                <th>1 Min</th>
                <th>Units</th>
                <th>Corrected 0.5 Min</th>
                <th>Corrected 1 Min</th>
                <th>Units</th>
                <th>Table Min</th>
                <th>Units</th>
              </tr>
            </thead>
            <tbody>
              {formData.insulationResistance.tests.map((test, index) => (
                <tr key={index}>
                  <td style={{ fontWeight: 500 }}>{test.winding}</td>
                  <td>
                    <select value={test.testVoltage} onChange={(e) => handleInsulationChange(index, 'testVoltage', e.target.value)} className="table-input">
                      {TEST_VOLTAGE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </td>
                  <td><input type="text" value={test.measured0_5Min} onChange={(e) => handleInsulationChange(index, 'measured0_5Min', e.target.value)} className="table-input" /></td>
                  <td><input type="text" value={test.measured1Min} onChange={(e) => handleInsulationChange(index, 'measured1Min', e.target.value)} className="table-input" /></td>
                  <td>
                    <select value={test.units} onChange={(e) => handleInsulationChange(index, 'units', e.target.value)} className="table-input">
                      {INSULATION_RESISTANCE_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </td>
                  <td><input type="text" value={test.corrected0_5Min} onChange={(e) => handleInsulationChange(index, 'corrected0_5Min', e.target.value)} className="table-input" /></td>
                  <td><input type="text" value={test.corrected1Min} onChange={(e) => handleInsulationChange(index, 'corrected1Min', e.target.value)} className="table-input" /></td>
                  <td>
                    <select value={test.correctedUnits} onChange={(e) => handleInsulationChange(index, 'correctedUnits', e.target.value)} className="table-input">
                      {INSULATION_RESISTANCE_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </td>
                  <td><input type="text" value={test.tableMinimum} onChange={(e) => handleInsulationChange(index, 'tableMinimum', e.target.value)} className="table-input" /></td>
                  <td>
                    <select value={test.tableMinimumUnits} onChange={(e) => handleInsulationChange(index, 'tableMinimumUnits', e.target.value)} className="table-input">
                      {INSULATION_RESISTANCE_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Dielectric Absorption Ratio */}
        <h3 style={{ fontSize: '1rem', fontWeight: 500, marginTop: '16px', marginBottom: '8px' }}>Dielectric Absorption Ratio</h3>
        <table className="data-table">
          <tbody>
            <tr>
              <td className="label-cell">Calculated As:</td>
              <td><input type="text" value={formData.insulationResistance.dielectricAbsorptionRatio.calculatedAs} readOnly className="table-input" style={{ backgroundColor: '#f3f4f6' }} /></td>
              <td className="label-cell">Minimum DAR:</td>
              <td><input type="text" value={formData.insulationResistance.dielectricAbsorptionRatio.minimumDAR} onChange={(e) => handleInputChange('insulationResistance.dielectricAbsorptionRatio.minimumDAR', e.target.value)} className="table-input" /></td>
            </tr>
            <tr>
              <td className="label-cell">Pri to Gnd:</td>
              <td><input type="text" value={formData.insulationResistance.dielectricAbsorptionRatio.priToGnd} onChange={(e) => handleInputChange('insulationResistance.dielectricAbsorptionRatio.priToGnd', e.target.value)} className="table-input" /></td>
              <td className="label-cell">Sec to Gnd:</td>
              <td><input type="text" value={formData.insulationResistance.dielectricAbsorptionRatio.secToGnd} onChange={(e) => handleInputChange('insulationResistance.dielectricAbsorptionRatio.secToGnd', e.target.value)} className="table-input" /></td>
            </tr>
            <tr>
              <td className="label-cell">Pri to Sec:</td>
              <td><input type="text" value={formData.insulationResistance.dielectricAbsorptionRatio.priToSec} onChange={(e) => handleInputChange('insulationResistance.dielectricAbsorptionRatio.priToSec', e.target.value)} className="table-input" /></td>
              <td className="label-cell">Pass/Fail:</td>
              <td>
                <select value={formData.insulationResistance.dielectricAbsorptionRatio.passFail} onChange={(e) => handleInputChange('insulationResistance.dielectricAbsorptionRatio.passFail', e.target.value)} className="table-input">
                  {PASS_FAIL_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Turns Ratio Tests */}
      <div className="report-section">
        <div className="section-divider"></div>
        <h2 className="section-title">Electrical Tests - Turns Ratio</h2>
        <table className="data-table" style={{ marginBottom: '16px' }}>
          <tbody>
            <tr>
              <td className="label-cell">Secondary Winding Voltage:</td>
              <td><input type="text" value={formData.turnsRatio.secondaryWindingVoltage} onChange={(e) => handleInputChange('turnsRatio.secondaryWindingVoltage', e.target.value)} className="table-input" /></td>
            </tr>
          </tbody>
        </table>
        <div className="table-container" style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Tap</th>
                <th>Nameplate Voltage</th>
                <th>Calculated Ratio</th>
                <th>H1-H2 Measured</th>
                <th>H1-H2 Dev %</th>
                <th>H1-H2 P/F</th>
                <th>H2-H3 Measured</th>
                <th>H2-H3 Dev %</th>
                <th>H2-H3 P/F</th>
                <th>H3-H1 Measured</th>
                <th>H3-H1 Dev %</th>
                <th>H3-H1 P/F</th>
              </tr>
            </thead>
            <tbody>
              {formData.turnsRatio.tests.map((test, index) => (
                <tr key={index}>
                  <td style={{ fontWeight: 500, textAlign: 'center' }}>{test.tap}</td>
                  <td><input type="text" value={test.nameplateVoltage} onChange={(e) => handleTurnsRatioChange(index, 'nameplateVoltage', e.target.value)} className="table-input" /></td>
                  <td><input type="text" value={test.calculatedRatio} onChange={(e) => handleTurnsRatioChange(index, 'calculatedRatio', e.target.value)} className="table-input" /></td>
                  <td><input type="text" value={test.measuredH1H2} onChange={(e) => handleTurnsRatioChange(index, 'measuredH1H2', e.target.value)} className="table-input" /></td>
                  <td><input type="text" value={test.devH1H2} onChange={(e) => handleTurnsRatioChange(index, 'devH1H2', e.target.value)} className="table-input" /></td>
                  <td>
                    <select value={test.passFailH1H2} onChange={(e) => handleTurnsRatioChange(index, 'passFailH1H2', e.target.value)} className="table-input">
                      {PASS_FAIL_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </td>
                  <td><input type="text" value={test.measuredH2H3} onChange={(e) => handleTurnsRatioChange(index, 'measuredH2H3', e.target.value)} className="table-input" /></td>
                  <td><input type="text" value={test.devH2H3} onChange={(e) => handleTurnsRatioChange(index, 'devH2H3', e.target.value)} className="table-input" /></td>
                  <td>
                    <select value={test.passFailH2H3} onChange={(e) => handleTurnsRatioChange(index, 'passFailH2H3', e.target.value)} className="table-input">
                      {PASS_FAIL_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </td>
                  <td><input type="text" value={test.measuredH3H1} onChange={(e) => handleTurnsRatioChange(index, 'measuredH3H1', e.target.value)} className="table-input" /></td>
                  <td><input type="text" value={test.devH3H1} onChange={(e) => handleTurnsRatioChange(index, 'devH3H1', e.target.value)} className="table-input" /></td>
                  <td>
                    <select value={test.passFailH3H1} onChange={(e) => handleTurnsRatioChange(index, 'passFailH3H1', e.target.value)} className="table-input">
                      {PASS_FAIL_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
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
              <td className="label-cell">TTR Test Set:</td>
              <td><input type="text" value={formData.testEquipment.ttrTestSet.name} onChange={(e) => handleInputChange('testEquipment.ttrTestSet.name', e.target.value)} className="table-input" /></td>
              <td className="label-cell">Serial Number:</td>
              <td><input type="text" value={formData.testEquipment.ttrTestSet.serialNumber} onChange={(e) => handleInputChange('testEquipment.ttrTestSet.serialNumber', e.target.value)} className="table-input" /></td>
              <td className="label-cell">AMP ID:</td>
              <td><input type="text" value={formData.testEquipment.ttrTestSet.ampId} onChange={(e) => handleInputChange('testEquipment.ttrTestSet.ampId', e.target.value)} className="table-input" /></td>
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

export default TwoSmallDryTypeXfmrATSReport;

