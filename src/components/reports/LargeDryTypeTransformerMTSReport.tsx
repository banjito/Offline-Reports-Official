import React, { useState, useEffect } from 'react';
import './ReportStyles.css';
import { ReportHeader } from './BaseReport';

interface ReportProps {
  reportData: any;
  onSave?: (data: any) => void;
  job?: any;
}

// Temperature conversion and TCF tables
const tempConvTable = [
  [-11.2, -24], [-9.4, -23], [-7.6, -22], [-5.8, -21], [-4, -20], [-2.2, -19], [1.4, -17], [3.2, -16], [5, -15], [6.8, -14], [8.6, -13], [10.4, -12], [12.2, -11], [14, -10], [15.8, -9], [17.6, -8], [19.4, -7], [21.2, -6], [23, -5], [24.8, -4], [26.6, -3], [28.4, -2], [30.2, -1], [32, 0], [33.8, 1], [35.6, 2], [37.4, 3], [39.2, 4], [41, 5], [42.8, 6], [44.6, 7], [46.4, 8], [48.2, 9], [50, 10], [51.8, 11], [53.6, 12], [55.4, 13], [57.2, 14], [59, 15], [60.8, 16], [62.6, 17], [64.4, 18], [66.2, 19], [68, 20], [70, 21], [72, 22], [73.4, 23], [75.2, 24], [77, 25], [78.8, 26], [80.6, 27], [82.4, 28], [84.2, 29], [86, 30], [87.8, 31], [89.6, 32], [91.4, 33], [93.2, 34], [95, 35], [96.8, 36], [98.6, 37], [100.4, 38], [102.2, 39], [104, 40], [105.8, 41], [107.6, 42], [109.4, 43], [111.2, 44], [113, 45], [114.8, 46], [116.6, 47], [118.4, 48], [120.2, 49], [122, 50], [123.8, 51], [125.6, 52], [127.4, 53], [129.2, 54], [131, 55], [132.8, 56], [134.6, 57], [136.4, 58], [138.2, 59], [140, 60], [141.8, 61], [143.6, 62], [145.4, 63], [147.2, 64], [149, 65]
];

const tcfTable = [
  [-24, 0.048], [-23, 0.051], [-22, 0.055], [-21, 0.059], [-20, 0.063], [-19, 0.068], [-18, 0.072], [-17, 0.077], [-16, 0.082], [-15, 0.088], [-14, 0.093], [-13, 0.1], [-12, 0.106], [-11, 0.113], [-10, 0.12], [-9, 0.128], [-8, 0.136], [-7, 0.145], [-6, 0.154], [-5, 0.164], [-4, 0.174], [-3, 0.185], [-2, 0.197], [-1, 0.209], [0, 0.222], [1, 0.236], [2, 0.251], [3, 0.266], [4, 0.282], [5, 0.3], [6, 0.318], [7, 0.338], [8, 0.358], [9, 0.38], [10, 0.404], [11, 0.429], [12, 0.455], [13, 0.483], [14, 0.513], [15, 0.544], [16, 0.577], [17, 0.612], [18, 0.65], [19, 0.689], [20, 0.731], [21, 0.775], [22, 0.822], [23, 0.872], [24, 0.925], [25, 0.981], [26, 1.04], [27, 1.103], [28, 1.17], [29, 1.241], [30, 1.316], [31, 1.396], [32, 1.48], [33, 1.57], [34, 1.665], [35, 1.766], [36, 1.873], [37, 1.987], [38, 2.108], [39, 2.236], [40, 2.371], [41, 2.514], [42, 2.665], [43, 2.825], [44, 2.994], [45, 3.174], [46, 3.363], [47, 3.564], [48, 3.776], [49, 4], [50, 4.236], [51, 4.486], [52, 4.75], [53, 5.03], [54, 5.326], [55, 5.639], [56, 5.97], [57, 6.32], [58, 6.69], [59, 7.082], [60, 7.498], [61, 7.938], [62, 8.403], [63, 8.895], [64, 9.415], [65, 9.96]
];

const visualInspectionOptions = ["Select One", "Yes", "No", "N/A", "Satisfactory", "Unsatisfactory", "Cleaned", "See Comments"];
const insulationResistanceUnits = [{ symbol: "kΩ", name: "Kilo-Ohms" }, { symbol: "MΩ", name: "Mega-Ohms" }, { symbol: "GΩ", name: "Giga-Ohms" }];
const testVoltageOptions = ["250V", "500V", "1000V", "2500V", "5000V", "10000V"];

interface FormData {
  customer: string;
  address: string;
  date: string;
  technicians: string;
  jobNumber: string;
  substation: string;
  eqptLocation: string;
  identifier: string;
  userName: string;
  temperature: {
    ambient: number;
    celsius: number;
    fahrenheit: number;
    correctionFactor: number;
    humidity?: number;
  };
  nameplateData: {
    manufacturer: string;
    catalogNumber: string;
    serialNumber: string;
    kva: string;
    tempRise: string;
    impedance: string;
    primary: { volts: string; voltsSecondary: string; connection: string; material: string; };
    secondary: { volts: string; voltsSecondary: string; connection: string; material: string; };
    tapConfiguration: {
      positions: number[];
      voltages: string[];
      currentPosition: string;
      currentPositionSecondary: string;
      tapVoltsSpecific: string;
      tapPercentSpecific: string;
    };
  };
  visualInspection: { [key: string]: string | undefined; };
  insulationResistance: {
    temperature: string;
    primaryToGround: {
      testVoltage: string;
      unit: string;
      readings: { halfMinute: string; oneMinute: string; tenMinute: string; };
      corrected: { halfMinute: string; oneMinute: string; tenMinute: string; };
      dielectricAbsorption: string;
      polarizationIndex: string;
    };
    secondaryToGround: {
      testVoltage: string;
      unit: string;
      readings: { halfMinute: string; oneMinute: string; tenMinute: string; };
      corrected: { halfMinute: string; oneMinute: string; tenMinute: string; };
      dielectricAbsorption: string;
      polarizationIndex: string;
    };
    primaryToSecondary: {
      testVoltage: string;
      unit: string;
      readings: { halfMinute: string; oneMinute: string; tenMinute: string; };
      corrected: { halfMinute: string; oneMinute: string; tenMinute: string; };
      dielectricAbsorption: string;
      polarizationIndex: string;
    };
    dielectricAbsorptionAcceptable: string;
    polarizationIndexAcceptable: string;
  };
  turnsRatio: {
    secondaryWindingVoltage: string;
    taps: Array<{
      tap: string;
      nameplateVoltage: string;
      calculatedRatio: string;
      phaseA_TTR: string;
      phaseA_Dev: string;
      phaseB_TTR: string;
      phaseB_Dev: string;
      phaseC_TTR: string;
      phaseC_Dev: string;
      assessment: string;
    }>;
  };
  testEquipment: { megohmmeter: { name: string; serialNumber: string; ampId: string; }; };
  comments: string;
  status: string;
}

const initialVisualInspectionState = {
  "7.2.1.2.A.1": "Select One", "7.2.1.2.A.1_comments": "",
  "7.2.1.2.A.2": "Select One", "7.2.1.2.A.2_comments": "",
  "7.2.1.2.A.3*": "Select One", "7.2.1.2.A.3*_comments": "",
  "7.2.1.2.A.4": "Select One", "7.2.1.2.A.4_comments": "",
  "7.2.1.2.A.5*": "Select One", "7.2.1.2.A.5*_comments": "",
  "7.2.1.2.A.6": "Select One", "7.2.1.2.A.6_comments": "",
  "7.2.1.2.A.7": "Select One", "7.2.1.2.A.7_comments": "",
  "7.2.1.2.A.8": "Select One", "7.2.1.2.A.8_comments": "",
  "7.2.1.2.A.9": "Select One", "7.2.1.2.A.9_comments": "",
  "7.2.1.2.A.10": "Select One", "7.2.1.2.A.10_comments": "",
  "7.2.1.2.A.11": "Select One", "7.2.1.2.A.11_comments": "",
};

const initialFormData: FormData = {
  customer: '', address: '', date: new Date().toISOString().split('T')[0], technicians: '',
  jobNumber: '', substation: '', eqptLocation: '', identifier: '', userName: '',
  temperature: { ambient: 70, celsius: 21, fahrenheit: 70, correctionFactor: 1.05, humidity: 50 },
  nameplateData: {
    manufacturer: '', catalogNumber: '', serialNumber: '', kva: '', tempRise: '', impedance: '',
    primary: { volts: '', voltsSecondary: '', connection: 'Delta', material: 'Aluminum' },
    secondary: { volts: '', voltsSecondary: '', connection: 'Wye', material: 'Aluminum' },
    tapConfiguration: {
      positions: [1, 2, 3, 4, 5, 6, 7], voltages: ['', '', '', '', '', '', ''],
      currentPosition: '3', currentPositionSecondary: '', tapVoltsSpecific: '', tapPercentSpecific: ''
    }
  },
  visualInspection: initialVisualInspectionState,
  insulationResistance: {
    temperature: '',
    primaryToGround: { testVoltage: "5000V", unit: "MΩ", readings: { halfMinute: "", oneMinute: "", tenMinute: "" }, corrected: { halfMinute: "", oneMinute: "", tenMinute: "" }, dielectricAbsorption: '', polarizationIndex: '' },
    secondaryToGround: { testVoltage: "1000V", unit: "MΩ", readings: { halfMinute: "", oneMinute: "", tenMinute: "" }, corrected: { halfMinute: "", oneMinute: "", tenMinute: "" }, dielectricAbsorption: '', polarizationIndex: '' },
    primaryToSecondary: { testVoltage: "5000V", unit: "MΩ", readings: { halfMinute: "", oneMinute: "", tenMinute: "" }, corrected: { halfMinute: "", oneMinute: "", tenMinute: "" }, dielectricAbsorption: '', polarizationIndex: '' },
    dielectricAbsorptionAcceptable: '', polarizationIndexAcceptable: ''
  },
  turnsRatio: {
    secondaryWindingVoltage: '',
    taps: Array(7).fill(null).map((_, i) => ({
      tap: (i + 1).toString(), nameplateVoltage: '', calculatedRatio: '',
      phaseA_TTR: '', phaseA_Dev: '', phaseB_TTR: '', phaseB_Dev: '',
      phaseC_TTR: '', phaseC_Dev: '', assessment: 'Select One'
    }))
  },
  testEquipment: { megohmmeter: { name: '', serialNumber: '', ampId: '' } },
  comments: '', status: 'PASS'
};

// Helper functions
const calculateCorrectedValue = (readingStr: string, tcf: number): string => {
  if (typeof readingStr === 'string' && (readingStr.includes('>') || readingStr.includes('<'))) return readingStr;
  const readingNum = parseFloat(readingStr);
  if (isNaN(readingNum) || !isFinite(readingNum)) return '';
  return (readingNum * tcf).toFixed(2);
};

const calculateDAPRatio = (numeratorStr: string, denominatorStr: string): string => {
  if (typeof numeratorStr === 'string' && (numeratorStr.includes('>') || numeratorStr.includes('<'))) return '';
  if (typeof denominatorStr === 'string' && (denominatorStr.includes('>') || denominatorStr.includes('<'))) return '';
  const numerator = parseFloat(numeratorStr);
  const denominator = parseFloat(denominatorStr);
  if (isNaN(numerator) || isNaN(denominator) || !isFinite(numerator) || !isFinite(denominator) || denominator === 0) return '';
  return (numerator / denominator).toFixed(2);
};

const calculateTurnsRatio = (nameplateVoltage: string, secondaryVoltage: string): string => {
  if (!nameplateVoltage || nameplateVoltage === "0" || nameplateVoltage === "-") return "";
  if (!secondaryVoltage || parseFloat(secondaryVoltage) === 0) return "";
  const primary = parseFloat(nameplateVoltage);
  const secondary = parseFloat(secondaryVoltage);
  if (isNaN(primary) || isNaN(secondary)) return "";
  return (primary / secondary).toFixed(3);
};

const calculateDeviation = (calculatedRatio: string, ttr: string): string => {
  if (!ttr) return '';
  const calculated = parseFloat(calculatedRatio);
  const measured = parseFloat(ttr);
  if (isNaN(calculated) || isNaN(measured) || calculated === 0) return '';
  return (((calculated - measured) / calculated) * 100).toFixed(3);
};

const calculateAssessment = (phaseA_Dev: string, phaseB_Dev: string, phaseC_Dev: string): string => {
  if (!phaseA_Dev || !phaseB_Dev || !phaseC_Dev) return '';
  const devA = parseFloat(phaseA_Dev);
  const devB = parseFloat(phaseB_Dev);
  const devC = parseFloat(phaseC_Dev);
  if (isNaN(devA) || isNaN(devB) || isNaN(devC)) return '';
  if (devA < 0.501 && devA > -0.501 && devB < 0.501 && devB > -0.501 && devC < 0.501 && devC > -0.501) return 'Pass';
  return 'Fail';
};

const ensureArray = <T,>(value: any, defaultValue: T[]): T[] => {
  if (Array.isArray(value)) return value;
  if (value === null || value === undefined) return defaultValue;
  return defaultValue;
};

const getVisualInspectionDescription = (id: string): string => {
  const descriptions: { [key: string]: string } = {
    "7.2.1.2.A.1": "Inspect physical and mechanical condition.",
    "7.2.1.2.A.2": "Inspect anchorage, alignment, and grounding.",
    "7.2.1.2.A.3*": "Prior to cleaning the unit, perform as-found tests.",
    "7.2.1.2.A.4": "Clean the unit.",
    "7.2.1.2.A.5*": "Verify that control and alarm settings on temperature indicators are as specified.",
    "7.2.1.2.A.6": "Verify that cooling fans operate correctly.",
    "7.2.1.2.A.7": "Inspect bolted electrical connections for high resistance using a low-resistance ohmmeter.",
    "7.2.1.2.A.8": "Perform specific inspections and mechanical tests as recommended by the manufacturer.",
    "7.2.1.2.A.9": "Perform as-left tests.",
    "7.2.1.2.A.10": "Verify that as-left tap connections are as specified.",
    "7.2.1.2.A.11": "Verify the presence of surge arresters."
  };
  return descriptions[id] || `Unknown Section: ${id}`;
};

const LargeDryTypeTransformerMTSReport: React.FC<ReportProps> = ({ reportData, onSave, job }) => {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [isEditing, setIsEditing] = useState(false);

  const loadFromProps = (data: any) => {
    console.log('=== Loading Large Dry Type Transformer MTS Report ===');
    console.log('Raw data:', JSON.stringify(data, null, 2).substring(0, 1000));

    const prev = initialFormData;
    
    // This report uses: report_info, visual_inspection, insulation_resistance, turns_ratio, test_equipment
    const ri = data.report_info || data.reportInfo || data || {};
    const vi = data.visual_inspection || data.visualInspection || {};
    const ir = data.insulation_resistance || data.insulationResistance || {};
    const tr = data.turns_ratio || data.turnsRatio || {};
    const te = data.test_equipment || data.testEquipment || {};
    
    // Extract nested from report_info
    const np = ri.nameplateData || ri.nameplate_data || data.nameplateData || {};
    const temp = ri.temperature || data.temperature || {};

    console.log('Report info:', ri);
    console.log('Visual inspection:', vi);
    console.log('Insulation resistance:', ir);
    console.log('Turns ratio:', tr);

    setFormData({
      customer: ri.customer || data.customer || prev.customer,
      address: ri.address || data.address || prev.address,
      date: ri.date || data.date || prev.date,
      technicians: ri.technicians || data.technicians || prev.technicians,
      jobNumber: ri.jobNumber || ri.job_number || data.jobNumber || prev.jobNumber,
      substation: ri.substation || data.substation || prev.substation,
      eqptLocation: ri.eqptLocation || ri.eqpt_location || data.eqptLocation || prev.eqptLocation,
      identifier: ri.identifier || data.identifier || prev.identifier,
      userName: ri.userName || ri.user_name || data.userName || prev.userName,
      temperature: {
        ambient: temp.ambient ?? temp.fahrenheit ?? prev.temperature.ambient,
        celsius: temp.celsius ?? prev.temperature.celsius,
        fahrenheit: temp.fahrenheit ?? temp.ambient ?? prev.temperature.fahrenheit,
        correctionFactor: temp.correctionFactor ?? temp.correction_factor ?? prev.temperature.correctionFactor,
        humidity: temp.humidity ?? prev.temperature.humidity
      },
      status: ri.status || data.status || prev.status,
      comments: data.comments || ri.comments || prev.comments,
      nameplateData: {
        manufacturer: np.manufacturer || prev.nameplateData.manufacturer,
        catalogNumber: np.catalogNumber || np.catalog_number || prev.nameplateData.catalogNumber,
        serialNumber: np.serialNumber || np.serial_number || prev.nameplateData.serialNumber,
        kva: np.kva || prev.nameplateData.kva,
        tempRise: np.tempRise || np.temp_rise || prev.nameplateData.tempRise,
        impedance: np.impedance || prev.nameplateData.impedance,
        primary: {
          volts: np.primary?.volts || prev.nameplateData.primary.volts,
          voltsSecondary: np.primary?.voltsSecondary || np.primary?.volts_secondary || prev.nameplateData.primary.voltsSecondary,
          connection: np.primary?.connection || prev.nameplateData.primary.connection,
          material: np.primary?.material || prev.nameplateData.primary.material
        },
        secondary: {
          volts: np.secondary?.volts || prev.nameplateData.secondary.volts,
          voltsSecondary: np.secondary?.voltsSecondary || np.secondary?.volts_secondary || prev.nameplateData.secondary.voltsSecondary,
          connection: np.secondary?.connection || prev.nameplateData.secondary.connection,
          material: np.secondary?.material || prev.nameplateData.secondary.material
        },
        tapConfiguration: {
          positions: ensureArray(np.tapConfiguration?.positions, prev.nameplateData.tapConfiguration.positions),
          voltages: ensureArray(np.tapConfiguration?.voltages, prev.nameplateData.tapConfiguration.voltages),
          currentPosition: np.tapConfiguration?.currentPosition || np.tapConfiguration?.current_position || prev.nameplateData.tapConfiguration.currentPosition,
          currentPositionSecondary: np.tapConfiguration?.currentPositionSecondary || np.tapConfiguration?.current_position_secondary || prev.nameplateData.tapConfiguration.currentPositionSecondary,
          tapVoltsSpecific: np.tapConfiguration?.tapVoltsSpecific || np.tapConfiguration?.tap_volts_specific || prev.nameplateData.tapConfiguration.tapVoltsSpecific,
          tapPercentSpecific: np.tapConfiguration?.tapPercentSpecific || np.tapConfiguration?.tap_percent_specific || prev.nameplateData.tapConfiguration.tapPercentSpecific
        }
      },
      visualInspection: { ...initialVisualInspectionState, ...(vi.items || vi || {}) },
      insulationResistance: {
        temperature: ir.temperature || prev.insulationResistance.temperature,
        primaryToGround: {
          testVoltage: ir.primaryToGround?.testVoltage || ir.primary_to_ground?.test_voltage || ir.tests?.primaryToGround?.testVoltage || prev.insulationResistance.primaryToGround.testVoltage,
          unit: ir.primaryToGround?.unit || ir.primary_to_ground?.unit || ir.tests?.primaryToGround?.unit || prev.insulationResistance.primaryToGround.unit,
          readings: {
            halfMinute: ir.primaryToGround?.readings?.halfMinute || ir.primary_to_ground?.readings?.half_minute || ir.tests?.primaryToGround?.readings?.halfMinute || prev.insulationResistance.primaryToGround.readings.halfMinute,
            oneMinute: ir.primaryToGround?.readings?.oneMinute || ir.primary_to_ground?.readings?.one_minute || ir.tests?.primaryToGround?.readings?.oneMinute || prev.insulationResistance.primaryToGround.readings.oneMinute,
            tenMinute: ir.primaryToGround?.readings?.tenMinute || ir.primary_to_ground?.readings?.ten_minute || ir.tests?.primaryToGround?.readings?.tenMinute || prev.insulationResistance.primaryToGround.readings.tenMinute
          },
          corrected: {
            halfMinute: ir.primaryToGround?.corrected?.halfMinute || ir.primary_to_ground?.corrected?.half_minute || ir.tests?.primaryToGround?.corrected?.halfMinute || prev.insulationResistance.primaryToGround.corrected.halfMinute,
            oneMinute: ir.primaryToGround?.corrected?.oneMinute || ir.primary_to_ground?.corrected?.one_minute || ir.tests?.primaryToGround?.corrected?.oneMinute || prev.insulationResistance.primaryToGround.corrected.oneMinute,
            tenMinute: ir.primaryToGround?.corrected?.tenMinute || ir.primary_to_ground?.corrected?.ten_minute || ir.tests?.primaryToGround?.corrected?.tenMinute || prev.insulationResistance.primaryToGround.corrected.tenMinute
          },
          dielectricAbsorption: ir.primaryToGround?.dielectricAbsorption || ir.primary_to_ground?.dielectric_absorption || ir.tests?.primaryToGround?.dielectricAbsorption || prev.insulationResistance.primaryToGround.dielectricAbsorption,
          polarizationIndex: ir.primaryToGround?.polarizationIndex || ir.primary_to_ground?.polarization_index || ir.tests?.primaryToGround?.polarizationIndex || prev.insulationResistance.primaryToGround.polarizationIndex
        },
        secondaryToGround: {
          testVoltage: ir.secondaryToGround?.testVoltage || ir.secondary_to_ground?.test_voltage || ir.tests?.secondaryToGround?.testVoltage || prev.insulationResistance.secondaryToGround.testVoltage,
          unit: ir.secondaryToGround?.unit || ir.secondary_to_ground?.unit || ir.tests?.secondaryToGround?.unit || prev.insulationResistance.secondaryToGround.unit,
          readings: {
            halfMinute: ir.secondaryToGround?.readings?.halfMinute || ir.secondary_to_ground?.readings?.half_minute || ir.tests?.secondaryToGround?.readings?.halfMinute || prev.insulationResistance.secondaryToGround.readings.halfMinute,
            oneMinute: ir.secondaryToGround?.readings?.oneMinute || ir.secondary_to_ground?.readings?.one_minute || ir.tests?.secondaryToGround?.readings?.oneMinute || prev.insulationResistance.secondaryToGround.readings.oneMinute,
            tenMinute: ir.secondaryToGround?.readings?.tenMinute || ir.secondary_to_ground?.readings?.ten_minute || ir.tests?.secondaryToGround?.readings?.tenMinute || prev.insulationResistance.secondaryToGround.readings.tenMinute
          },
          corrected: {
            halfMinute: ir.secondaryToGround?.corrected?.halfMinute || ir.secondary_to_ground?.corrected?.half_minute || ir.tests?.secondaryToGround?.corrected?.halfMinute || prev.insulationResistance.secondaryToGround.corrected.halfMinute,
            oneMinute: ir.secondaryToGround?.corrected?.oneMinute || ir.secondary_to_ground?.corrected?.one_minute || ir.tests?.secondaryToGround?.corrected?.oneMinute || prev.insulationResistance.secondaryToGround.corrected.oneMinute,
            tenMinute: ir.secondaryToGround?.corrected?.tenMinute || ir.secondary_to_ground?.corrected?.ten_minute || ir.tests?.secondaryToGround?.corrected?.tenMinute || prev.insulationResistance.secondaryToGround.corrected.tenMinute
          },
          dielectricAbsorption: ir.secondaryToGround?.dielectricAbsorption || ir.secondary_to_ground?.dielectric_absorption || ir.tests?.secondaryToGround?.dielectricAbsorption || prev.insulationResistance.secondaryToGround.dielectricAbsorption,
          polarizationIndex: ir.secondaryToGround?.polarizationIndex || ir.secondary_to_ground?.polarization_index || ir.tests?.secondaryToGround?.polarizationIndex || prev.insulationResistance.secondaryToGround.polarizationIndex
        },
        primaryToSecondary: {
          testVoltage: ir.primaryToSecondary?.testVoltage || ir.primary_to_secondary?.test_voltage || ir.tests?.primaryToSecondary?.testVoltage || prev.insulationResistance.primaryToSecondary.testVoltage,
          unit: ir.primaryToSecondary?.unit || ir.primary_to_secondary?.unit || ir.tests?.primaryToSecondary?.unit || prev.insulationResistance.primaryToSecondary.unit,
          readings: {
            halfMinute: ir.primaryToSecondary?.readings?.halfMinute || ir.primary_to_secondary?.readings?.half_minute || ir.tests?.primaryToSecondary?.readings?.halfMinute || prev.insulationResistance.primaryToSecondary.readings.halfMinute,
            oneMinute: ir.primaryToSecondary?.readings?.oneMinute || ir.primary_to_secondary?.readings?.one_minute || ir.tests?.primaryToSecondary?.readings?.oneMinute || prev.insulationResistance.primaryToSecondary.readings.oneMinute,
            tenMinute: ir.primaryToSecondary?.readings?.tenMinute || ir.primary_to_secondary?.readings?.ten_minute || ir.tests?.primaryToSecondary?.readings?.tenMinute || prev.insulationResistance.primaryToSecondary.readings.tenMinute
          },
          corrected: {
            halfMinute: ir.primaryToSecondary?.corrected?.halfMinute || ir.primary_to_secondary?.corrected?.half_minute || ir.tests?.primaryToSecondary?.corrected?.halfMinute || prev.insulationResistance.primaryToSecondary.corrected.halfMinute,
            oneMinute: ir.primaryToSecondary?.corrected?.oneMinute || ir.primary_to_secondary?.corrected?.one_minute || ir.tests?.primaryToSecondary?.corrected?.oneMinute || prev.insulationResistance.primaryToSecondary.corrected.oneMinute,
            tenMinute: ir.primaryToSecondary?.corrected?.tenMinute || ir.primary_to_secondary?.corrected?.ten_minute || ir.tests?.primaryToSecondary?.corrected?.tenMinute || prev.insulationResistance.primaryToSecondary.corrected.tenMinute
          },
          dielectricAbsorption: ir.primaryToSecondary?.dielectricAbsorption || ir.primary_to_secondary?.dielectric_absorption || ir.tests?.primaryToSecondary?.dielectricAbsorption || prev.insulationResistance.primaryToSecondary.dielectricAbsorption,
          polarizationIndex: ir.primaryToSecondary?.polarizationIndex || ir.primary_to_secondary?.polarization_index || ir.tests?.primaryToSecondary?.polarizationIndex || prev.insulationResistance.primaryToSecondary.polarizationIndex
        },
        dielectricAbsorptionAcceptable: ir.dielectricAbsorptionAcceptable || ir.dielectric_absorption_acceptable || ir.tests?.dielectricAbsorptionAcceptable || prev.insulationResistance.dielectricAbsorptionAcceptable,
        polarizationIndexAcceptable: ir.polarizationIndexAcceptable || ir.polarization_index_acceptable || ir.tests?.polarizationIndexAcceptable || prev.insulationResistance.polarizationIndexAcceptable
      },
      turnsRatio: {
        secondaryWindingVoltage: tr.secondaryWindingVoltage || tr.secondary_winding_voltage || prev.turnsRatio.secondaryWindingVoltage,
        taps: ensureArray(tr.taps, prev.turnsRatio.taps)
      },
      testEquipment: {
        megohmmeter: {
          name: te.megohmmeter?.name || prev.testEquipment.megohmmeter.name,
          serialNumber: te.megohmmeter?.serialNumber || te.megohmmeter?.serial_number || prev.testEquipment.megohmmeter.serialNumber,
          ampId: te.megohmmeter?.ampId || te.megohmmeter?.amp_id || prev.testEquipment.megohmmeter.ampId
        }
      }
    });
  };

  useEffect(() => {
    if (reportData) {
      loadFromProps(reportData);
    }
    if (job) {
      setFormData(prev => ({
        ...prev,
        customer: job.customer_name || job.customerName || prev.customer,
        address: job.site_address || job.address || prev.address,
        jobNumber: job.job_number || job.jobNumber || prev.jobNumber
      }));
    }
  }, [reportData, job]);

  // Recalculate corrected values when readings or temperature change
  useEffect(() => {
    const tcf = formData.temperature.correctionFactor;
    
    const updateCalculatedValues = (testId: 'primaryToGround' | 'secondaryToGround' | 'primaryToSecondary') => {
      const testRecord = formData.insulationResistance[testId];
      if (!testRecord || !testRecord.readings) {
        return { corrected: { halfMinute: '', oneMinute: '', tenMinute: '' }, dielectricAbsorption: '', polarizationIndex: '' };
      }
      const readings = testRecord.readings;
      const corrected = {
        halfMinute: calculateCorrectedValue(readings.halfMinute, tcf),
        oneMinute: calculateCorrectedValue(readings.oneMinute, tcf),
        tenMinute: calculateCorrectedValue(readings.tenMinute, tcf),
      };
      const dielectricAbsorption = calculateDAPRatio(corrected.oneMinute, corrected.halfMinute);
      const polarizationIndex = calculateDAPRatio(corrected.tenMinute, corrected.oneMinute);
      return { corrected, dielectricAbsorption, polarizationIndex };
    };

    const primaryCalcs = updateCalculatedValues('primaryToGround');
    const secondaryCalcs = updateCalculatedValues('secondaryToGround');
    const primarySecondaryCalcs = updateCalculatedValues('primaryToSecondary');
    
    const daValues = [primaryCalcs.dielectricAbsorption, secondaryCalcs.dielectricAbsorption, primarySecondaryCalcs.dielectricAbsorption].map(v => parseFloat(v));
    const daAcceptable = daValues.some(v => !isNaN(v)) && daValues.every(v => isNaN(v) || v > 1.0) ? 'Yes' : 'No';
    const piValues = [primaryCalcs.polarizationIndex, secondaryCalcs.polarizationIndex, primarySecondaryCalcs.polarizationIndex].map(v => parseFloat(v));
    const piAcceptable = piValues.some(v => !isNaN(v)) && piValues.every(v => isNaN(v) || v > 1.0) ? 'Yes' : 'No';

    setFormData(prev => ({
      ...prev,
      insulationResistance: {
        ...prev.insulationResistance,
        primaryToGround: { ...prev.insulationResistance.primaryToGround, corrected: primaryCalcs.corrected, dielectricAbsorption: primaryCalcs.dielectricAbsorption, polarizationIndex: primaryCalcs.polarizationIndex },
        secondaryToGround: { ...prev.insulationResistance.secondaryToGround, corrected: secondaryCalcs.corrected, dielectricAbsorption: secondaryCalcs.dielectricAbsorption, polarizationIndex: secondaryCalcs.polarizationIndex },
        primaryToSecondary: { ...prev.insulationResistance.primaryToSecondary, corrected: primarySecondaryCalcs.corrected, dielectricAbsorption: primarySecondaryCalcs.dielectricAbsorption, polarizationIndex: primarySecondaryCalcs.polarizationIndex },
        dielectricAbsorptionAcceptable: daAcceptable,
        polarizationIndexAcceptable: piAcceptable,
      }
    }));
  }, [formData.insulationResistance.primaryToGround.readings, formData.insulationResistance.secondaryToGround.readings, formData.insulationResistance.primaryToSecondary.readings, formData.temperature.correctionFactor]);

  const handleTemperatureChange = (fahrenheit: number) => {
    const closestMatch = tempConvTable.reduce((prev, curr) =>
      Math.abs(curr[0] - fahrenheit) < Math.abs(prev[0] - fahrenheit) ? curr : prev
    );
    const celsius = closestMatch[1];
    const tcfMatch = tcfTable.find(item => item[0] === celsius) || [0, 1];
    const correctionFactor = tcfMatch[1];
    setFormData(prev => ({
      ...prev,
      temperature: { ...prev.temperature, ambient: fahrenheit, celsius, fahrenheit, correctionFactor }
    }));
  };

  const handleChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNestedChange = (section: keyof FormData, subsection: string, value: any) => {
    setFormData(prev => {
      const currentSection = prev[section];
      if (typeof currentSection !== 'object' || currentSection === null) return prev;
      return { ...prev, [section]: { ...(currentSection as object), [subsection]: value } };
    });
  };

  const handleVisualInspectionChange = (id: string, type: 'result' | 'comment', value: string) => {
    const fieldKey = type === 'result' ? id : `${id}_comments`;
    setFormData(prev => ({
      ...prev,
      visualInspection: { ...prev.visualInspection, [fieldKey]: value }
    }));
  };

  const handleInsulationReadingChange = (testId: 'primaryToGround' | 'secondaryToGround' | 'primaryToSecondary', field: 'halfMinute' | 'oneMinute' | 'tenMinute', value: string) => {
    setFormData(prev => ({
      ...prev,
      insulationResistance: {
        ...prev.insulationResistance,
        [testId]: {
          ...prev.insulationResistance[testId],
          readings: { ...prev.insulationResistance[testId].readings, [field]: value }
        }
      }
    }));
  };

  const handleTurnsRatioChange = (index: number, field: keyof FormData['turnsRatio']['taps'][0], value: string) => {
    setFormData(prev => {
      const newTaps = [...prev.turnsRatio.taps];
      const calculatedRatio = calculateTurnsRatio(prev.nameplateData.tapConfiguration.voltages[index] || '', prev.turnsRatio.secondaryWindingVoltage);
      newTaps[index] = { ...newTaps[index], [field]: value };
      
      if (field === 'phaseA_TTR') newTaps[index].phaseA_Dev = calculateDeviation(calculatedRatio, value);
      else if (field === 'phaseB_TTR') newTaps[index].phaseB_Dev = calculateDeviation(calculatedRatio, value);
      else if (field === 'phaseC_TTR') newTaps[index].phaseC_Dev = calculateDeviation(calculatedRatio, value);
      
      // Auto-calculate assessment
      newTaps[index].assessment = calculateAssessment(newTaps[index].phaseA_Dev, newTaps[index].phaseB_Dev, newTaps[index].phaseC_Dev) || newTaps[index].assessment;
      
      return { ...prev, turnsRatio: { ...prev.turnsRatio, taps: newTaps } };
    });
  };

  const handleSave = () => {
    if (onSave) {
      onSave(formData);
    }
    setIsEditing(false);
  };

  const visualInspectionIds = ["7.2.1.2.A.1", "7.2.1.2.A.2", "7.2.1.2.A.3*", "7.2.1.2.A.4", "7.2.1.2.A.5*", "7.2.1.2.A.6", "7.2.1.2.A.7", "7.2.1.2.A.8", "7.2.1.2.A.9", "7.2.1.2.A.10", "7.2.1.2.A.11"];

  return (
    <div className="report-container p-6 max-w-6xl mx-auto bg-white">
      <ReportHeader
        title="2-Large Dry Type Xfmr. Inspection and Test MTS 23"
        status={formData.status}
        onStatusChange={(status) => handleChange('status', status)}
        isEditing={isEditing}
        onEdit={() => setIsEditing(true)}
        onSave={handleSave}
        onPrint={() => window.print()}
      />

      {/* Job Information */}
      <div className="section mb-6">
        <h2 className="section-title text-lg font-semibold mb-3 pb-1 border-b-2 border-blue-600">Job Information</h2>
        <table className="data-table w-full">
          <tbody>
            <tr>
              <td className="label-cell w-1/6">Customer</td>
              <td><input type="text" className="table-input" value={formData.customer} onChange={(e) => handleChange('customer', e.target.value)} disabled={!isEditing} /></td>
              <td className="label-cell w-1/6">Job Number</td>
              <td><input type="text" className="table-input" value={formData.jobNumber} onChange={(e) => handleChange('jobNumber', e.target.value)} disabled={!isEditing} /></td>
            </tr>
            <tr>
              <td className="label-cell">Address</td>
              <td><input type="text" className="table-input" value={formData.address} onChange={(e) => handleChange('address', e.target.value)} disabled={!isEditing} /></td>
              <td className="label-cell">Date</td>
              <td><input type="date" className="table-input" value={formData.date} onChange={(e) => handleChange('date', e.target.value)} disabled={!isEditing} /></td>
            </tr>
            <tr>
              <td className="label-cell">Substation</td>
              <td><input type="text" className="table-input" value={formData.substation} onChange={(e) => handleChange('substation', e.target.value)} disabled={!isEditing} /></td>
              <td className="label-cell">Equipment Location</td>
              <td><input type="text" className="table-input" value={formData.eqptLocation} onChange={(e) => handleChange('eqptLocation', e.target.value)} disabled={!isEditing} /></td>
            </tr>
            <tr>
              <td className="label-cell">Identifier</td>
              <td><input type="text" className="table-input" value={formData.identifier} onChange={(e) => handleChange('identifier', e.target.value)} disabled={!isEditing} /></td>
              <td className="label-cell">Technicians</td>
              <td><input type="text" className="table-input" value={formData.technicians} onChange={(e) => handleChange('technicians', e.target.value)} disabled={!isEditing} /></td>
            </tr>
            <tr>
              <td className="label-cell">Temperature (°F)</td>
              <td><input type="number" className="table-input" value={formData.temperature.fahrenheit} onChange={(e) => handleTemperatureChange(parseFloat(e.target.value))} disabled={!isEditing} /></td>
              <td className="label-cell">TCF</td>
              <td><input type="text" className="table-input bg-gray-100" value={formData.temperature.correctionFactor.toFixed(3)} readOnly /></td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Nameplate Data */}
      <div className="section mb-6">
        <h2 className="section-title text-lg font-semibold mb-3 pb-1 border-b-2 border-blue-600">Nameplate Data</h2>
        <table className="data-table w-full">
          <tbody>
            <tr>
              <td className="label-cell w-1/6">Manufacturer</td>
              <td><input type="text" className="table-input" value={formData.nameplateData.manufacturer} onChange={(e) => handleNestedChange('nameplateData', 'manufacturer', e.target.value)} disabled={!isEditing} /></td>
              <td className="label-cell w-1/6">Catalog Number</td>
              <td><input type="text" className="table-input" value={formData.nameplateData.catalogNumber} onChange={(e) => handleNestedChange('nameplateData', 'catalogNumber', e.target.value)} disabled={!isEditing} /></td>
              <td className="label-cell w-1/6">Serial Number</td>
              <td><input type="text" className="table-input" value={formData.nameplateData.serialNumber} onChange={(e) => handleNestedChange('nameplateData', 'serialNumber', e.target.value)} disabled={!isEditing} /></td>
            </tr>
            <tr>
              <td className="label-cell">KVA</td>
              <td><input type="text" className="table-input" value={formData.nameplateData.kva} onChange={(e) => handleNestedChange('nameplateData', 'kva', e.target.value)} disabled={!isEditing} /></td>
              <td className="label-cell">Temp Rise</td>
              <td><input type="text" className="table-input" value={formData.nameplateData.tempRise} onChange={(e) => handleNestedChange('nameplateData', 'tempRise', e.target.value)} disabled={!isEditing} /></td>
              <td className="label-cell">Impedance (%)</td>
              <td><input type="text" className="table-input" value={formData.nameplateData.impedance} onChange={(e) => handleNestedChange('nameplateData', 'impedance', e.target.value)} disabled={!isEditing} /></td>
            </tr>
          </tbody>
        </table>
        
        {/* Primary/Secondary Details */}
        <table className="data-table w-full mt-2">
          <thead>
            <tr>
              <th></th>
              <th>Volts</th>
              <th>Volts (Secondary)</th>
              <th>Connection</th>
              <th>Material</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="label-cell">Primary</td>
              <td><input type="text" className="table-input" value={formData.nameplateData.primary.volts} onChange={(e) => setFormData(prev => ({ ...prev, nameplateData: { ...prev.nameplateData, primary: { ...prev.nameplateData.primary, volts: e.target.value } } }))} disabled={!isEditing} /></td>
              <td><input type="text" className="table-input" value={formData.nameplateData.primary.voltsSecondary} onChange={(e) => setFormData(prev => ({ ...prev, nameplateData: { ...prev.nameplateData, primary: { ...prev.nameplateData.primary, voltsSecondary: e.target.value } } }))} disabled={!isEditing} /></td>
              <td>
                <select className="table-input" value={formData.nameplateData.primary.connection} onChange={(e) => setFormData(prev => ({ ...prev, nameplateData: { ...prev.nameplateData, primary: { ...prev.nameplateData.primary, connection: e.target.value } } }))} disabled={!isEditing}>
                  <option value="Delta">Delta</option>
                  <option value="Wye">Wye</option>
                </select>
              </td>
              <td>
                <select className="table-input" value={formData.nameplateData.primary.material} onChange={(e) => setFormData(prev => ({ ...prev, nameplateData: { ...prev.nameplateData, primary: { ...prev.nameplateData.primary, material: e.target.value } } }))} disabled={!isEditing}>
                  <option value="Copper">Copper</option>
                  <option value="Aluminum">Aluminum</option>
                </select>
              </td>
            </tr>
            <tr>
              <td className="label-cell">Secondary</td>
              <td><input type="text" className="table-input" value={formData.nameplateData.secondary.volts} onChange={(e) => setFormData(prev => ({ ...prev, nameplateData: { ...prev.nameplateData, secondary: { ...prev.nameplateData.secondary, volts: e.target.value } } }))} disabled={!isEditing} /></td>
              <td><input type="text" className="table-input" value={formData.nameplateData.secondary.voltsSecondary} onChange={(e) => setFormData(prev => ({ ...prev, nameplateData: { ...prev.nameplateData, secondary: { ...prev.nameplateData.secondary, voltsSecondary: e.target.value } } }))} disabled={!isEditing} /></td>
              <td>
                <select className="table-input" value={formData.nameplateData.secondary.connection} onChange={(e) => setFormData(prev => ({ ...prev, nameplateData: { ...prev.nameplateData, secondary: { ...prev.nameplateData.secondary, connection: e.target.value } } }))} disabled={!isEditing}>
                  <option value="Delta">Delta</option>
                  <option value="Wye">Wye</option>
                </select>
              </td>
              <td>
                <select className="table-input" value={formData.nameplateData.secondary.material} onChange={(e) => setFormData(prev => ({ ...prev, nameplateData: { ...prev.nameplateData, secondary: { ...prev.nameplateData.secondary, material: e.target.value } } }))} disabled={!isEditing}>
                  <option value="Copper">Copper</option>
                  <option value="Aluminum">Aluminum</option>
                </select>
              </td>
            </tr>
          </tbody>
        </table>

        {/* Tap Configuration */}
        <table className="data-table w-full mt-2">
          <thead>
            <tr>
              <th>Tap Position</th>
              {formData.nameplateData.tapConfiguration.positions.map((pos) => (
                <th key={pos}>{pos}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="label-cell">Voltage</td>
              {formData.nameplateData.tapConfiguration.voltages.map((voltage, idx) => (
                <td key={idx}>
                  <input
                    type="text"
                    className="table-input"
                    value={voltage}
                    onChange={(e) => {
                      const newVoltages = [...formData.nameplateData.tapConfiguration.voltages];
                      newVoltages[idx] = e.target.value;
                      setFormData(prev => ({
                        ...prev,
                        nameplateData: { ...prev.nameplateData, tapConfiguration: { ...prev.nameplateData.tapConfiguration, voltages: newVoltages } }
                      }));
                    }}
                    disabled={!isEditing}
                  />
                </td>
              ))}
            </tr>
          </tbody>
        </table>
        <div className="flex gap-4 mt-2">
          <div className="flex items-center gap-2">
            <label className="font-medium">Current Tap Position:</label>
            <select
              className="table-input w-20"
              value={formData.nameplateData.tapConfiguration.currentPosition}
              onChange={(e) => setFormData(prev => ({ ...prev, nameplateData: { ...prev.nameplateData, tapConfiguration: { ...prev.nameplateData.tapConfiguration, currentPosition: e.target.value } } }))}
              disabled={!isEditing}
            >
              {formData.nameplateData.tapConfiguration.positions.map(pos => (
                <option key={pos} value={pos.toString()}>{pos}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Visual and Mechanical Inspection */}
      <div className="section mb-6">
        <h2 className="section-title text-lg font-semibold mb-3 pb-1 border-b-2 border-blue-600">Visual and Mechanical Inspection</h2>
        <table className="data-table w-full">
          <thead>
            <tr>
              <th className="w-24">Section</th>
              <th>Description</th>
              <th className="w-32">Result</th>
              <th>Comments</th>
            </tr>
          </thead>
          <tbody>
            {visualInspectionIds.map((id) => (
              <tr key={id}>
                <td className="label-cell text-center">{id}</td>
                <td className="text-sm">{getVisualInspectionDescription(id)}</td>
                <td>
                  <select
                    className="table-input"
                    value={formData.visualInspection[id] || 'Select One'}
                    onChange={(e) => handleVisualInspectionChange(id, 'result', e.target.value)}
                    disabled={!isEditing}
                  >
                    {visualInspectionOptions.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </td>
                <td>
                  <input
                    type="text"
                    className="table-input"
                    value={formData.visualInspection[`${id}_comments`] || ''}
                    onChange={(e) => handleVisualInspectionChange(id, 'comment', e.target.value)}
                    disabled={!isEditing}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Insulation Resistance */}
      <div className="section mb-6">
        <h2 className="section-title text-lg font-semibold mb-3 pb-1 border-b-2 border-blue-600">Electrical Tests - Insulation Resistance</h2>
        
        {(['primaryToGround', 'secondaryToGround', 'primaryToSecondary'] as const).map((testId) => {
          const testData = formData.insulationResistance[testId];
          const testLabel = testId === 'primaryToGround' ? 'Primary to Ground' : testId === 'secondaryToGround' ? 'Secondary to Ground' : 'Primary to Secondary';
          
          return (
            <div key={testId} className="mb-4">
              <h3 className="font-medium mb-2">{testLabel}</h3>
              <table className="data-table w-full">
                <thead>
                  <tr>
                    <th>Test Voltage</th>
                    <th>Unit</th>
                    <th>30 sec</th>
                    <th>1 min</th>
                    <th>10 min</th>
                    <th>DA Ratio</th>
                    <th>PI</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <select
                        className="table-input"
                        value={testData.testVoltage}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          insulationResistance: {
                            ...prev.insulationResistance,
                            [testId]: { ...prev.insulationResistance[testId], testVoltage: e.target.value }
                          }
                        }))}
                        disabled={!isEditing}
                      >
                        {testVoltageOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    </td>
                    <td>
                      <select
                        className="table-input"
                        value={testData.unit}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          insulationResistance: {
                            ...prev.insulationResistance,
                            [testId]: { ...prev.insulationResistance[testId], unit: e.target.value }
                          }
                        }))}
                        disabled={!isEditing}
                      >
                        {insulationResistanceUnits.map(u => <option key={u.symbol} value={u.symbol}>{u.symbol}</option>)}
                      </select>
                    </td>
                    <td><input type="text" className="table-input" value={testData.readings.halfMinute} onChange={(e) => handleInsulationReadingChange(testId, 'halfMinute', e.target.value)} disabled={!isEditing} /></td>
                    <td><input type="text" className="table-input" value={testData.readings.oneMinute} onChange={(e) => handleInsulationReadingChange(testId, 'oneMinute', e.target.value)} disabled={!isEditing} /></td>
                    <td><input type="text" className="table-input" value={testData.readings.tenMinute} onChange={(e) => handleInsulationReadingChange(testId, 'tenMinute', e.target.value)} disabled={!isEditing} /></td>
                    <td><input type="text" className="table-input bg-gray-100" value={testData.dielectricAbsorption} readOnly /></td>
                    <td><input type="text" className="table-input bg-gray-100" value={testData.polarizationIndex} readOnly /></td>
                  </tr>
                  <tr>
                    <td colSpan={2} className="label-cell text-right">Temp Corrected:</td>
                    <td><input type="text" className="table-input bg-gray-100" value={testData.corrected.halfMinute} readOnly /></td>
                    <td><input type="text" className="table-input bg-gray-100" value={testData.corrected.oneMinute} readOnly /></td>
                    <td><input type="text" className="table-input bg-gray-100" value={testData.corrected.tenMinute} readOnly /></td>
                    <td colSpan={2}></td>
                  </tr>
                </tbody>
              </table>
            </div>
          );
        })}

        <div className="flex gap-8 mt-2">
          <div className="flex items-center gap-2">
            <label className="font-medium">DA Ratio Acceptable (&gt;1.0)?</label>
            <span className={`px-2 py-1 rounded ${formData.insulationResistance.dielectricAbsorptionAcceptable === 'Yes' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {formData.insulationResistance.dielectricAbsorptionAcceptable || 'N/A'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <label className="font-medium">PI Acceptable (&gt;1.0)?</label>
            <span className={`px-2 py-1 rounded ${formData.insulationResistance.polarizationIndexAcceptable === 'Yes' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {formData.insulationResistance.polarizationIndexAcceptable || 'N/A'}
            </span>
          </div>
        </div>
      </div>

      {/* Turns Ratio Test */}
      <div className="section mb-6">
        <h2 className="section-title text-lg font-semibold mb-3 pb-1 border-b-2 border-blue-600">Electrical Tests - Turns Ratio</h2>
        <div className="mb-2 flex items-center gap-2">
          <label className="font-medium">Secondary Winding Voltage:</label>
          <input
            type="text"
            className="table-input w-32"
            value={formData.turnsRatio.secondaryWindingVoltage}
            onChange={(e) => setFormData(prev => ({ ...prev, turnsRatio: { ...prev.turnsRatio, secondaryWindingVoltage: e.target.value } }))}
            disabled={!isEditing}
          />
        </div>
        <div className="overflow-x-auto">
          <table className="data-table w-full text-sm">
            <thead>
              <tr>
                <th>Tap</th>
                <th>Nameplate V</th>
                <th>Calc Ratio</th>
                <th>A-Phase TTR</th>
                <th>A-Phase Dev%</th>
                <th>B-Phase TTR</th>
                <th>B-Phase Dev%</th>
                <th>C-Phase TTR</th>
                <th>C-Phase Dev%</th>
                <th>Assessment</th>
              </tr>
            </thead>
            <tbody>
              {formData.turnsRatio.taps.map((tap, idx) => {
                const calcRatio = calculateTurnsRatio(formData.nameplateData.tapConfiguration.voltages[idx] || '', formData.turnsRatio.secondaryWindingVoltage);
                return (
                  <tr key={idx}>
                    <td className="text-center">{tap.tap}</td>
                    <td><input type="text" className="table-input bg-gray-100" value={formData.nameplateData.tapConfiguration.voltages[idx] || ''} readOnly /></td>
                    <td><input type="text" className="table-input bg-gray-100" value={calcRatio} readOnly /></td>
                    <td><input type="text" className="table-input" value={tap.phaseA_TTR} onChange={(e) => handleTurnsRatioChange(idx, 'phaseA_TTR', e.target.value)} disabled={!isEditing} /></td>
                    <td><input type="text" className="table-input bg-gray-100" value={calculateDeviation(calcRatio, tap.phaseA_TTR)} readOnly /></td>
                    <td><input type="text" className="table-input" value={tap.phaseB_TTR} onChange={(e) => handleTurnsRatioChange(idx, 'phaseB_TTR', e.target.value)} disabled={!isEditing} /></td>
                    <td><input type="text" className="table-input bg-gray-100" value={calculateDeviation(calcRatio, tap.phaseB_TTR)} readOnly /></td>
                    <td><input type="text" className="table-input" value={tap.phaseC_TTR} onChange={(e) => handleTurnsRatioChange(idx, 'phaseC_TTR', e.target.value)} disabled={!isEditing} /></td>
                    <td><input type="text" className="table-input bg-gray-100" value={calculateDeviation(calcRatio, tap.phaseC_TTR)} readOnly /></td>
                    <td>
                      <span className={`px-2 py-1 rounded text-xs ${
                        calculateAssessment(calculateDeviation(calcRatio, tap.phaseA_TTR), calculateDeviation(calcRatio, tap.phaseB_TTR), calculateDeviation(calcRatio, tap.phaseC_TTR)) === 'Pass' 
                          ? 'bg-green-100 text-green-800' 
                          : calculateAssessment(calculateDeviation(calcRatio, tap.phaseA_TTR), calculateDeviation(calcRatio, tap.phaseB_TTR), calculateDeviation(calcRatio, tap.phaseC_TTR)) === 'Fail'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100'
                      }`}>
                        {calculateAssessment(calculateDeviation(calcRatio, tap.phaseA_TTR), calculateDeviation(calcRatio, tap.phaseB_TTR), calculateDeviation(calcRatio, tap.phaseC_TTR)) || '-'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Test Equipment */}
      <div className="section mb-6">
        <h2 className="section-title text-lg font-semibold mb-3 pb-1 border-b-2 border-blue-600">Test Equipment Used</h2>
        <table className="data-table w-full">
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
              <td><input type="text" className="table-input" value={formData.testEquipment.megohmmeter.name} onChange={(e) => setFormData(prev => ({ ...prev, testEquipment: { ...prev.testEquipment, megohmmeter: { ...prev.testEquipment.megohmmeter, name: e.target.value } } }))} disabled={!isEditing} /></td>
              <td><input type="text" className="table-input" value={formData.testEquipment.megohmmeter.serialNumber} onChange={(e) => setFormData(prev => ({ ...prev, testEquipment: { ...prev.testEquipment, megohmmeter: { ...prev.testEquipment.megohmmeter, serialNumber: e.target.value } } }))} disabled={!isEditing} /></td>
              <td><input type="text" className="table-input" value={formData.testEquipment.megohmmeter.ampId} onChange={(e) => setFormData(prev => ({ ...prev, testEquipment: { ...prev.testEquipment, megohmmeter: { ...prev.testEquipment.megohmmeter, ampId: e.target.value } } }))} disabled={!isEditing} /></td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Comments */}
      <div className="section mb-6">
        <h2 className="section-title text-lg font-semibold mb-3 pb-1 border-b-2 border-blue-600">Comments</h2>
        <textarea
          className="w-full p-3 border rounded min-h-[100px]"
          value={formData.comments}
          onChange={(e) => handleChange('comments', e.target.value)}
          disabled={!isEditing}
          placeholder="Enter any additional comments..."
        />
      </div>
    </div>
  );
};

export default LargeDryTypeTransformerMTSReport;

