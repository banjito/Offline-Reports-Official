// MediumVoltageCableVLFTestReport.tsx - Medium Voltage Cable VLF Test With Tan Delta
// Matches: medium-voltage-cable-vlf-test (4-Medium Voltage Cable VLF Test With Tan Delta ATS)
// Also handles: medium-voltage-cable-vlf-test-mts (MTS version)
// Database table: medium_voltage_cable_vlf_test

import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import './ReportStyles.css';

// Enums
enum InspectionResult {
  SELECT = 'select one',
  SATISFACTORY = 'satisfactory',
  UNSATISFACTORY = 'unsatisfactory',
  CLEANED = 'cleaned',
  SEE_COMMENTS = 'see comments',
  NONE = 'Not Applicable'
}

// Temperature Correction Factor Table
const TCF_TABLE: { [key: number]: number } = {
  0: 0.4, 5: 0.5, 10: 0.63, 15: 0.81, 20: 1.0, 25: 1.25, 30: 1.58, 35: 2.0,
  40: 2.5, 45: 3.15, 50: 3.98, 55: 5.0, 60: 6.3, 65: 7.9, 70: 10.0
};

const getTCF = (celsius: number): number => {
  const temps = Object.keys(TCF_TABLE).map(Number).sort((a, b) => a - b);
  if (celsius <= temps[0]) return TCF_TABLE[temps[0]];
  if (celsius >= temps[temps.length - 1]) return TCF_TABLE[temps[temps.length - 1]];
  
  for (let i = 0; i < temps.length - 1; i++) {
    if (celsius >= temps[i] && celsius <= temps[i + 1]) {
      const ratio = (celsius - temps[i]) / (temps[i + 1] - temps[i]);
      return TCF_TABLE[temps[i]] + ratio * (TCF_TABLE[temps[i + 1]] - TCF_TABLE[temps[i]]);
    }
  }
  return 1.0;
};

interface TanDeltaValue {
  voltageStep: string;
  kV: string;
  phaseA: { td: string; stdDev: string; };
  phaseB: { td: string; stdDev: string; };
  phaseC: { td: string; stdDev: string; };
}

interface WithstandReading {
  timeMinutes: string;
  kVAC: string;
  phaseA: { mA: string; nF: string; };
  phaseB: { mA: string; nF: string; };
  phaseC: { mA: string; nF: string; };
}

interface FormData {
  // Job Information
  customerName: string;
  siteAddress: string;
  jobNumber: string;
  testDate: string;
  testedBy: string;
  location: string;
  equipmentLocation: string;
  status: 'PASS' | 'FAIL';
  
  // Cable Information
  cableInfo: {
    description: string;
    size: string;
    length: string;
    voltageRating: string;
    insulation: string;
    yearInstalled: string;
    testedFrom: string;
    testedTo: string;
    manufacturer: string;
    conductorMaterial: string;
  };
  
  // Termination Data
  terminationData: {
    terminationData: string;
    ratedVoltage: string;
    terminationData2: string;
    ratedVoltage2: string;
  };
  
  // Visual Inspection
  visualInspection: {
    inspectCablesAndConnectors: InspectionResult;
    inspectTerminationsAndSplices: InspectionResult;
    useOhmmeter: InspectionResult;
    inspectShieldGrounding: InspectionResult;
    verifyBendRadius: InspectionResult;
    inspectCurrentTransformers: InspectionResult;
  };
  
  // Shield Continuity
  shieldContinuity: {
    phaseA: string;
    phaseB: string;
    phaseC: string;
    unit: string;
  };
  
  // Insulation Test
  insulationTest: {
    testVoltage: string;
    unit: string;
    preTest: { ag: string; bg: string; cg: string; };
    postTest: { ag: string; bg: string; cg: string; };
    preTestCorrected: { ag: string; bg: string; cg: string; };
    postTestCorrected: { ag: string; bg: string; cg: string; };
  };
  
  // Withstand Test
  withstandTest: {
    readings: WithstandReading[];
  };
  
  // Tan Delta Test
  tanDeltaTest: {
    systemVoltageL2G: string;
    frequency: string;
    values: TanDeltaValue[];
  };
  
  // Temperature
  temperature: {
    fahrenheit: number;
    celsius: number;
    humidity: number;
    tcf: number;
  };
  
  // Equipment
  equipment: {
    ohmmeter: string;
    ohmSerialNumber: string;
    ohmAmpId: string;
    megohmmeter: string;
    megohmSerialNumber: string;
    megohmAmpId: string;
    vlfHipot: string;
    vlfSerialNumber: string;
    vlfAmpId: string;
  };
  
  // Comments
  comments: string;
}

const initialTanDeltaValues: TanDeltaValue[] = [
  { voltageStep: '0.5 Uo', kV: '7.200', phaseA: { td: '', stdDev: '' }, phaseB: { td: '', stdDev: '' }, phaseC: { td: '', stdDev: '' } },
  { voltageStep: '1.0 Uo', kV: '14.400', phaseA: { td: '', stdDev: '' }, phaseB: { td: '', stdDev: '' }, phaseC: { td: '', stdDev: '' } },
  { voltageStep: '1.5 Uo', kV: '21.600', phaseA: { td: '', stdDev: '' }, phaseB: { td: '', stdDev: '' }, phaseC: { td: '', stdDev: '' } },
  { voltageStep: '2.0 Uo', kV: '28.800', phaseA: { td: '', stdDev: '' }, phaseB: { td: '', stdDev: '' }, phaseC: { td: '', stdDev: '' } },
];

const initialWithstandReadings: WithstandReading[] = [
  { timeMinutes: '10', kVAC: '13', phaseA: { mA: '', nF: '' }, phaseB: { mA: '', nF: '' }, phaseC: { mA: '', nF: '' } },
  { timeMinutes: '20', kVAC: '13', phaseA: { mA: '', nF: '' }, phaseB: { mA: '', nF: '' }, phaseC: { mA: '', nF: '' } },
  { timeMinutes: '30', kVAC: '13', phaseA: { mA: '', nF: '' }, phaseB: { mA: '', nF: '' }, phaseC: { mA: '', nF: '' } },
  { timeMinutes: '40', kVAC: '13', phaseA: { mA: '', nF: '' }, phaseB: { mA: '', nF: '' }, phaseC: { mA: '', nF: '' } },
  { timeMinutes: '50', kVAC: '13', phaseA: { mA: '', nF: '' }, phaseB: { mA: '', nF: '' }, phaseC: { mA: '', nF: '' } },
  { timeMinutes: '60', kVAC: '13', phaseA: { mA: '', nF: '' }, phaseB: { mA: '', nF: '' }, phaseC: { mA: '', nF: '' } },
];

const initialFormData: FormData = {
  customerName: '',
  siteAddress: '',
  jobNumber: '',
  testDate: '',
  testedBy: '',
  location: '',
  equipmentLocation: '',
  status: 'PASS',
  cableInfo: {
    description: '', size: '', length: '', voltageRating: '',
    insulation: '', yearInstalled: '', testedFrom: '', testedTo: '',
    manufacturer: '', conductorMaterial: ''
  },
  terminationData: {
    terminationData: '', ratedVoltage: '', terminationData2: '', ratedVoltage2: ''
  },
  visualInspection: {
    inspectCablesAndConnectors: InspectionResult.SELECT,
    inspectTerminationsAndSplices: InspectionResult.SELECT,
    useOhmmeter: InspectionResult.SELECT,
    inspectShieldGrounding: InspectionResult.SELECT,
    verifyBendRadius: InspectionResult.SELECT,
    inspectCurrentTransformers: InspectionResult.SELECT
  },
  shieldContinuity: { phaseA: '', phaseB: '', phaseC: '', unit: 'Ω' },
  insulationTest: {
    testVoltage: '1000', unit: 'GΩ',
    preTest: { ag: '', bg: '', cg: '' },
    postTest: { ag: '', bg: '', cg: '' },
    preTestCorrected: { ag: '', bg: '', cg: '' },
    postTestCorrected: { ag: '', bg: '', cg: '' }
  },
  withstandTest: { readings: JSON.parse(JSON.stringify(initialWithstandReadings)) },
  tanDeltaTest: {
    systemVoltageL2G: '14.4',
    frequency: '0.1',
    values: JSON.parse(JSON.stringify(initialTanDeltaValues))
  },
  temperature: { fahrenheit: 68, celsius: 20, humidity: 0, tcf: 1.0 },
  equipment: {
    ohmmeter: '', ohmSerialNumber: '', ohmAmpId: '',
    megohmmeter: '', megohmSerialNumber: '', megohmAmpId: '',
    vlfHipot: '', vlfSerialNumber: '', vlfAmpId: ''
  },
  comments: ''
};

interface MediumVoltageCableVLFTestReportProps {
  reportId?: string;
  jobId?: string;
  job?: any;
  isEditing?: boolean;
  onSave?: (data: any) => void;
  reportData?: any;
  isMTS?: boolean;
}

const MediumVoltageCableVLFTestReport: React.FC<MediumVoltageCableVLFTestReportProps> = ({
  job,
  isEditing = false,
  onSave,
  reportData: initialReportData,
  isMTS = false
}) => {
  const [formData, setFormData] = useState<FormData>(JSON.parse(JSON.stringify(initialFormData)));
  const [loading, setLoading] = useState(true);
  const [editingTanDelta, setEditingTanDelta] = useState(false);

  // Auto-calculate TCF and corrected values
  useEffect(() => {
    const tcf = getTCF(formData.temperature.celsius);
    setFormData(prev => ({
      ...prev,
      temperature: { ...prev.temperature, tcf },
      insulationTest: {
        ...prev.insulationTest,
        preTestCorrected: {
          ag: calculateCorrected(prev.insulationTest.preTest.ag, tcf),
          bg: calculateCorrected(prev.insulationTest.preTest.bg, tcf),
          cg: calculateCorrected(prev.insulationTest.preTest.cg, tcf)
        },
        postTestCorrected: {
          ag: calculateCorrected(prev.insulationTest.postTest.ag, tcf),
          bg: calculateCorrected(prev.insulationTest.postTest.bg, tcf),
          cg: calculateCorrected(prev.insulationTest.postTest.cg, tcf)
        }
      }
    }));
  }, [formData.temperature.celsius, formData.insulationTest.preTest, formData.insulationTest.postTest]);

  const calculateCorrected = (value: string, tcf: number): string => {
    if (!value) return '';
    const num = parseFloat(value);
    if (isNaN(num)) return value;
    return (num * tcf).toFixed(2);
  };

  useEffect(() => {
    setLoading(true);
    try {
      if (initialReportData) loadFromProps(initialReportData);
      if (job) {
        setFormData(prev => ({
          ...prev,
          customerName: job.customer_name || job.customerName || prev.customerName,
          siteAddress: job.site_address || job.siteAddress || prev.siteAddress,
          jobNumber: job.job_number || job.jobNumber || prev.jobNumber
        }));
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, [initialReportData, job]);

  const loadFromProps = (data: any) => {
    const reportInfo = data.report_info || data.reportInfo || {};
    const cableInfo = data.cable_info || data.cableInfo || {};
    const termData = data.termination_data || data.terminationData || {};
    const visInsp = data.visual_inspection || data.visualInspection || {};
    const shieldCont = data.shield_continuity || data.shieldContinuity || {};
    const insTest = data.insulation_test || data.insulationTest || {};
    const withTest = data.withstand_test || data.withstandTest || {};
    const tanDelta = data.tan_delta_test || data.tanDeltaTest || {};
    const temp = data.temperature || {};
    const equip = data.equipment || data.test_equipment || {};

    setFormData(prev => ({
      ...prev,
      customerName: data.customerName || data.customer_name || reportInfo.customerName || prev.customerName,
      siteAddress: data.siteAddress || data.site_address || prev.siteAddress,
      jobNumber: data.jobNumber || data.job_number || prev.jobNumber,
      testDate: data.testDate || data.test_date || reportInfo.date || prev.testDate,
      testedBy: data.testedBy || data.tested_by || prev.testedBy,
      location: data.location || prev.location,
      equipmentLocation: data.equipmentLocation || data.equipment_location || prev.equipmentLocation,
      status: data.status || reportInfo.status || prev.status,
      cableInfo: { ...prev.cableInfo, ...cableInfo },
      terminationData: { ...prev.terminationData, ...termData },
      visualInspection: { ...prev.visualInspection, ...visInsp },
      shieldContinuity: { ...prev.shieldContinuity, ...shieldCont },
      insulationTest: {
        ...prev.insulationTest,
        testVoltage: insTest.testVoltage || insTest.test_voltage || prev.insulationTest.testVoltage,
        unit: insTest.unit || prev.insulationTest.unit,
        preTest: { ...prev.insulationTest.preTest, ...(insTest.preTest || insTest.pre_test || {}) },
        postTest: { ...prev.insulationTest.postTest, ...(insTest.postTest || insTest.post_test || {}) }
      },
      withstandTest: {
        readings: withTest.readings || prev.withstandTest.readings
      },
      tanDeltaTest: {
        systemVoltageL2G: tanDelta.systemVoltageL2G || tanDelta.system_voltage_l2g || prev.tanDeltaTest.systemVoltageL2G,
        frequency: tanDelta.frequency || prev.tanDeltaTest.frequency,
        values: tanDelta.values || prev.tanDeltaTest.values
      },
      temperature: {
        fahrenheit: temp.fahrenheit ?? prev.temperature.fahrenheit,
        celsius: temp.celsius ?? prev.temperature.celsius,
        humidity: temp.humidity ?? prev.temperature.humidity,
        tcf: temp.tcf ?? prev.temperature.tcf
      },
      equipment: { ...prev.equipment, ...equip },
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

  const handleInsulationChange = (testType: 'preTest' | 'postTest', field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      insulationTest: {
        ...prev.insulationTest,
        [testType]: { ...prev.insulationTest[testType], [field]: value }
      }
    }));
  };

  const handleWithstandChange = (index: number, field: string, value: any) => {
    setFormData(prev => {
      const newReadings = [...prev.withstandTest.readings];
      if (field.includes('.')) {
        const [phase, subField] = field.split('.');
        (newReadings[index] as any)[phase] = {
          ...(newReadings[index] as any)[phase],
          [subField]: value
        };
      } else {
        (newReadings[index] as any)[field] = value;
      }
      return { ...prev, withstandTest: { readings: newReadings } };
    });
  };

  const handleTanDeltaChange = (index: number, phase: string, field: string, value: string) => {
    setFormData(prev => {
      const newValues = [...prev.tanDeltaTest.values];
      if (phase === 'kV' || phase === 'voltageStep') {
        (newValues[index] as any)[phase] = value;
      } else {
        (newValues[index] as any)[phase] = {
          ...(newValues[index] as any)[phase],
          [field]: value
        };
      }
      return { ...prev, tanDeltaTest: { ...prev.tanDeltaTest, values: newValues } };
    });
  };

  const handleTemperatureChange = (unit: 'fahrenheit' | 'celsius', value: number) => {
    let fahrenheit = formData.temperature.fahrenheit;
    let celsius = formData.temperature.celsius;
    
    if (unit === 'fahrenheit') {
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

  if (loading) {
    return <div className="report-container"><p>Loading report...</p></div>;
  }

  const inspectionOptions = Object.values(InspectionResult);
  const reportTitle = isMTS 
    ? '4-Medium Voltage Cable VLF Test With Tan Delta MTS' 
    : '4-Medium Voltage Cable VLF Test With Tan Delta ATS';
  const netaRef = isMTS ? 'NETA - MTS' : 'NETA - ATS 7.3.3';

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
          <h1>{reportTitle}</h1>
          <p className="neta-reference">{netaRef}</p>
        </div>
        <div className={`status-badge ${formData.status === 'PASS' ? 'status-pass' : 'status-fail'}`}>
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
              <td className="label-cell">Customer Name:</td>
              <td><input type="text" value={formData.customerName} onChange={(e) => handleInputChange('customerName', e.target.value)} readOnly={!isEditing} className="table-input" /></td>
              <td className="label-cell">Job Number:</td>
              <td><input type="text" value={formData.jobNumber} onChange={(e) => handleInputChange('jobNumber', e.target.value)} readOnly={!isEditing} className="table-input" /></td>
            </tr>
            <tr>
              <td className="label-cell">Site Address:</td>
              <td colSpan={3}><input type="text" value={formData.siteAddress} onChange={(e) => handleInputChange('siteAddress', e.target.value)} readOnly={!isEditing} className="table-input" /></td>
            </tr>
            <tr>
              <td className="label-cell">Test Date:</td>
              <td><input type="date" value={formData.testDate} onChange={(e) => handleInputChange('testDate', e.target.value)} readOnly={!isEditing} className="table-input" /></td>
              <td className="label-cell">Tested By:</td>
              <td><input type="text" value={formData.testedBy} onChange={(e) => handleInputChange('testedBy', e.target.value)} readOnly={!isEditing} className="table-input" /></td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Cable Information */}
      <div className="report-section">
        <div className="section-divider"></div>
        <h2 className="section-title">Cable Information</h2>
        <table className="data-table">
          <tbody>
            <tr>
              <td className="label-cell">Description:</td>
              <td colSpan={3}><input type="text" value={formData.cableInfo.description} onChange={(e) => handleNestedChange('cableInfo', 'description', e.target.value)} readOnly={!isEditing} className="table-input" /></td>
            </tr>
            <tr>
              <td className="label-cell">Size:</td>
              <td><input type="text" value={formData.cableInfo.size} onChange={(e) => handleNestedChange('cableInfo', 'size', e.target.value)} readOnly={!isEditing} className="table-input" /></td>
              <td className="label-cell">Length:</td>
              <td><input type="text" value={formData.cableInfo.length} onChange={(e) => handleNestedChange('cableInfo', 'length', e.target.value)} readOnly={!isEditing} className="table-input" /></td>
            </tr>
            <tr>
              <td className="label-cell">Voltage Rating:</td>
              <td><input type="text" value={formData.cableInfo.voltageRating} onChange={(e) => handleNestedChange('cableInfo', 'voltageRating', e.target.value)} readOnly={!isEditing} className="table-input" /></td>
              <td className="label-cell">Insulation:</td>
              <td><input type="text" value={formData.cableInfo.insulation} onChange={(e) => handleNestedChange('cableInfo', 'insulation', e.target.value)} readOnly={!isEditing} className="table-input" /></td>
            </tr>
            <tr>
              <td className="label-cell">Tested From:</td>
              <td><input type="text" value={formData.cableInfo.testedFrom} onChange={(e) => handleNestedChange('cableInfo', 'testedFrom', e.target.value)} readOnly={!isEditing} className="table-input" /></td>
              <td className="label-cell">Tested To:</td>
              <td><input type="text" value={formData.cableInfo.testedTo} onChange={(e) => handleNestedChange('cableInfo', 'testedTo', e.target.value)} readOnly={!isEditing} className="table-input" /></td>
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
              <th>Inspection Item</th>
              <th>Result</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Inspect cables and connectors for physical damage</td>
              <td>
                <select value={formData.visualInspection.inspectCablesAndConnectors} onChange={(e) => handleNestedChange('visualInspection', 'inspectCablesAndConnectors', e.target.value)} disabled={!isEditing} className="table-input">
                  {inspectionOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </td>
            </tr>
            <tr>
              <td>Inspect terminations and splices</td>
              <td>
                <select value={formData.visualInspection.inspectTerminationsAndSplices} onChange={(e) => handleNestedChange('visualInspection', 'inspectTerminationsAndSplices', e.target.value)} disabled={!isEditing} className="table-input">
                  {inspectionOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </td>
            </tr>
            <tr>
              <td>Use ohmmeter to verify shield continuity</td>
              <td>
                <select value={formData.visualInspection.useOhmmeter} onChange={(e) => handleNestedChange('visualInspection', 'useOhmmeter', e.target.value)} disabled={!isEditing} className="table-input">
                  {inspectionOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </td>
            </tr>
            <tr>
              <td>Inspect shield grounding, cable support, and fireproofing</td>
              <td>
                <select value={formData.visualInspection.inspectShieldGrounding} onChange={(e) => handleNestedChange('visualInspection', 'inspectShieldGrounding', e.target.value)} disabled={!isEditing} className="table-input">
                  {inspectionOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </td>
            </tr>
            <tr>
              <td>Verify cable bending radius meets manufacturer requirements</td>
              <td>
                <select value={formData.visualInspection.verifyBendRadius} onChange={(e) => handleNestedChange('visualInspection', 'verifyBendRadius', e.target.value)} disabled={!isEditing} className="table-input">
                  {inspectionOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </td>
            </tr>
            <tr>
              <td>Inspect current transformers for proper installation</td>
              <td>
                <select value={formData.visualInspection.inspectCurrentTransformers} onChange={(e) => handleNestedChange('visualInspection', 'inspectCurrentTransformers', e.target.value)} disabled={!isEditing} className="table-input">
                  {inspectionOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Temperature & TCF */}
      <div className="report-section">
        <div className="section-divider"></div>
        <h2 className="section-title">Temperature Correction</h2>
        <table className="data-table">
          <tbody>
            <tr>
              <td className="label-cell">Temperature (°F):</td>
              <td><input type="number" value={formData.temperature.fahrenheit} onChange={(e) => handleTemperatureChange('fahrenheit', parseFloat(e.target.value) || 0)} readOnly={!isEditing} className="table-input" /></td>
              <td className="label-cell">Temperature (°C):</td>
              <td><input type="number" value={formData.temperature.celsius} onChange={(e) => handleTemperatureChange('celsius', parseFloat(e.target.value) || 0)} readOnly={!isEditing} className="table-input" /></td>
              <td className="label-cell">TCF:</td>
              <td><input type="text" value={formData.temperature.tcf.toFixed(3)} readOnly className="table-input formula-field" /></td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Shield Continuity */}
      <div className="report-section">
        <div className="section-divider"></div>
        <h2 className="section-title">Electrical Tests - Shield Continuity</h2>
        <table className="data-table">
          <thead>
            <tr>
              <th>Phase A</th>
              <th>Phase B</th>
              <th>Phase C</th>
              <th>Unit</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><input type="text" value={formData.shieldContinuity.phaseA} onChange={(e) => handleNestedChange('shieldContinuity', 'phaseA', e.target.value)} readOnly={!isEditing} className="table-input" /></td>
              <td><input type="text" value={formData.shieldContinuity.phaseB} onChange={(e) => handleNestedChange('shieldContinuity', 'phaseB', e.target.value)} readOnly={!isEditing} className="table-input" /></td>
              <td><input type="text" value={formData.shieldContinuity.phaseC} onChange={(e) => handleNestedChange('shieldContinuity', 'phaseC', e.target.value)} readOnly={!isEditing} className="table-input" /></td>
              <td>
                <select value={formData.shieldContinuity.unit} onChange={(e) => handleNestedChange('shieldContinuity', 'unit', e.target.value)} disabled={!isEditing} className="table-input">
                  <option value="Ω">Ω</option>
                  <option value="mΩ">mΩ</option>
                  <option value="μΩ">μΩ</option>
                </select>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Insulation Resistance */}
      <div className="report-section">
        <div className="section-divider"></div>
        <h2 className="section-title">Electrical Tests - Insulation Resistance</h2>
        <table className="data-table" style={{ marginTop: '10px' }}>
          <thead>
            <tr>
              <th></th>
              <th>A-G</th>
              <th>B-G</th>
              <th>C-G</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="label-cell">Pre-Test</td>
              <td><input type="text" value={formData.insulationTest.preTest.ag} onChange={(e) => handleInsulationChange('preTest', 'ag', e.target.value)} readOnly={!isEditing} className="table-input" /></td>
              <td><input type="text" value={formData.insulationTest.preTest.bg} onChange={(e) => handleInsulationChange('preTest', 'bg', e.target.value)} readOnly={!isEditing} className="table-input" /></td>
              <td><input type="text" value={formData.insulationTest.preTest.cg} onChange={(e) => handleInsulationChange('preTest', 'cg', e.target.value)} readOnly={!isEditing} className="table-input" /></td>
            </tr>
            <tr>
              <td className="label-cell">Pre-Test Corrected</td>
              <td><input type="text" value={formData.insulationTest.preTestCorrected.ag} readOnly className="table-input formula-field" /></td>
              <td><input type="text" value={formData.insulationTest.preTestCorrected.bg} readOnly className="table-input formula-field" /></td>
              <td><input type="text" value={formData.insulationTest.preTestCorrected.cg} readOnly className="table-input formula-field" /></td>
            </tr>
            <tr>
              <td className="label-cell">Post-Test</td>
              <td><input type="text" value={formData.insulationTest.postTest.ag} onChange={(e) => handleInsulationChange('postTest', 'ag', e.target.value)} readOnly={!isEditing} className="table-input" /></td>
              <td><input type="text" value={formData.insulationTest.postTest.bg} onChange={(e) => handleInsulationChange('postTest', 'bg', e.target.value)} readOnly={!isEditing} className="table-input" /></td>
              <td><input type="text" value={formData.insulationTest.postTest.cg} onChange={(e) => handleInsulationChange('postTest', 'cg', e.target.value)} readOnly={!isEditing} className="table-input" /></td>
            </tr>
            <tr>
              <td className="label-cell">Post-Test Corrected</td>
              <td><input type="text" value={formData.insulationTest.postTestCorrected.ag} readOnly className="table-input formula-field" /></td>
              <td><input type="text" value={formData.insulationTest.postTestCorrected.bg} readOnly className="table-input formula-field" /></td>
              <td><input type="text" value={formData.insulationTest.postTestCorrected.cg} readOnly className="table-input formula-field" /></td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Withstand Test */}
      <div className="report-section">
        <div className="section-divider"></div>
        <h2 className="section-title">Electrical Tests - Withstand Test</h2>
        <div className="table-container" style={{ overflowX: 'auto' }}>
          <table className="data-table" style={{ minWidth: '900px' }}>
            <thead>
              <tr>
                <th rowSpan={2}>Time (min)</th>
                <th rowSpan={2}>kVAC</th>
                <th colSpan={2}>Phase A</th>
                <th colSpan={2}>Phase B</th>
                <th colSpan={2}>Phase C</th>
              </tr>
              <tr>
                <th>mA</th>
                <th>nF</th>
                <th>mA</th>
                <th>nF</th>
                <th>mA</th>
                <th>nF</th>
              </tr>
            </thead>
            <tbody>
              {formData.withstandTest.readings.map((reading, index) => (
                <tr key={index}>
                  <td><input type="text" value={reading.timeMinutes} onChange={(e) => handleWithstandChange(index, 'timeMinutes', e.target.value)} readOnly={!isEditing} className="table-input" /></td>
                  <td><input type="text" value={reading.kVAC} onChange={(e) => handleWithstandChange(index, 'kVAC', e.target.value)} readOnly={!isEditing} className="table-input" /></td>
                  <td><input type="text" value={reading.phaseA.mA} onChange={(e) => handleWithstandChange(index, 'phaseA.mA', e.target.value)} readOnly={!isEditing} className="table-input" /></td>
                  <td><input type="text" value={reading.phaseA.nF} onChange={(e) => handleWithstandChange(index, 'phaseA.nF', e.target.value)} readOnly={!isEditing} className="table-input" /></td>
                  <td><input type="text" value={reading.phaseB.mA} onChange={(e) => handleWithstandChange(index, 'phaseB.mA', e.target.value)} readOnly={!isEditing} className="table-input" /></td>
                  <td><input type="text" value={reading.phaseB.nF} onChange={(e) => handleWithstandChange(index, 'phaseB.nF', e.target.value)} readOnly={!isEditing} className="table-input" /></td>
                  <td><input type="text" value={reading.phaseC.mA} onChange={(e) => handleWithstandChange(index, 'phaseC.mA', e.target.value)} readOnly={!isEditing} className="table-input" /></td>
                  <td><input type="text" value={reading.phaseC.nF} onChange={(e) => handleWithstandChange(index, 'phaseC.nF', e.target.value)} readOnly={!isEditing} className="table-input" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tan Delta Test */}
      <div className="report-section">
        <div className="section-divider"></div>
        <h2 className="section-title">Tan Delta Test</h2>
        <table className="data-table">
          <tbody>
            <tr>
              <td className="label-cell">System Voltage L-G (kV):</td>
              <td><input type="text" value={formData.tanDeltaTest.systemVoltageL2G} onChange={(e) => handleNestedChange('tanDeltaTest', 'systemVoltageL2G', e.target.value)} readOnly={!isEditing} className="table-input" /></td>
              <td className="label-cell">Frequency (Hz):</td>
              <td><input type="text" value={formData.tanDeltaTest.frequency} onChange={(e) => handleNestedChange('tanDeltaTest', 'frequency', e.target.value)} readOnly={!isEditing} className="table-input" /></td>
            </tr>
          </tbody>
        </table>
        {isEditing && (
          <button onClick={() => setEditingTanDelta(!editingTanDelta)} className="edit-data-btn" style={{ marginTop: '10px', marginBottom: '10px' }}>
            {editingTanDelta ? 'Lock Data' : 'Edit Data'}
          </button>
        )}
        <div className="table-container" style={{ overflowX: 'auto', marginTop: '10px' }}>
          <table className="data-table" style={{ minWidth: '800px' }}>
            <thead>
              <tr>
                <th rowSpan={2}>Voltage Step</th>
                <th rowSpan={2}>kV</th>
                <th colSpan={2}>Phase A</th>
                <th colSpan={2}>Phase B</th>
                <th colSpan={2}>Phase C</th>
              </tr>
              <tr>
                <th>TD [E-3]</th>
                <th>Std Dev</th>
                <th>TD [E-3]</th>
                <th>Std Dev</th>
                <th>TD [E-3]</th>
                <th>Std Dev</th>
              </tr>
            </thead>
            <tbody>
              {formData.tanDeltaTest.values.map((val, index) => (
                <tr key={index}>
                  <td>
                    {editingTanDelta ? (
                      <input type="text" value={val.voltageStep} onChange={(e) => handleTanDeltaChange(index, 'voltageStep', '', e.target.value)} className="table-input" />
                    ) : val.voltageStep}
                  </td>
                  <td>
                    {editingTanDelta ? (
                      <input type="text" value={val.kV} onChange={(e) => handleTanDeltaChange(index, 'kV', '', e.target.value)} className="table-input" />
                    ) : val.kV}
                  </td>
                  <td><input type="text" value={val.phaseA.td} onChange={(e) => handleTanDeltaChange(index, 'phaseA', 'td', e.target.value)} readOnly={!editingTanDelta && !isEditing} className="table-input" /></td>
                  <td><input type="text" value={val.phaseA.stdDev} onChange={(e) => handleTanDeltaChange(index, 'phaseA', 'stdDev', e.target.value)} readOnly={!editingTanDelta && !isEditing} className="table-input" /></td>
                  <td><input type="text" value={val.phaseB.td} onChange={(e) => handleTanDeltaChange(index, 'phaseB', 'td', e.target.value)} readOnly={!editingTanDelta && !isEditing} className="table-input" /></td>
                  <td><input type="text" value={val.phaseB.stdDev} onChange={(e) => handleTanDeltaChange(index, 'phaseB', 'stdDev', e.target.value)} readOnly={!editingTanDelta && !isEditing} className="table-input" /></td>
                  <td><input type="text" value={val.phaseC.td} onChange={(e) => handleTanDeltaChange(index, 'phaseC', 'td', e.target.value)} readOnly={!editingTanDelta && !isEditing} className="table-input" /></td>
                  <td><input type="text" value={val.phaseC.stdDev} onChange={(e) => handleTanDeltaChange(index, 'phaseC', 'stdDev', e.target.value)} readOnly={!editingTanDelta && !isEditing} className="table-input" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tan Delta Chart */}
      <div className="report-section">
        <div className="section-divider"></div>
        <h2 className="section-title">Tan Delta Chart</h2>
        <div className="chart-container" style={{ width: '100%', height: 400 }}>
          <ResponsiveContainer>
            <LineChart
              data={formData.tanDeltaTest.values.map(v => ({
                kV: parseFloat(v.kV) || 0,
                phaseA: parseFloat(v.phaseA.td) || 0,
                phaseB: parseFloat(v.phaseB.td) || 0,
                phaseC: parseFloat(v.phaseC.td) || 0
              }))}
              margin={{ top: 30, right: 40, left: 30, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="kV" 
                label={{ value: 'Test Voltage (kV)', position: 'bottom', offset: 10 }} 
                padding={{ left: 20, right: 20 }}
              />
              <YAxis
                label={{ value: 'Tan Delta (E-3)', angle: -90, position: 'insideLeft', offset: -10 }}
                domain={[0, 'auto']}
                padding={{ top: 20 }}
              />
              <Tooltip formatter={(value) => [`${value}`, 'Tan Delta (E-3)']} />
              <Legend layout="horizontal" verticalAlign="top" align="center" wrapperStyle={{ paddingBottom: '20px' }} />
              <Line type="monotone" dataKey="phaseA" name="A Phase" stroke="#8884d8" activeDot={{ r: 8 }} strokeWidth={2} dot={{ strokeWidth: 2, r: 5 }} />
              <Line type="monotone" dataKey="phaseB" name="B Phase" stroke="#82ca9d" activeDot={{ r: 8 }} strokeWidth={2} dot={{ strokeWidth: 2, r: 5 }} />
              <Line type="monotone" dataKey="phaseC" name="C Phase" stroke="#ff7300" activeDot={{ r: 8 }} strokeWidth={2} dot={{ strokeWidth: 2, r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Test Equipment Used */}
      <div className="report-section">
        <div className="section-divider"></div>
        <h2 className="section-title">Test Equipment Used</h2>
        <table className="data-table">
          <thead>
            <tr>
              <th>Equipment</th>
              <th>Model</th>
              <th>Serial Number</th>
              <th>AMP ID</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="label-cell">Ohmmeter</td>
              <td><input type="text" value={formData.equipment.ohmmeter} onChange={(e) => handleNestedChange('equipment', 'ohmmeter', e.target.value)} readOnly={!isEditing} className="table-input" /></td>
              <td><input type="text" value={formData.equipment.ohmSerialNumber} onChange={(e) => handleNestedChange('equipment', 'ohmSerialNumber', e.target.value)} readOnly={!isEditing} className="table-input" /></td>
              <td><input type="text" value={formData.equipment.ohmAmpId} onChange={(e) => handleNestedChange('equipment', 'ohmAmpId', e.target.value)} readOnly={!isEditing} className="table-input" /></td>
            </tr>
            <tr>
              <td className="label-cell">Megohmmeter</td>
              <td><input type="text" value={formData.equipment.megohmmeter} onChange={(e) => handleNestedChange('equipment', 'megohmmeter', e.target.value)} readOnly={!isEditing} className="table-input" /></td>
              <td><input type="text" value={formData.equipment.megohmSerialNumber} onChange={(e) => handleNestedChange('equipment', 'megohmSerialNumber', e.target.value)} readOnly={!isEditing} className="table-input" /></td>
              <td><input type="text" value={formData.equipment.megohmAmpId} onChange={(e) => handleNestedChange('equipment', 'megohmAmpId', e.target.value)} readOnly={!isEditing} className="table-input" /></td>
            </tr>
            <tr>
              <td className="label-cell">VLF Hipot</td>
              <td><input type="text" value={formData.equipment.vlfHipot} onChange={(e) => handleNestedChange('equipment', 'vlfHipot', e.target.value)} readOnly={!isEditing} className="table-input" /></td>
              <td><input type="text" value={formData.equipment.vlfSerialNumber} onChange={(e) => handleNestedChange('equipment', 'vlfSerialNumber', e.target.value)} readOnly={!isEditing} className="table-input" /></td>
              <td><input type="text" value={formData.equipment.vlfAmpId} onChange={(e) => handleNestedChange('equipment', 'vlfAmpId', e.target.value)} readOnly={!isEditing} className="table-input" /></td>
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
          readOnly={!isEditing}
          rows={6}
          className="comments-textarea"
          placeholder="Enter any additional comments..."
        />
      </div>
    </div>
  );
};

export default MediumVoltageCableVLFTestReport;
