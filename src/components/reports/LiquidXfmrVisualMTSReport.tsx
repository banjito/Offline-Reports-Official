import React, { useState, useEffect } from 'react';
import './ReportStyles.css';
import { ReportHeader } from './BaseReport';

interface ReportProps {
  reportData: any;
  onSave?: (data: any) => void;
  job?: any;
}

// Temperature Correction Factor table
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
  '36': 2.1, '37': 2.2, '38': 2.3, '39': 2.4, '40': 2.5
};

const getTCF = (celsius: number): number => {
  const roundedCelsius = Math.round(celsius);
  const key = roundedCelsius.toString();
  return tcfTable[key] !== undefined ? tcfTable[key] : 1;
};

const visualInspectionOptions = ["Select One", "Satisfactory", "Unsatisfactory", "Not Applicable", "Repaired", "Cleaned", "See Comments"];
const insulationResistanceUnits = ["kΩ", "MΩ", "GΩ"];
const testVoltageOptions = ["250V", "500V", "1000V", "2500V", "5000V", "Other"];

interface InsulationTestEntry {
  testVoltage: string;
  values: { halfMin: string; oneMin: string; tenMin: string; };
  units: string;
  correctedValues: { halfMin: string; oneMin: string; tenMin: string; };
}

interface FormData {
  customer: string;
  address: string;
  user: string;
  date: string;
  identifier: string;
  jobNumber: string;
  technicians: string;
  temperature: { fahrenheit: number; celsius: number; tcf: number; humidity: string; };
  substation: string;
  eqptLocation: string;
  nameplate: {
    manufacturer: string;
    kVA: string;
    catalogNumber: string;
    tempRise: string;
    fluidType: string;
    serialNumber: string;
    impedance: string;
    fluidVolume: string;
    primaryVolts1: string;
    primaryVolts2: string;
    secondaryVolts1: string;
    secondaryVolts2: string;
    primaryConnectionDelta: boolean;
    primaryConnectionWye: boolean;
    primaryConnectionSinglePhase: boolean;
    secondaryConnectionDelta: boolean;
    secondaryConnectionWye: boolean;
    secondaryConnectionSinglePhase: boolean;
    primaryWindingMaterialAluminum: boolean;
    primaryWindingMaterialCopper: boolean;
    secondaryWindingMaterialAluminum: boolean;
    secondaryWindingMaterialCopper: boolean;
    tapVoltages: string[];
    tapPositions: string[];
    tapPositionLeft1: string;
    tapPositionLeft2: string;
    tapVoltsSpecific: string;
    tapPercentSpecific: string;
  };
  indicatorGaugeValues: {
    oilLevel: string;
    tankPressure: string;
    oilTemperature: string;
    windingTemperature: string;
    oilTempRange: string;
    windingTempRange: string;
  };
  visualMechanicalInspection: Array<{ netaSection: string; description: string; result: string; comments?: string; }>;
  visualMechanicalInspectionComments: string;
  electricalTestsInsulationResistance: {
    primaryToGround: InsulationTestEntry;
    secondaryToGround: InsulationTestEntry;
    primaryToSecondary: InsulationTestEntry;
    dielectricAbsorption: { primary: string; secondary: string; primaryToSecondary: string; };
    polarizationIndex: { primary: string; secondary: string; primaryToSecondary: string; };
    acceptableDAPI: string;
  };
  testEquipmentUsed: { megohmmeter: string; serialNumber: string; ampId: string; };
  electricalTestComments: string;
  status: 'PASS' | 'FAIL';
}

const initialVisualMechanicalItems = [
  { netaSection: '7.2.2.A.1', description: 'Inspect physical and mechanical condition.', result: '' },
  { netaSection: '7.2.2.A.2', description: 'Inspect anchorage, alignment, and grounding.', result: '' },
  { netaSection: '7.2.2.A.3', description: 'Verify the presence of PCB labeling.', result: '' },
  { netaSection: '7.2.2.A.4*', description: 'Prior to cleaning the unit, perform as-found tests. *Optional', result: '' },
  { netaSection: '7.2.2.A.5', description: 'Clean bushings and control cabinets.', result: '' },
  { netaSection: '7.2.2.A.6', description: 'Verify operation of alarm, control, and trip circuits from temperature and level indicators, pressure-relief device, gas accumulator, and fault-pressure relay.', result: '' },
  { netaSection: '7.2.2.A.7', description: 'Verify that cooling fans and pumps operate correctly.', result: '' },
  { netaSection: '7.2.2.A.8.1', description: 'Inspect Bolted connections for high resistance: Use of a low-resistance ohmmeter in accordance with Section 7.2.2.B.1.', result: '' },
  { netaSection: '7.2.2.A.9', description: 'Verify correct liquid level in tanks and bushings.', result: '' },
  { netaSection: '7.2.2.A.10', description: 'Verify that positive pressure is maintained on gas-blanketed transformers.', result: '' },
  { netaSection: '7.2.2.A.11', description: 'Perform inspections and mechanical tests as recommended by the manufacturer.', result: '' },
  { netaSection: '7.2.2.A.12', description: 'Test load tap-changer in accordance with Section 7.12.', result: '' },
  { netaSection: '7.2.2.A.13', description: 'Verify the presence of transformer surge arresters.', result: '' },
  { netaSection: '7.2.2.A.15', description: 'Verify de-energized tap-changer position is left as specified.', result: '' }
];

const initialInsulationEntry = (): InsulationTestEntry => ({
  testVoltage: '5000V',
  values: { halfMin: '', oneMin: '', tenMin: '' },
  units: 'MΩ',
  correctedValues: { halfMin: '', oneMin: '', tenMin: '' },
});

const initialFormData: FormData = {
  customer: '', address: '', user: '', date: new Date().toISOString().split('T')[0],
  identifier: '', jobNumber: '', technicians: '',
  temperature: { fahrenheit: 68, celsius: 20, tcf: 1, humidity: '' },
  substation: '', eqptLocation: '',
  nameplate: {
    manufacturer: '', kVA: '', catalogNumber: '', tempRise: '', fluidType: '', serialNumber: '', impedance: '', fluidVolume: '',
    primaryVolts1: '', primaryVolts2: '', secondaryVolts1: '', secondaryVolts2: '',
    primaryConnectionDelta: false, primaryConnectionWye: false, primaryConnectionSinglePhase: false,
    secondaryConnectionDelta: false, secondaryConnectionWye: false, secondaryConnectionSinglePhase: false,
    primaryWindingMaterialAluminum: false, primaryWindingMaterialCopper: false,
    secondaryWindingMaterialAluminum: false, secondaryWindingMaterialCopper: false,
    tapVoltages: Array(7).fill(''), tapPositions: Array(7).fill(''),
    tapPositionLeft1: '', tapPositionLeft2: '', tapVoltsSpecific: '', tapPercentSpecific: '',
  },
  indicatorGaugeValues: { oilLevel: '', tankPressure: '', oilTemperature: '', windingTemperature: '', oilTempRange: '', windingTempRange: '' },
  visualMechanicalInspection: JSON.parse(JSON.stringify(initialVisualMechanicalItems)),
  visualMechanicalInspectionComments: '',
  electricalTestsInsulationResistance: {
    primaryToGround: initialInsulationEntry(),
    secondaryToGround: initialInsulationEntry(),
    primaryToSecondary: initialInsulationEntry(),
    dielectricAbsorption: { primary: '', secondary: '', primaryToSecondary: '' },
    polarizationIndex: { primary: '', secondary: '', primaryToSecondary: '' },
    acceptableDAPI: '',
  },
  testEquipmentUsed: { megohmmeter: '', serialNumber: '', ampId: '' },
  electricalTestComments: '',
  status: 'PASS',
};

const ensureArray = <T,>(value: any, defaultValue: T[]): T[] => {
  if (Array.isArray(value)) return value;
  if (value === null || value === undefined) return defaultValue;
  return defaultValue;
};

const LiquidXfmrVisualMTSReport: React.FC<ReportProps> = ({ reportData, onSave, job }) => {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [isEditing, setIsEditing] = useState(false);

  const loadFromProps = (data: any) => {
    console.log('=== Loading Liquid Xfmr Visual MTS Report ===');
    console.log('Raw data received:', data);
    console.log('Raw data type:', typeof data);
    console.log('Raw data keys:', Object.keys(data || {}));
    console.log('Raw data JSON:', JSON.stringify(data, null, 2).substring(0, 3000));

    const prev = initialFormData;
    
    // The data comes from ReportViewer which parses report_data JSON
    // Structure: { reportInfo: {...}, visualInspection: {...}, testEquipment: {...}, status: 'PASS' }
    // reportInfo contains: customer, address, temperature, nameplateData, insulationResistance, etc.
    
    // Direct access to the structure
    const ri = data.reportInfo || data.report_info || {};
    const vi = data.visualInspection || data.visual_inspection || {};
    const te = data.testEquipment || data.test_equipment || {};
    
    console.log('=== PARSED STRUCTURE ===');
    console.log('data.reportInfo exists?', !!data.reportInfo);
    console.log('data.report_info exists?', !!data.report_info);
    console.log('reportInfo (ri):', ri);
    console.log('reportInfo keys:', Object.keys(ri || {}));
    console.log('visualInspection (vi):', vi);
    console.log('testEquipment (te):', te);
    
    // Nameplate is nested inside reportInfo
    const np = ri.nameplateData || ri.nameplate_data || {};
    const temp = ri.temperature || {};
    
    // Insulation resistance is INSIDE reportInfo
    console.log('=== LOOKING FOR INSULATION RESISTANCE ===');
    console.log('ri.insulationResistance:', ri.insulationResistance);
    console.log('ri.insulation_resistance:', ri.insulation_resistance);
    console.log('data.insulationResistance:', data.insulationResistance);
    console.log('data.insulation_resistance:', data.insulation_resistance);
    
    // Try all possible paths
    const ir = ri.insulationResistance || ri.insulation_resistance || 
               data.insulationResistance || data.insulation_resistance || {};
    
    console.log('=== FINAL INSULATION RESISTANCE ===');
    console.log('Final ir object:', ir);
    console.log('ir keys:', Object.keys(ir || {}));
    console.log('ir.primaryToGround:', ir.primaryToGround);
    console.log('ir.secondaryToGround:', ir.secondaryToGround);
    console.log('ir.primaryToSecondary:', ir.primaryToSecondary);

    console.log('Report info:', ri);
    console.log('Nameplate:', np);
    console.log('Visual Inspection:', vi);
    console.log('Insulation Resistance:', ir);
    console.log('Test Equipment:', te);

    // Map visual inspection from object format { "7.2.2.A.1": "Satisfactory", ... } to array
    const mappedVisualInspection = prev.visualMechanicalInspection.map(item => {
      const raw = vi[item.netaSection];
      const normalized = typeof raw === 'string' ? raw.trim() : '';
      const lower = normalized.toLowerCase();
      const mapped = (
        lower === 's' || lower === 'satisfactory' ? 'Satisfactory'
        : lower === 'u' || lower === 'unsatisfactory' ? 'Unsatisfactory'
        : lower === 'na' || lower === 'not applicable' ? 'Not Applicable'
        : lower === 'r' || lower === 'repaired' ? 'Repaired'
        : lower === 'c' || lower === 'cleaned' ? 'Cleaned'
        : lower === 'sc' || lower === 'see comments' ? 'See Comments'
        : normalized || item.result
      );
      return { ...item, result: mapped };
    });

    setFormData({
      customer: ri.customer || data.customer || prev.customer,
      address: ri.address || data.address || prev.address,
      user: ri.userName || ri.user || data.user || prev.user,
      date: ri.date || data.date || prev.date,
      identifier: ri.identifier || data.identifier || prev.identifier,
      jobNumber: ri.jobNumber || ri.job_number || data.jobNumber || prev.jobNumber,
      technicians: ri.technicians || data.technicians || prev.technicians,
      temperature: {
        fahrenheit: temp.fahrenheit ?? prev.temperature.fahrenheit,
        celsius: temp.celsius ?? prev.temperature.celsius,
        tcf: temp.correctionFactor ?? temp.tcf ?? getTCF(temp.celsius ?? prev.temperature.celsius),
        humidity: temp.humidity ?? prev.temperature.humidity
      },
      substation: ri.substation || data.substation || prev.substation,
      eqptLocation: ri.eqptLocation || ri.eqpt_location || data.eqptLocation || prev.eqptLocation,
      status: data.status || ri.status || prev.status,
      nameplate: {
        manufacturer: np.manufacturer || prev.nameplate.manufacturer,
        kVA: np.kva || np.kVA || prev.nameplate.kVA,
        catalogNumber: np.catalogNumber || np.catalog_number || prev.nameplate.catalogNumber,
        tempRise: np.tempRise || np.temp_rise || prev.nameplate.tempRise,
        fluidType: np.fluidType || np.fluid_type || prev.nameplate.fluidType,
        serialNumber: np.serialNumber || np.serial_number || prev.nameplate.serialNumber,
        impedance: np.impedance || prev.nameplate.impedance,
        fluidVolume: np.fluidVolume || np.fluid_volume || prev.nameplate.fluidVolume,
        // Voltages from nested primary/secondary objects
        primaryVolts1: np.primary?.volts || np.primaryVolts1 || prev.nameplate.primaryVolts1,
        primaryVolts2: np.primary?.voltsSecondary || np.primaryVolts2 || prev.nameplate.primaryVolts2,
        secondaryVolts1: np.secondary?.volts || np.secondaryVolts1 || prev.nameplate.secondaryVolts1,
        secondaryVolts2: np.secondary?.voltsSecondary || np.secondaryVolts2 || prev.nameplate.secondaryVolts2,
        // Connections - from string to boolean
        primaryConnectionDelta: np.primary?.connection === 'Delta' || np.primaryConnectionDelta || prev.nameplate.primaryConnectionDelta,
        primaryConnectionWye: np.primary?.connection === 'Wye' || np.primaryConnectionWye || prev.nameplate.primaryConnectionWye,
        primaryConnectionSinglePhase: np.primary?.connection === 'Single Phase' || np.primary?.connection === 'SinglePhase' || np.primaryConnectionSinglePhase || prev.nameplate.primaryConnectionSinglePhase,
        secondaryConnectionDelta: np.secondary?.connection === 'Delta' || np.secondaryConnectionDelta || prev.nameplate.secondaryConnectionDelta,
        secondaryConnectionWye: np.secondary?.connection === 'Wye' || np.secondaryConnectionWye || prev.nameplate.secondaryConnectionWye,
        secondaryConnectionSinglePhase: np.secondary?.connection === 'Single Phase' || np.secondary?.connection === 'SinglePhase' || np.secondaryConnectionSinglePhase || prev.nameplate.secondaryConnectionSinglePhase,
        // Materials - from string to boolean
        primaryWindingMaterialAluminum: np.primary?.material === 'Aluminum' || np.primaryWindingMaterialAluminum || prev.nameplate.primaryWindingMaterialAluminum,
        primaryWindingMaterialCopper: np.primary?.material === 'Copper' || np.primaryWindingMaterialCopper || prev.nameplate.primaryWindingMaterialCopper,
        secondaryWindingMaterialAluminum: np.secondary?.material === 'Aluminum' || np.secondaryWindingMaterialAluminum || prev.nameplate.secondaryWindingMaterialAluminum,
        secondaryWindingMaterialCopper: np.secondary?.material === 'Copper' || np.secondaryWindingMaterialCopper || prev.nameplate.secondaryWindingMaterialCopper,
        // Tap configuration
        tapVoltages: ensureArray(np.tapConfiguration?.voltages || np.tapVoltages, prev.nameplate.tapVoltages),
        tapPositions: ensureArray(np.tapConfiguration?.positions || np.tapPositions, prev.nameplate.tapPositions).map((p: any) => String(p)),
        tapPositionLeft1: np.tapConfiguration?.currentPosition || np.tapPositionLeft1 || prev.nameplate.tapPositionLeft1,
        tapPositionLeft2: np.tapConfiguration?.currentPositionSecondary || np.tapPositionLeft2 || prev.nameplate.tapPositionLeft2,
        tapVoltsSpecific: np.tapConfiguration?.tapVoltsSpecific || np.tapVoltsSpecific || prev.nameplate.tapVoltsSpecific,
        tapPercentSpecific: np.tapConfiguration?.tapPercentSpecific || np.tapPercentSpecific || prev.nameplate.tapPercentSpecific,
      },
      indicatorGaugeValues: {
        oilLevel: ri.oilLevel || prev.indicatorGaugeValues.oilLevel,
        tankPressure: ri.tankPressure || prev.indicatorGaugeValues.tankPressure,
        oilTemperature: ri.oilTemperature || prev.indicatorGaugeValues.oilTemperature,
        windingTemperature: ri.windingTemperature || prev.indicatorGaugeValues.windingTemperature,
        oilTempRange: ri.oilTempRange || prev.indicatorGaugeValues.oilTempRange,
        windingTempRange: ri.windingTempRange || prev.indicatorGaugeValues.windingTempRange,
      },
      visualMechanicalInspection: mappedVisualInspection,
      visualMechanicalInspectionComments: ri.visualComments || ri.comments || ri.visualMechanicalInspectionComments || prev.visualMechanicalInspectionComments,
      electricalTestsInsulationResistance: (() => {
        // Handle multiple possible structures for insulation resistance
        const ptg = ir.primaryToGround || ir.primary_to_ground || {};
        const stg = ir.secondaryToGround || ir.secondary_to_ground || {};
        const pts = ir.primaryToSecondary || ir.primary_to_secondary || {};
        const da = ir.dielectricAbsorption || ir.dielectric_absorption || {};
        const pi = ir.polarizationIndex || ir.polarization_index || {};
        
        console.log('=== INSULATION RESISTANCE EXTRACTION ===');
        console.log('ir object:', JSON.stringify(ir));
        console.log('ptg object:', JSON.stringify(ptg));
        console.log('ptg.readings:', ptg.readings);
        console.log('ptg.readings?.halfMinute:', ptg.readings?.halfMinute);
        console.log('stg object:', JSON.stringify(stg));
        console.log('pts object:', JSON.stringify(pts));
        
        // Helper to get reading value - handles string or number
        const getReading = (obj: any, ...paths: string[]) => {
          for (const path of paths) {
            const parts = path.split('.');
            let val: any = obj;
            for (const part of parts) {
              val = val?.[part];
            }
            if (val !== undefined && val !== null && val !== '') {
              console.log(`  Found value at ${path}:`, val);
              return String(val);
            }
          }
          return '';
        };
        
        const result = {
          primaryToGround: {
            testVoltage: ptg.testVoltage || ptg.test_voltage || prev.electricalTestsInsulationResistance.primaryToGround.testVoltage,
            units: ptg.unit || ptg.units || prev.electricalTestsInsulationResistance.primaryToGround.units,
            values: {
              halfMin: getReading(ptg, 'readings.halfMinute', 'readings.half_minute', 'halfMin', 'half_min', 'r05') || prev.electricalTestsInsulationResistance.primaryToGround.values.halfMin,
              oneMin: getReading(ptg, 'readings.oneMinute', 'readings.one_minute', 'oneMin', 'one_min', 'r1') || prev.electricalTestsInsulationResistance.primaryToGround.values.oneMin,
              tenMin: getReading(ptg, 'readings.tenMinute', 'readings.ten_minute', 'tenMin', 'ten_min', 'r10') || prev.electricalTestsInsulationResistance.primaryToGround.values.tenMin,
            },
            correctedValues: {
              halfMin: getReading(ptg, 'corrected.halfMinute', 'corrected.half_minute') || '',
              oneMin: getReading(ptg, 'corrected.oneMinute', 'corrected.one_minute') || '',
              tenMin: getReading(ptg, 'corrected.tenMinute', 'corrected.ten_minute') || '',
            },
          },
          secondaryToGround: {
            testVoltage: stg.testVoltage || stg.test_voltage || prev.electricalTestsInsulationResistance.secondaryToGround.testVoltage,
            units: stg.unit || stg.units || prev.electricalTestsInsulationResistance.secondaryToGround.units,
            values: {
              halfMin: getReading(stg, 'readings.halfMinute', 'readings.half_minute', 'halfMin', 'half_min', 'r05') || prev.electricalTestsInsulationResistance.secondaryToGround.values.halfMin,
              oneMin: getReading(stg, 'readings.oneMinute', 'readings.one_minute', 'oneMin', 'one_min', 'r1') || prev.electricalTestsInsulationResistance.secondaryToGround.values.oneMin,
              tenMin: getReading(stg, 'readings.tenMinute', 'readings.ten_minute', 'tenMin', 'ten_min', 'r10') || prev.electricalTestsInsulationResistance.secondaryToGround.values.tenMin,
            },
            correctedValues: {
              halfMin: getReading(stg, 'corrected.halfMinute', 'corrected.half_minute') || '',
              oneMin: getReading(stg, 'corrected.oneMinute', 'corrected.one_minute') || '',
              tenMin: getReading(stg, 'corrected.tenMinute', 'corrected.ten_minute') || '',
            },
          },
          primaryToSecondary: {
            testVoltage: pts.testVoltage || pts.test_voltage || prev.electricalTestsInsulationResistance.primaryToSecondary.testVoltage,
            units: pts.unit || pts.units || prev.electricalTestsInsulationResistance.primaryToSecondary.units,
            values: {
              halfMin: getReading(pts, 'readings.halfMinute', 'readings.half_minute', 'halfMin', 'half_min', 'r05') || prev.electricalTestsInsulationResistance.primaryToSecondary.values.halfMin,
              oneMin: getReading(pts, 'readings.oneMinute', 'readings.one_minute', 'oneMin', 'one_min', 'r1') || prev.electricalTestsInsulationResistance.primaryToSecondary.values.oneMin,
              tenMin: getReading(pts, 'readings.tenMinute', 'readings.ten_minute', 'tenMin', 'ten_min', 'r10') || prev.electricalTestsInsulationResistance.primaryToSecondary.values.tenMin,
            },
            correctedValues: {
              halfMin: getReading(pts, 'corrected.halfMinute', 'corrected.half_minute') || '',
              oneMin: getReading(pts, 'corrected.oneMinute', 'corrected.one_minute') || '',
              tenMin: getReading(pts, 'corrected.tenMinute', 'corrected.ten_minute') || '',
            },
          },
          dielectricAbsorption: {
            primary: String(da.primary || prev.electricalTestsInsulationResistance.dielectricAbsorption.primary || ''),
            secondary: String(da.secondary || prev.electricalTestsInsulationResistance.dielectricAbsorption.secondary || ''),
            primaryToSecondary: String(da.primaryToSecondary || da.primary_to_secondary || da.priToSec || prev.electricalTestsInsulationResistance.dielectricAbsorption.primaryToSecondary || ''),
          },
          polarizationIndex: {
            primary: String(pi.primary || prev.electricalTestsInsulationResistance.polarizationIndex.primary || ''),
            secondary: String(pi.secondary || prev.electricalTestsInsulationResistance.polarizationIndex.secondary || ''),
            primaryToSecondary: String(pi.primaryToSecondary || pi.primary_to_secondary || pi.priToSec || prev.electricalTestsInsulationResistance.polarizationIndex.primaryToSecondary || ''),
          },
          acceptableDAPI: ir.acceptable || ir.acceptableDAPI || prev.electricalTestsInsulationResistance.acceptableDAPI,
        };
        
        console.log('=== FINAL INSULATION RESISTANCE RESULT ===');
        console.log('primaryToGround values:', result.primaryToGround.values);
        console.log('secondaryToGround values:', result.secondaryToGround.values);
        console.log('primaryToSecondary values:', result.primaryToSecondary.values);
        
        return result;
      })(),
      testEquipmentUsed: {
        megohmmeter: te.megohmmeter?.name || te.megohmmeter || prev.testEquipmentUsed.megohmmeter,
        serialNumber: te.megohmmeter?.serialNumber || te.serialNumber || prev.testEquipmentUsed.serialNumber,
        ampId: te.megohmmeter?.ampId || te.ampId || prev.testEquipmentUsed.ampId,
      },
      electricalTestComments: ri.electricalComments || ri.electricalTestComments || prev.electricalTestComments,
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

  // Recalculate corrected values and ratios
  useEffect(() => {
    const tcf = formData.temperature.tcf;
    
    const calculateCorrected = (entry: InsulationTestEntry): InsulationTestEntry => {
      const correctedValues = {
        halfMin: entry.values.halfMin ? (parseFloat(entry.values.halfMin) * tcf).toFixed(2) : '',
        oneMin: entry.values.oneMin ? (parseFloat(entry.values.oneMin) * tcf).toFixed(2) : '',
        tenMin: entry.values.tenMin ? (parseFloat(entry.values.tenMin) * tcf).toFixed(2) : '',
      };
      return { ...entry, correctedValues };
    };

    const calculateRatio = (numerator: string, denominator: string): string => {
      const num = parseFloat(numerator);
      const den = parseFloat(denominator);
      if (isNaN(num) || isNaN(den) || den === 0) return '';
      return (num / den).toFixed(2);
    };

    const primaryToGround = calculateCorrected(formData.electricalTestsInsulationResistance.primaryToGround);
    const secondaryToGround = calculateCorrected(formData.electricalTestsInsulationResistance.secondaryToGround);
    const primaryToSecondary = calculateCorrected(formData.electricalTestsInsulationResistance.primaryToSecondary);

    const dielectricAbsorption = {
      primary: calculateRatio(primaryToGround.correctedValues.oneMin, primaryToGround.correctedValues.halfMin),
      secondary: calculateRatio(secondaryToGround.correctedValues.oneMin, secondaryToGround.correctedValues.halfMin),
      primaryToSecondary: calculateRatio(primaryToSecondary.correctedValues.oneMin, primaryToSecondary.correctedValues.halfMin),
    };

    const polarizationIndex = {
      primary: calculateRatio(primaryToGround.correctedValues.tenMin, primaryToGround.correctedValues.oneMin),
      secondary: calculateRatio(secondaryToGround.correctedValues.tenMin, secondaryToGround.correctedValues.oneMin),
      primaryToSecondary: calculateRatio(primaryToSecondary.correctedValues.tenMin, primaryToSecondary.correctedValues.oneMin),
    };

    // Determine if DA and PI are acceptable (>1.0)
    const daValues = [dielectricAbsorption.primary, dielectricAbsorption.secondary, dielectricAbsorption.primaryToSecondary].map(v => parseFloat(v));
    const piValues = [polarizationIndex.primary, polarizationIndex.secondary, polarizationIndex.primaryToSecondary].map(v => parseFloat(v));
    const allAcceptable = daValues.every(v => isNaN(v) || v > 1.0) && piValues.every(v => isNaN(v) || v > 1.0);
    const acceptableDAPI = allAcceptable ? 'Yes' : 'No';

    setFormData(prev => ({
      ...prev,
      electricalTestsInsulationResistance: {
        ...prev.electricalTestsInsulationResistance,
        primaryToGround,
        secondaryToGround,
        primaryToSecondary,
        dielectricAbsorption,
        polarizationIndex,
        acceptableDAPI,
      }
    }));
  }, [
    formData.electricalTestsInsulationResistance.primaryToGround.values,
    formData.electricalTestsInsulationResistance.secondaryToGround.values,
    formData.electricalTestsInsulationResistance.primaryToSecondary.values,
    formData.temperature.tcf
  ]);

  const handleTemperatureChange = (fahrenheit: number) => {
    const celsius = Math.round((fahrenheit - 32) * 5 / 9);
    const tcf = getTCF(celsius);
    setFormData(prev => ({
      ...prev,
      temperature: { ...prev.temperature, fahrenheit, celsius, tcf }
    }));
  };

  const handleChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleVisualInspectionChange = (index: number, field: 'result' | 'comments', value: string) => {
    setFormData(prev => {
      const newItems = [...prev.visualMechanicalInspection];
      newItems[index] = { ...newItems[index], [field]: value };
      return { ...prev, visualMechanicalInspection: newItems };
    });
  };

  const handleInsulationChange = (testId: 'primaryToGround' | 'secondaryToGround' | 'primaryToSecondary', field: keyof InsulationTestEntry['values'], value: string) => {
    setFormData(prev => ({
      ...prev,
      electricalTestsInsulationResistance: {
        ...prev.electricalTestsInsulationResistance,
        [testId]: {
          ...prev.electricalTestsInsulationResistance[testId],
          values: { ...prev.electricalTestsInsulationResistance[testId].values, [field]: value }
        }
      }
    }));
  };

  const handleSave = () => {
    if (onSave) {
      onSave(formData);
    }
    setIsEditing(false);
  };

  return (
    <div className="report-container p-6 max-w-6xl mx-auto bg-white">
      <ReportHeader
        title="2-Liquid Filled Xfmr. Visual, Mechanical, Insulation Resistance Test MTS"
        status={formData.status}
        onStatusChange={() => handleChange('status', formData.status === 'PASS' ? 'FAIL' : 'PASS')}
        isEditing={isEditing}
        onEdit={() => setIsEditing(true)}
        onSave={handleSave}
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
              <td><input type="text" className="table-input bg-gray-100" value={formData.temperature.tcf.toFixed(3)} readOnly /></td>
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
              <td className="label-cell">Manufacturer</td>
              <td><input type="text" className="table-input" value={formData.nameplate.manufacturer} onChange={(e) => setFormData(prev => ({ ...prev, nameplate: { ...prev.nameplate, manufacturer: e.target.value } }))} disabled={!isEditing} /></td>
              <td className="label-cell">KVA</td>
              <td><input type="text" className="table-input" value={formData.nameplate.kVA} onChange={(e) => setFormData(prev => ({ ...prev, nameplate: { ...prev.nameplate, kVA: e.target.value } }))} disabled={!isEditing} /></td>
              <td className="label-cell">Catalog #</td>
              <td><input type="text" className="table-input" value={formData.nameplate.catalogNumber} onChange={(e) => setFormData(prev => ({ ...prev, nameplate: { ...prev.nameplate, catalogNumber: e.target.value } }))} disabled={!isEditing} /></td>
            </tr>
            <tr>
              <td className="label-cell">Temp Rise</td>
              <td><input type="text" className="table-input" value={formData.nameplate.tempRise} onChange={(e) => setFormData(prev => ({ ...prev, nameplate: { ...prev.nameplate, tempRise: e.target.value } }))} disabled={!isEditing} /></td>
              <td className="label-cell">Fluid Type</td>
              <td><input type="text" className="table-input" value={formData.nameplate.fluidType} onChange={(e) => setFormData(prev => ({ ...prev, nameplate: { ...prev.nameplate, fluidType: e.target.value } }))} disabled={!isEditing} /></td>
              <td className="label-cell">Serial #</td>
              <td><input type="text" className="table-input" value={formData.nameplate.serialNumber} onChange={(e) => setFormData(prev => ({ ...prev, nameplate: { ...prev.nameplate, serialNumber: e.target.value } }))} disabled={!isEditing} /></td>
            </tr>
            <tr>
              <td className="label-cell">Impedance (%)</td>
              <td><input type="text" className="table-input" value={formData.nameplate.impedance} onChange={(e) => setFormData(prev => ({ ...prev, nameplate: { ...prev.nameplate, impedance: e.target.value } }))} disabled={!isEditing} /></td>
              <td className="label-cell">Fluid Volume</td>
              <td colSpan={3}><input type="text" className="table-input" value={formData.nameplate.fluidVolume} onChange={(e) => setFormData(prev => ({ ...prev, nameplate: { ...prev.nameplate, fluidVolume: e.target.value } }))} disabled={!isEditing} /></td>
            </tr>
          </tbody>
        </table>

        {/* Voltage Configuration */}
        <table className="data-table w-full mt-2">
          <thead>
            <tr>
              <th></th>
              <th>Volts 1</th>
              <th>Volts 2</th>
              <th>Delta</th>
              <th>Wye</th>
              <th>Single Phase</th>
              <th>Aluminum</th>
              <th>Copper</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="label-cell">Primary</td>
              <td><input type="text" className="table-input" value={formData.nameplate.primaryVolts1} onChange={(e) => setFormData(prev => ({ ...prev, nameplate: { ...prev.nameplate, primaryVolts1: e.target.value } }))} disabled={!isEditing} /></td>
              <td><input type="text" className="table-input" value={formData.nameplate.primaryVolts2} onChange={(e) => setFormData(prev => ({ ...prev, nameplate: { ...prev.nameplate, primaryVolts2: e.target.value } }))} disabled={!isEditing} /></td>
              <td className="text-center"><input type="checkbox" checked={formData.nameplate.primaryConnectionDelta} onChange={(e) => setFormData(prev => ({ ...prev, nameplate: { ...prev.nameplate, primaryConnectionDelta: e.target.checked } }))} disabled={!isEditing} /></td>
              <td className="text-center"><input type="checkbox" checked={formData.nameplate.primaryConnectionWye} onChange={(e) => setFormData(prev => ({ ...prev, nameplate: { ...prev.nameplate, primaryConnectionWye: e.target.checked } }))} disabled={!isEditing} /></td>
              <td className="text-center"><input type="checkbox" checked={formData.nameplate.primaryConnectionSinglePhase} onChange={(e) => setFormData(prev => ({ ...prev, nameplate: { ...prev.nameplate, primaryConnectionSinglePhase: e.target.checked } }))} disabled={!isEditing} /></td>
              <td className="text-center"><input type="checkbox" checked={formData.nameplate.primaryWindingMaterialAluminum} onChange={(e) => setFormData(prev => ({ ...prev, nameplate: { ...prev.nameplate, primaryWindingMaterialAluminum: e.target.checked } }))} disabled={!isEditing} /></td>
              <td className="text-center"><input type="checkbox" checked={formData.nameplate.primaryWindingMaterialCopper} onChange={(e) => setFormData(prev => ({ ...prev, nameplate: { ...prev.nameplate, primaryWindingMaterialCopper: e.target.checked } }))} disabled={!isEditing} /></td>
            </tr>
            <tr>
              <td className="label-cell">Secondary</td>
              <td><input type="text" className="table-input" value={formData.nameplate.secondaryVolts1} onChange={(e) => setFormData(prev => ({ ...prev, nameplate: { ...prev.nameplate, secondaryVolts1: e.target.value } }))} disabled={!isEditing} /></td>
              <td><input type="text" className="table-input" value={formData.nameplate.secondaryVolts2} onChange={(e) => setFormData(prev => ({ ...prev, nameplate: { ...prev.nameplate, secondaryVolts2: e.target.value } }))} disabled={!isEditing} /></td>
              <td className="text-center"><input type="checkbox" checked={formData.nameplate.secondaryConnectionDelta} onChange={(e) => setFormData(prev => ({ ...prev, nameplate: { ...prev.nameplate, secondaryConnectionDelta: e.target.checked } }))} disabled={!isEditing} /></td>
              <td className="text-center"><input type="checkbox" checked={formData.nameplate.secondaryConnectionWye} onChange={(e) => setFormData(prev => ({ ...prev, nameplate: { ...prev.nameplate, secondaryConnectionWye: e.target.checked } }))} disabled={!isEditing} /></td>
              <td className="text-center"><input type="checkbox" checked={formData.nameplate.secondaryConnectionSinglePhase} onChange={(e) => setFormData(prev => ({ ...prev, nameplate: { ...prev.nameplate, secondaryConnectionSinglePhase: e.target.checked } }))} disabled={!isEditing} /></td>
              <td className="text-center"><input type="checkbox" checked={formData.nameplate.secondaryWindingMaterialAluminum} onChange={(e) => setFormData(prev => ({ ...prev, nameplate: { ...prev.nameplate, secondaryWindingMaterialAluminum: e.target.checked } }))} disabled={!isEditing} /></td>
              <td className="text-center"><input type="checkbox" checked={formData.nameplate.secondaryWindingMaterialCopper} onChange={(e) => setFormData(prev => ({ ...prev, nameplate: { ...prev.nameplate, secondaryWindingMaterialCopper: e.target.checked } }))} disabled={!isEditing} /></td>
            </tr>
          </tbody>
        </table>

        {/* Tap Configuration */}
        <table className="data-table w-full mt-2">
          <thead>
            <tr>
              <th>Tap Position</th>
              {[1, 2, 3, 4, 5, 6, 7].map(pos => <th key={pos}>{pos}</th>)}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="label-cell">Voltage</td>
              {formData.nameplate.tapVoltages.map((v, idx) => (
                <td key={idx}>
                  <input type="text" className="table-input" value={v} onChange={(e) => {
                    const newVoltages = [...formData.nameplate.tapVoltages];
                    newVoltages[idx] = e.target.value;
                    setFormData(prev => ({ ...prev, nameplate: { ...prev.nameplate, tapVoltages: newVoltages } }));
                  }} disabled={!isEditing} />
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Indicator/Gauge Values */}
      <div className="section mb-6">
        <h2 className="section-title text-lg font-semibold mb-3 pb-1 border-b-2 border-blue-600">Indicator/Gauge Values</h2>
        <table className="data-table w-full">
          <tbody>
            <tr>
              <td className="label-cell">Oil Level</td>
              <td><input type="text" className="table-input" value={formData.indicatorGaugeValues.oilLevel} onChange={(e) => setFormData(prev => ({ ...prev, indicatorGaugeValues: { ...prev.indicatorGaugeValues, oilLevel: e.target.value } }))} disabled={!isEditing} /></td>
              <td className="label-cell">Tank Pressure</td>
              <td><input type="text" className="table-input" value={formData.indicatorGaugeValues.tankPressure} onChange={(e) => setFormData(prev => ({ ...prev, indicatorGaugeValues: { ...prev.indicatorGaugeValues, tankPressure: e.target.value } }))} disabled={!isEditing} /></td>
            </tr>
            <tr>
              <td className="label-cell">Oil Temperature</td>
              <td><input type="text" className="table-input" value={formData.indicatorGaugeValues.oilTemperature} onChange={(e) => setFormData(prev => ({ ...prev, indicatorGaugeValues: { ...prev.indicatorGaugeValues, oilTemperature: e.target.value } }))} disabled={!isEditing} /></td>
              <td className="label-cell">Winding Temperature</td>
              <td><input type="text" className="table-input" value={formData.indicatorGaugeValues.windingTemperature} onChange={(e) => setFormData(prev => ({ ...prev, indicatorGaugeValues: { ...prev.indicatorGaugeValues, windingTemperature: e.target.value } }))} disabled={!isEditing} /></td>
            </tr>
          </tbody>
        </table>
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
            {formData.visualMechanicalInspection.map((item, idx) => (
              <tr key={idx}>
                <td className="label-cell text-center">{item.netaSection}</td>
                <td className="text-sm">{item.description}</td>
                <td>
                  <select className="table-input" value={item.result || 'Select One'} onChange={(e) => handleVisualInspectionChange(idx, 'result', e.target.value)} disabled={!isEditing}>
                    {visualInspectionOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </td>
                <td>
                  <input type="text" className="table-input" value={item.comments || ''} onChange={(e) => handleVisualInspectionChange(idx, 'comments', e.target.value)} disabled={!isEditing} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-2">
          <label className="font-medium">Visual Inspection Comments:</label>
          <textarea className="w-full p-2 border rounded mt-1" value={formData.visualMechanicalInspectionComments} onChange={(e) => handleChange('visualMechanicalInspectionComments', e.target.value)} disabled={!isEditing} rows={2} />
        </div>
      </div>

      {/* Electrical Tests - Insulation Resistance */}
      <div className="section mb-6">
        <h2 className="section-title text-lg font-semibold mb-3 pb-1 border-b-2 border-blue-600">Electrical Tests - Insulation Resistance</h2>
        
        {(['primaryToGround', 'secondaryToGround', 'primaryToSecondary'] as const).map((testId) => {
          const testData = formData.electricalTestsInsulationResistance[testId];
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
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <select className="table-input" value={testData.testVoltage} onChange={(e) => setFormData(prev => ({
                        ...prev,
                        electricalTestsInsulationResistance: {
                          ...prev.electricalTestsInsulationResistance,
                          [testId]: { ...prev.electricalTestsInsulationResistance[testId], testVoltage: e.target.value }
                        }
                      }))} disabled={!isEditing}>
                        {testVoltageOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    </td>
                    <td>
                      <select className="table-input" value={testData.units} onChange={(e) => setFormData(prev => ({
                        ...prev,
                        electricalTestsInsulationResistance: {
                          ...prev.electricalTestsInsulationResistance,
                          [testId]: { ...prev.electricalTestsInsulationResistance[testId], units: e.target.value }
                        }
                      }))} disabled={!isEditing}>
                        {insulationResistanceUnits.map(u => <option key={u} value={u}>{u}</option>)}
                      </select>
                    </td>
                    <td><input type="text" className="table-input" value={testData.values.halfMin} onChange={(e) => handleInsulationChange(testId, 'halfMin', e.target.value)} disabled={!isEditing} /></td>
                    <td><input type="text" className="table-input" value={testData.values.oneMin} onChange={(e) => handleInsulationChange(testId, 'oneMin', e.target.value)} disabled={!isEditing} /></td>
                    <td><input type="text" className="table-input" value={testData.values.tenMin} onChange={(e) => handleInsulationChange(testId, 'tenMin', e.target.value)} disabled={!isEditing} /></td>
                  </tr>
                  <tr>
                    <td colSpan={2} className="label-cell text-right">Temp Corrected:</td>
                    <td><input type="text" className="table-input bg-gray-100" value={testData.correctedValues.halfMin} readOnly /></td>
                    <td><input type="text" className="table-input bg-gray-100" value={testData.correctedValues.oneMin} readOnly /></td>
                    <td><input type="text" className="table-input bg-gray-100" value={testData.correctedValues.tenMin} readOnly /></td>
                  </tr>
                </tbody>
              </table>
            </div>
          );
        })}

        {/* DA and PI Summary */}
        <table className="data-table w-full mt-4">
          <thead>
            <tr>
              <th></th>
              <th>Primary</th>
              <th>Secondary</th>
              <th>Primary to Secondary</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="label-cell">Dielectric Absorption (1min/30sec)</td>
              <td><input type="text" className="table-input bg-gray-100" value={formData.electricalTestsInsulationResistance.dielectricAbsorption.primary} readOnly /></td>
              <td><input type="text" className="table-input bg-gray-100" value={formData.electricalTestsInsulationResistance.dielectricAbsorption.secondary} readOnly /></td>
              <td><input type="text" className="table-input bg-gray-100" value={formData.electricalTestsInsulationResistance.dielectricAbsorption.primaryToSecondary} readOnly /></td>
            </tr>
            <tr>
              <td className="label-cell">Polarization Index (10min/1min)</td>
              <td><input type="text" className="table-input bg-gray-100" value={formData.electricalTestsInsulationResistance.polarizationIndex.primary} readOnly /></td>
              <td><input type="text" className="table-input bg-gray-100" value={formData.electricalTestsInsulationResistance.polarizationIndex.secondary} readOnly /></td>
              <td><input type="text" className="table-input bg-gray-100" value={formData.electricalTestsInsulationResistance.polarizationIndex.primaryToSecondary} readOnly /></td>
            </tr>
          </tbody>
        </table>
        <div className="mt-2 flex items-center gap-2">
          <label className="font-medium">DA/PI Acceptable (&gt;1.0)?</label>
          <span className={`px-2 py-1 rounded ${formData.electricalTestsInsulationResistance.acceptableDAPI === 'Yes' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {formData.electricalTestsInsulationResistance.acceptableDAPI || 'N/A'}
          </span>
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
              <td><input type="text" className="table-input" value={formData.testEquipmentUsed.megohmmeter} onChange={(e) => setFormData(prev => ({ ...prev, testEquipmentUsed: { ...prev.testEquipmentUsed, megohmmeter: e.target.value } }))} disabled={!isEditing} /></td>
              <td><input type="text" className="table-input" value={formData.testEquipmentUsed.serialNumber} onChange={(e) => setFormData(prev => ({ ...prev, testEquipmentUsed: { ...prev.testEquipmentUsed, serialNumber: e.target.value } }))} disabled={!isEditing} /></td>
              <td><input type="text" className="table-input" value={formData.testEquipmentUsed.ampId} onChange={(e) => setFormData(prev => ({ ...prev, testEquipmentUsed: { ...prev.testEquipmentUsed, ampId: e.target.value } }))} disabled={!isEditing} /></td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Comments */}
      <div className="section mb-6">
        <h2 className="section-title text-lg font-semibold mb-3 pb-1 border-b-2 border-blue-600">Comments</h2>
        <textarea
          className="w-full p-3 border rounded min-h-[100px]"
          value={formData.electricalTestComments}
          onChange={(e) => handleChange('electricalTestComments', e.target.value)}
          disabled={!isEditing}
          placeholder="Enter any additional comments..."
        />
      </div>
    </div>
  );
};

export default LiquidXfmrVisualMTSReport;

