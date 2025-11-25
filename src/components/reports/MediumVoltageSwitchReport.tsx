/**
 * Medium Voltage Switch Report (Oil & SF6)
 * Desktop offline version - matches web app MediumVoltageSwitchOilReport.tsx
 */

import { useState, useEffect } from 'react';
import {
  getTCF, fahrenheitToCelsius, multiplyByTCF,
  VISUAL_INSPECTION_OPTIONS, IR_UNITS, CONTACT_RESISTANCE_UNITS
} from './BaseReport';

// Alias for consistency
const INSULATION_RESISTANCE_UNITS = IR_UNITS;
import './ReportStyles.css';

interface Props {
  job: any;
  reportData: any;
  onSave: (data: any) => void;
  variant?: 'oil' | 'sf6';
}

// Visual inspection items matching web app - NETA 7.1.1
const VISUAL_INSPECTION_DEFINITIONS = [
  { netaSection: '7.1.1.1', description: 'Physical and mechanical condition' },
  { netaSection: '7.1.1.2', description: 'Anchorage, alignment, grounding' },
  { netaSection: '7.1.1.3', description: 'Bolted electrical connections' },
  { netaSection: '7.1.1.4', description: 'Cleanliness' },
  { netaSection: '7.1.1.5', description: 'Shipping braces and circuit-switcher removable supports' },
  { netaSection: '7.1.1.6', description: 'Arc chute assemblies' },
  { netaSection: '7.1.1.7', description: 'Blade alignment and blade penetration' },
  { netaSection: '7.1.1.8', description: 'Mechanical operator' },
  { netaSection: '7.1.1.9', description: 'Fuse linkage and fuse carriers' },
  { netaSection: '7.1.1.10', description: 'Auxiliary devices' },
  { netaSection: '7.1.1.11', description: 'Mechanical interlocking systems' },
  { netaSection: '7.1.1.12', description: 'Lubrication of moving current-carrying parts' },
  { netaSection: '7.1.1.13', description: 'Lubrication of moving and sliding surfaces' },
  { netaSection: '7.1.1.14', description: 'Oil level' },
  { netaSection: '7.1.1.15', description: 'Oil leaks' },
  { netaSection: '7.1.1.16', description: 'Oil condition' }
];

const TEST_VOLTAGE_OPTIONS = ['250V', '500V', '1000V', '2500V', '5000V'];
const DIELECTRIC_VOLTAGE_OPTIONS = [
  '1.6 kVAC', '2.2 kVAC', '14 kVAC', '25 kVAC', '27 kVAC', '30 kVAC', '37 kVAC', '45 kVAC', '60 kVAC', '120 kVAC',
  '2.3 kVDC', '3.1 kVDC', '20 kVDC', '30.5 kVDC', '37.5 kVDC'
];
const DIELECTRIC_UNITS = ['μA', 'mA'];

interface InsulationResistance {
  ag: string;
  bg: string;
  cg: string;
  ab: string;
  bc: string;
  ca: string;
  lineA: string;
  lineB: string;
  lineC: string;
  units: string;
  testVoltage: string;
}

interface ContactResistance {
  aPhase: string;
  aGround: string;
  bPhase: string;
  bGround: string;
  cPhase: string;
  cGround: string;
  units: string;
}

interface DielectricTest {
  waySection: string;
  testVoltageApplied: string;
  ag: string;
  bg: string;
  cg: string;
  units: string;
  duration: number;
  result: 'PASS' | 'FAIL' | 'N/A';
}

interface DielectricVFITest {
  vfiIdentifier: string;
  serialNumber: string;
  counterAsFound: string;
  counterAsLeft: string;
  vacuumIntegrityA: string;
  vacuumIntegrityB: string;
  resultC: string;
  unitsC: string;
}

interface FormData {
  customer: string;
  address: string;
  technicians: string;
  date: string;
  jobNumber: string;
  identifier: string;
  substation: string;
  eqptLocation: string;
  temperature: { fahrenheit: number; celsius: number; tcf: number; humidity: number; };
  
  // Nameplate
  nameplate_manufacturer: string;
  nameplate_catalogNo: string;
  nameplate_serialNumber: string;
  nameplate_dateOfMfg: string;
  nameplate_type: string;
  nameplate_systemVoltage: string;
  nameplate_ratedVoltage: string;
  nameplate_ratedCurrent: string;
  nameplate_aicRating: string;
  nameplate_impulseLevelBIL: string;
  nameplate_oilType?: string;
  nameplate_oilVolume?: string;
  nameplate_sf6GasMass?: string;
  
  // VFI Data
  vfiData: {
    manufacturer: string;
    catalogNo: string;
    type: string;
    ratedVoltage: string;
    ratedCurrent: string;
    aicRating: string;
  };
  
  // Visual Inspection
  visualInspectionResults: Array<{ netaSection: string; description: string; result: string; }>;
  
  // Insulation Resistance per way section
  s1_insulationResistance: InsulationResistance;
  s2_insulationResistance: InsulationResistance;
  t1_insulationResistance: InsulationResistance;
  t2_insulationResistance: InsulationResistance;
  t3_insulationResistance: InsulationResistance;
  
  s1_correctedInsulationResistance: InsulationResistance;
  s2_correctedInsulationResistance: InsulationResistance;
  t1_correctedInsulationResistance: InsulationResistance;
  t2_correctedInsulationResistance: InsulationResistance;
  t3_correctedInsulationResistance: InsulationResistance;
  
  // Contact Resistance per way section
  s1_contactResistance: ContactResistance;
  s2_contactResistance: ContactResistance;
  t1_contactResistance: ContactResistance;
  t2_contactResistance: ContactResistance;
  t3_contactResistance: ContactResistance;
  
  // Dielectric tests
  dielectricWaySectionTests: DielectricTest[];
  dielectricVFITests: DielectricVFITest[];
  
  // Test Equipment
  testEquipment_megohmmeter_megger: string;
  testEquipment_megohmmeter_serialNo: string;
  testEquipment_megohmmeter_ampId: string;
  testEquipment_lowResistance_model: string;
  testEquipment_lowResistance_serialNo: string;
  testEquipment_lowResistance_ampId: string;
  testEquipment_hipot_model: string;
  testEquipment_hipot_serialNo: string;
  testEquipment_hipot_ampId: string;
  
  comments: string;
  status: 'PASS' | 'FAIL';
}

const createDefaultInsulation = (): InsulationResistance => ({
  ag: '', bg: '', cg: '', ab: '', bc: '', ca: '',
  lineA: '', lineB: '', lineC: '',
  units: 'MΩ', testVoltage: '5000V'
});

const createDefaultContact = (): ContactResistance => ({
  aPhase: '', aGround: '', bPhase: '', bGround: '', cPhase: '', cGround: '',
  units: 'µΩ'
});

const createDefaultFormData = (variant: 'oil' | 'sf6'): FormData => ({
  customer: '',
  address: '',
  technicians: '',
  date: new Date().toISOString().split('T')[0],
  jobNumber: '',
  identifier: '',
  substation: '',
  eqptLocation: '',
  temperature: { fahrenheit: 68, celsius: 20, tcf: 1, humidity: 50 },
  
  nameplate_manufacturer: '',
  nameplate_catalogNo: '',
  nameplate_serialNumber: '',
  nameplate_dateOfMfg: '',
  nameplate_type: '',
  nameplate_systemVoltage: '',
  nameplate_ratedVoltage: '',
  nameplate_ratedCurrent: '',
  nameplate_aicRating: '',
  nameplate_impulseLevelBIL: '',
  ...(variant === 'sf6' 
    ? { nameplate_sf6GasMass: '' } 
    : { nameplate_oilType: '', nameplate_oilVolume: '' }),
  
  vfiData: {
    manufacturer: '', catalogNo: '', type: '',
    ratedVoltage: '', ratedCurrent: '', aicRating: ''
  },
  
  visualInspectionResults: VISUAL_INSPECTION_DEFINITIONS.map(def => ({
    netaSection: def.netaSection,
    description: def.description,
    result: 'Select One'
  })),
  
  s1_insulationResistance: createDefaultInsulation(),
  s2_insulationResistance: createDefaultInsulation(),
  t1_insulationResistance: createDefaultInsulation(),
  t2_insulationResistance: createDefaultInsulation(),
  t3_insulationResistance: createDefaultInsulation(),
  
  s1_correctedInsulationResistance: createDefaultInsulation(),
  s2_correctedInsulationResistance: createDefaultInsulation(),
  t1_correctedInsulationResistance: createDefaultInsulation(),
  t2_correctedInsulationResistance: createDefaultInsulation(),
  t3_correctedInsulationResistance: createDefaultInsulation(),
  
  s1_contactResistance: createDefaultContact(),
  s2_contactResistance: createDefaultContact(),
  t1_contactResistance: createDefaultContact(),
  t2_contactResistance: createDefaultContact(),
  t3_contactResistance: createDefaultContact(),
  
  dielectricWaySectionTests: [
    { waySection: 'S1-S2', testVoltageApplied: '30 KVAC', ag: '', bg: '', cg: '', units: 'mA', duration: 60, result: 'N/A' },
    { waySection: 'S1-T1', testVoltageApplied: '30 KVAC', ag: '', bg: '', cg: '', units: 'mA', duration: 60, result: 'N/A' },
    { waySection: 'S1-T2', testVoltageApplied: '30 KVAC', ag: '', bg: '', cg: '', units: 'mA', duration: 60, result: 'N/A' },
    { waySection: 'S1-T3', testVoltageApplied: '30 KVAC', ag: '', bg: '', cg: '', units: 'mA', duration: 60, result: 'N/A' },
  ],
  dielectricVFITests: [
    { vfiIdentifier: '', serialNumber: '', counterAsFound: '', counterAsLeft: '', vacuumIntegrityA: '', vacuumIntegrityB: '', resultC: '', unitsC: 'mA' }
  ],
  
  testEquipment_megohmmeter_megger: '',
  testEquipment_megohmmeter_serialNo: '',
  testEquipment_megohmmeter_ampId: '',
  testEquipment_lowResistance_model: '',
  testEquipment_lowResistance_serialNo: '',
  testEquipment_lowResistance_ampId: '',
  testEquipment_hipot_model: '',
  testEquipment_hipot_serialNo: '',
  testEquipment_hipot_ampId: '',
  
  comments: '',
  status: 'PASS'
});

export function MediumVoltageSwitchReport({ job, reportData, onSave, variant = 'oil' }: Props) {
  const [formData, setFormData] = useState<FormData>(createDefaultFormData(variant));
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Parse incoming data
  const parseReportData = (data: any): Partial<FormData> => {
    if (!data) return {};
    
    const reportInfo = data.report_info || data.reportInfo || {};
    const merged = { ...reportInfo, ...data };
    
    const result: Partial<FormData> = {
      customer: merged.customer || '',
      address: merged.address || '',
      technicians: merged.technicians || '',
      date: merged.date || new Date().toISOString().split('T')[0],
      jobNumber: merged.jobNumber || merged.job_number || '',
      identifier: merged.identifier || '',
      substation: merged.substation || '',
      eqptLocation: merged.eqptLocation || merged.eqpt_location || '',
      
      nameplate_manufacturer: merged.nameplate_manufacturer || merged.nameplate?.manufacturer || '',
      nameplate_catalogNo: merged.nameplate_catalogNo || merged.nameplate?.catalogNo || '',
      nameplate_serialNumber: merged.nameplate_serialNumber || merged.nameplate?.serialNumber || '',
      nameplate_dateOfMfg: merged.nameplate_dateOfMfg || merged.nameplate?.dateOfMfg || '',
      nameplate_type: merged.nameplate_type || merged.nameplate?.type || '',
      nameplate_systemVoltage: merged.nameplate_systemVoltage || merged.nameplate?.systemVoltage || '',
      nameplate_ratedVoltage: merged.nameplate_ratedVoltage || merged.nameplate?.ratedVoltage || '',
      nameplate_ratedCurrent: merged.nameplate_ratedCurrent || merged.nameplate?.ratedCurrent || '',
      nameplate_aicRating: merged.nameplate_aicRating || merged.nameplate?.aicRating || '',
      nameplate_impulseLevelBIL: merged.nameplate_impulseLevelBIL || merged.nameplate?.impulseLevelBIL || '',
      
      comments: merged.comments || '',
      status: merged.status || 'PASS',
    };
    
    // Temperature
    if (merged.temperature) {
      result.temperature = {
        fahrenheit: merged.temperature.fahrenheit ?? 68,
        celsius: merged.temperature.celsius ?? 20,
        tcf: merged.temperature.tcf ?? 1,
        humidity: merged.temperature.humidity ?? 50,
      };
    }
    
    // VFI Data
    if (merged.vfiData || merged.vfi) {
      const vfi = merged.vfiData || merged.vfi || {};
      result.vfiData = {
        manufacturer: vfi.manufacturer || '',
        catalogNo: vfi.catalogNo || '',
        type: vfi.type || '',
        ratedVoltage: vfi.ratedVoltage || '',
        ratedCurrent: vfi.ratedCurrent || '',
        aicRating: vfi.aicRating || '',
      };
    }
    
    // Visual inspection
    if (merged.visualInspectionResults && Array.isArray(merged.visualInspectionResults)) {
      result.visualInspectionResults = merged.visualInspectionResults.map((item: any) => ({
        netaSection: item.netaSection || item.neta_section || '',
        description: item.description || '',
        result: item.result || 'Select One',
      }));
    }
    
    // Insulation resistance sections
    const waySections = ['s1', 's2', 't1', 't2', 't3'] as const;
    waySections.forEach(ws => {
      const irKey = `${ws}_insulationResistance` as keyof FormData;
      const corrKey = `${ws}_correctedInsulationResistance` as keyof FormData;
      const crKey = `${ws}_contactResistance` as keyof FormData;
      
      if (merged[irKey]) {
        (result as any)[irKey] = { ...createDefaultInsulation(), ...merged[irKey] };
      }
      if (merged[corrKey]) {
        (result as any)[corrKey] = { ...createDefaultInsulation(), ...merged[corrKey] };
      }
      if (merged[crKey]) {
        (result as any)[crKey] = { ...createDefaultContact(), ...merged[crKey] };
      }
    });
    
    // Dielectric tests
    if (merged.dielectricWaySectionTests) {
      result.dielectricWaySectionTests = merged.dielectricWaySectionTests;
    }
    if (merged.dielectricVFITests) {
      result.dielectricVFITests = merged.dielectricVFITests;
    }
    
    // Test equipment
    if (merged.testEquipment_megohmmeter_megger) result.testEquipment_megohmmeter_megger = merged.testEquipment_megohmmeter_megger;
    if (merged.testEquipment_megohmmeter_serialNo) result.testEquipment_megohmmeter_serialNo = merged.testEquipment_megohmmeter_serialNo;
    if (merged.testEquipment_megohmmeter_ampId) result.testEquipment_megohmmeter_ampId = merged.testEquipment_megohmmeter_ampId;
    if (merged.testEquipment_lowResistance_model) result.testEquipment_lowResistance_model = merged.testEquipment_lowResistance_model;
    if (merged.testEquipment_lowResistance_serialNo) result.testEquipment_lowResistance_serialNo = merged.testEquipment_lowResistance_serialNo;
    if (merged.testEquipment_lowResistance_ampId) result.testEquipment_lowResistance_ampId = merged.testEquipment_lowResistance_ampId;
    if (merged.testEquipment_hipot_model) result.testEquipment_hipot_model = merged.testEquipment_hipot_model;
    if (merged.testEquipment_hipot_serialNo) result.testEquipment_hipot_serialNo = merged.testEquipment_hipot_serialNo;
    if (merged.testEquipment_hipot_ampId) result.testEquipment_hipot_ampId = merged.testEquipment_hipot_ampId;
    
    return result;
  };

  useEffect(() => {
    if (reportData) {
      const parsed = parseReportData(reportData);
      const merged = { ...createDefaultFormData(variant), ...parsed };
      if (!merged.visualInspectionResults?.length) {
        merged.visualInspectionResults = VISUAL_INSPECTION_DEFINITIONS.map(def => ({
          netaSection: def.netaSection,
          description: def.description,
          result: 'Select One'
        }));
      }
      setFormData(merged);
    }
  }, [reportData, variant]);

  useEffect(() => {
    if (job) {
      setFormData((prev) => ({
        ...prev,
        jobNumber: job.job_number || prev.jobNumber,
        customer: job.customer_name || prev.customer,
        address: job.site_address || prev.address,
      }));
    }
  }, [job]);

  // Recalculate celsius and TCF
  useEffect(() => {
    const fahrenheit = formData.temperature?.fahrenheit || 68;
    const celsius = fahrenheitToCelsius(fahrenheit);
    const tcf = getTCF(celsius);
    if (celsius !== formData.temperature?.celsius || tcf !== formData.temperature?.tcf) {
      setFormData((prev) => ({
        ...prev,
        temperature: { ...prev.temperature, celsius, tcf },
      }));
    }
  }, [formData.temperature?.fahrenheit]);

  // Recalculate corrected insulation resistance
  useEffect(() => {
    const tcf = formData.temperature?.tcf || 1;
    const waySections = ['s1', 's2', 't1', 't2', 't3'] as const;
    
    setFormData((prev) => {
      const updates: any = {};
      waySections.forEach(ws => {
        const irKey = `${ws}_insulationResistance` as keyof FormData;
        const corrKey = `${ws}_correctedInsulationResistance` as keyof FormData;
        const ir = prev[irKey] as InsulationResistance;
        
        updates[corrKey] = {
          ...ir,
          ag: multiplyByTCF(ir.ag, tcf),
          bg: multiplyByTCF(ir.bg, tcf),
          cg: multiplyByTCF(ir.cg, tcf),
          ab: multiplyByTCF(ir.ab, tcf),
          bc: multiplyByTCF(ir.bc, tcf),
          ca: multiplyByTCF(ir.ca, tcf),
          lineA: multiplyByTCF(ir.lineA, tcf),
          lineB: multiplyByTCF(ir.lineB, tcf),
          lineC: multiplyByTCF(ir.lineC, tcf),
        };
      });
      return { ...prev, ...updates };
    });
  }, [
    formData.s1_insulationResistance, formData.s2_insulationResistance,
    formData.t1_insulationResistance, formData.t2_insulationResistance,
    formData.t3_insulationResistance, formData.temperature?.tcf
  ]);

  const setField = (path: string, value: any) => {
    setFormData((prev) => {
      const clone = JSON.parse(JSON.stringify(prev));
      const keys = path.split('.');
      let cur = clone;
      for (let i = 0; i < keys.length - 1; i++) {
        if (cur[keys[i]] === undefined) cur[keys[i]] = {};
        cur = cur[keys[i]];
      }
      cur[keys[keys.length - 1]] = value;
      return clone;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({ ...formData, data: { ...formData } });
      setIsEditing(false);
    } catch (error) {
      console.error('Save failed:', error);
      alert('Failed to save report');
    } finally {
      setSaving(false);
    }
  };

  const updateVisualInspection = (index: number, value: string) => {
    const items = [...formData.visualInspectionResults];
    items[index] = { ...items[index], result: value };
    setFormData((prev) => ({ ...prev, visualInspectionResults: items }));
  };

  const updateDielectricTest = (index: number, field: string, value: any) => {
    const tests = [...formData.dielectricWaySectionTests];
    tests[index] = { ...tests[index], [field]: value };
    setFormData((prev) => ({ ...prev, dielectricWaySectionTests: tests }));
  };

  const updateDielectricVFI = (index: number, field: string, value: any) => {
    const tests = [...formData.dielectricVFITests];
    tests[index] = { ...tests[index], [field]: value };
    setFormData((prev) => ({ ...prev, dielectricVFITests: tests }));
  };

  const reportTitle = variant === 'sf6' 
    ? 'Medium Voltage Way Switch (SF6) Report'
    : '7-Medium Voltage Way Switch (OIL) Report ATS 21';

  const renderInsulationSection = (waySection: string, irKey: keyof FormData, corrKey: keyof FormData) => {
    const ir = formData[irKey] as InsulationResistance;
    const corr = formData[corrKey] as InsulationResistance;
    
    return (
      <div key={waySection} className="mb-4">
        <h4 className="font-medium mb-2">{waySection}</h4>
        <div className="table-container">
          <table className="report-table compact">
            <thead>
              <tr>
                <th></th>
                <th>A-G</th>
                <th>B-G</th>
                <th>C-G</th>
                <th>A-B</th>
                <th>B-C</th>
                <th>C-A</th>
                <th>Line A</th>
                <th>Line B</th>
                <th>Line C</th>
                <th>Units</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Measured</td>
                <td><input type="text" value={ir.ag} onChange={(e) => setField(`${irKey}.ag`, e.target.value)} readOnly={!isEditing} className="report-input text-center" /></td>
                <td><input type="text" value={ir.bg} onChange={(e) => setField(`${irKey}.bg`, e.target.value)} readOnly={!isEditing} className="report-input text-center" /></td>
                <td><input type="text" value={ir.cg} onChange={(e) => setField(`${irKey}.cg`, e.target.value)} readOnly={!isEditing} className="report-input text-center" /></td>
                <td><input type="text" value={ir.ab} onChange={(e) => setField(`${irKey}.ab`, e.target.value)} readOnly={!isEditing} className="report-input text-center" /></td>
                <td><input type="text" value={ir.bc} onChange={(e) => setField(`${irKey}.bc`, e.target.value)} readOnly={!isEditing} className="report-input text-center" /></td>
                <td><input type="text" value={ir.ca} onChange={(e) => setField(`${irKey}.ca`, e.target.value)} readOnly={!isEditing} className="report-input text-center" /></td>
                <td><input type="text" value={ir.lineA} onChange={(e) => setField(`${irKey}.lineA`, e.target.value)} readOnly={!isEditing} className="report-input text-center" /></td>
                <td><input type="text" value={ir.lineB} onChange={(e) => setField(`${irKey}.lineB`, e.target.value)} readOnly={!isEditing} className="report-input text-center" /></td>
                <td><input type="text" value={ir.lineC} onChange={(e) => setField(`${irKey}.lineC`, e.target.value)} readOnly={!isEditing} className="report-input text-center" /></td>
                <td>
                  <select value={ir.units} onChange={(e) => setField(`${irKey}.units`, e.target.value)} disabled={!isEditing} className="report-input">
                    {INSULATION_RESISTANCE_UNITS.map(u => <option key={u.symbol} value={u.symbol}>{u.symbol}</option>)}
                  </select>
                </td>
              </tr>
              <tr>
                <td>@20°C</td>
                <td><input type="text" value={corr.ag} readOnly className="report-input text-center bg-gray-100" /></td>
                <td><input type="text" value={corr.bg} readOnly className="report-input text-center bg-gray-100" /></td>
                <td><input type="text" value={corr.cg} readOnly className="report-input text-center bg-gray-100" /></td>
                <td><input type="text" value={corr.ab} readOnly className="report-input text-center bg-gray-100" /></td>
                <td><input type="text" value={corr.bc} readOnly className="report-input text-center bg-gray-100" /></td>
                <td><input type="text" value={corr.ca} readOnly className="report-input text-center bg-gray-100" /></td>
                <td><input type="text" value={corr.lineA} readOnly className="report-input text-center bg-gray-100" /></td>
                <td><input type="text" value={corr.lineB} readOnly className="report-input text-center bg-gray-100" /></td>
                <td><input type="text" value={corr.lineC} readOnly className="report-input text-center bg-gray-100" /></td>
                <td>{corr.units}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderContactSection = (waySection: string, crKey: keyof FormData) => {
    const cr = formData[crKey] as ContactResistance;
    
    return (
      <tr key={waySection}>
        <td>{waySection}</td>
        <td><input type="text" value={cr.aPhase} onChange={(e) => setField(`${crKey}.aPhase`, e.target.value)} readOnly={!isEditing} className="report-input text-center" /></td>
        <td><input type="text" value={cr.aGround} onChange={(e) => setField(`${crKey}.aGround`, e.target.value)} readOnly={!isEditing} className="report-input text-center" /></td>
        <td><input type="text" value={cr.bPhase} onChange={(e) => setField(`${crKey}.bPhase`, e.target.value)} readOnly={!isEditing} className="report-input text-center" /></td>
        <td><input type="text" value={cr.bGround} onChange={(e) => setField(`${crKey}.bGround`, e.target.value)} readOnly={!isEditing} className="report-input text-center" /></td>
        <td><input type="text" value={cr.cPhase} onChange={(e) => setField(`${crKey}.cPhase`, e.target.value)} readOnly={!isEditing} className="report-input text-center" /></td>
        <td><input type="text" value={cr.cGround} onChange={(e) => setField(`${crKey}.cGround`, e.target.value)} readOnly={!isEditing} className="report-input text-center" /></td>
        <td>
          <select value={cr.units} onChange={(e) => setField(`${crKey}.units`, e.target.value)} disabled={!isEditing} className="report-input">
            {CONTACT_RESISTANCE_UNITS.map(u => <option key={u.symbol} value={u.symbol}>{u.symbol}</option>)}
          </select>
        </td>
      </tr>
    );
  };

  return (
    <div className="report-container">
      <div className="report-header-bar">
        <h1 className="report-title">{reportTitle}</h1>
        <div className="report-actions">
          <button
            onClick={() => setField('status', formData.status === 'PASS' ? 'FAIL' : 'PASS')}
            disabled={!isEditing}
            className={`status-btn ${formData.status === 'PASS' ? 'pass' : 'fail'}`}
          >
            {formData.status}
          </button>
          {!isEditing ? (
            <button onClick={() => setIsEditing(true)} className="btn-primary">Edit Report</button>
          ) : (
            <button onClick={handleSave} disabled={saving} className="btn-save">
              {saving ? 'Saving...' : 'Save Report'}
            </button>
          )}
        </div>
      </div>

      {/* Job Information */}
      <section className="report-section">
        <div className="section-divider"></div>
        <h2 className="section-title">Job Information</h2>
        <div className="form-grid-6">
          <div className="form-field"><label>Customer:</label><input value={formData.customer} onChange={(e) => setField('customer', e.target.value)} readOnly={!isEditing} className="report-input" /></div>
          <div className="form-field col-span-2"><label>Address:</label><input value={formData.address} onChange={(e) => setField('address', e.target.value)} readOnly={!isEditing} className="report-input" /></div>
          <div className="form-field"><label>Job #:</label><input value={formData.jobNumber} readOnly className="report-input bg-gray-100" /></div>
          <div className="form-field"><label>Technicians:</label><input value={formData.technicians} onChange={(e) => setField('technicians', e.target.value)} readOnly={!isEditing} className="report-input" /></div>
          <div className="form-field"><label>Date:</label><input type="date" value={formData.date} onChange={(e) => setField('date', e.target.value)} readOnly={!isEditing} className="report-input" /></div>
          <div className="form-field"><label>Identifier:</label><input value={formData.identifier} onChange={(e) => setField('identifier', e.target.value)} readOnly={!isEditing} className="report-input" /></div>
          <div className="form-field temp-field">
            <label>Temp:</label>
            <div className="temp-inputs">
              <input type="number" value={formData.temperature.fahrenheit} onChange={(e) => setField('temperature.fahrenheit', Number(e.target.value))} readOnly={!isEditing} className="report-input temp-input" />
              <span>°F</span>
              <span className="temp-celsius">{formData.temperature.celsius.toFixed(1)}</span>
              <span>°C</span>
              <span className="temp-label">TCF</span>
              <span className="temp-value">{formData.temperature.tcf.toFixed(3)}</span>
            </div>
          </div>
          <div className="form-field">
            <label>Humidity:</label>
            <div className="flex items-center gap-1">
              <input type="number" value={formData.temperature.humidity} onChange={(e) => setField('temperature.humidity', Number(e.target.value))} readOnly={!isEditing} className="report-input" style={{ width: '80px' }} />
              <span>%</span>
            </div>
          </div>
          <div className="form-field"><label>Substation:</label><input value={formData.substation} onChange={(e) => setField('substation', e.target.value)} readOnly={!isEditing} className="report-input" /></div>
          <div className="form-field"><label>Eqpt. Location:</label><input value={formData.eqptLocation} onChange={(e) => setField('eqptLocation', e.target.value)} readOnly={!isEditing} className="report-input" /></div>
        </div>
      </section>

      {/* Nameplate Data */}
      <section className="report-section">
        <div className="section-divider"></div>
        <h2 className="section-title">Nameplate Data</h2>
        <div className="enclosure-grid">
          <div className="enclosure-row">
            <div className="enclosure-cell"><strong>Manufacturer:</strong><input value={formData.nameplate_manufacturer} onChange={(e) => setField('nameplate_manufacturer', e.target.value)} readOnly={!isEditing} className="report-input" /></div>
            <div className="enclosure-cell"><strong>Catalog No.:</strong><input value={formData.nameplate_catalogNo} onChange={(e) => setField('nameplate_catalogNo', e.target.value)} readOnly={!isEditing} className="report-input" /></div>
            <div className="enclosure-cell"><strong>Serial Number:</strong><input value={formData.nameplate_serialNumber} onChange={(e) => setField('nameplate_serialNumber', e.target.value)} readOnly={!isEditing} className="report-input" /></div>
            <div className="enclosure-cell"><strong>Date of Mfg:</strong><input value={formData.nameplate_dateOfMfg} onChange={(e) => setField('nameplate_dateOfMfg', e.target.value)} readOnly={!isEditing} className="report-input" /></div>
          </div>
          <div className="enclosure-row">
            <div className="enclosure-cell"><strong>Type:</strong><input value={formData.nameplate_type} onChange={(e) => setField('nameplate_type', e.target.value)} readOnly={!isEditing} className="report-input" /></div>
            <div className="enclosure-cell"><strong>System Voltage:</strong><input value={formData.nameplate_systemVoltage} onChange={(e) => setField('nameplate_systemVoltage', e.target.value)} readOnly={!isEditing} className="report-input" /></div>
            <div className="enclosure-cell"><strong>Rated Voltage:</strong><input value={formData.nameplate_ratedVoltage} onChange={(e) => setField('nameplate_ratedVoltage', e.target.value)} readOnly={!isEditing} className="report-input" /></div>
            <div className="enclosure-cell"><strong>Rated Current:</strong><input value={formData.nameplate_ratedCurrent} onChange={(e) => setField('nameplate_ratedCurrent', e.target.value)} readOnly={!isEditing} className="report-input" /></div>
          </div>
          <div className="enclosure-row">
            <div className="enclosure-cell"><strong>AIC Rating:</strong><input value={formData.nameplate_aicRating} onChange={(e) => setField('nameplate_aicRating', e.target.value)} readOnly={!isEditing} className="report-input" /></div>
            <div className="enclosure-cell"><strong>Impulse Level (BIL):</strong><input value={formData.nameplate_impulseLevelBIL} onChange={(e) => setField('nameplate_impulseLevelBIL', e.target.value)} readOnly={!isEditing} className="report-input" /></div>
            {variant === 'sf6' ? (
              <div className="enclosure-cell"><strong>SF6 Gas Mass:</strong><input value={formData.nameplate_sf6GasMass || ''} onChange={(e) => setField('nameplate_sf6GasMass', e.target.value)} readOnly={!isEditing} className="report-input" /></div>
            ) : (
              <>
                <div className="enclosure-cell"><strong>Oil Type:</strong><input value={formData.nameplate_oilType || ''} onChange={(e) => setField('nameplate_oilType', e.target.value)} readOnly={!isEditing} className="report-input" /></div>
                <div className="enclosure-cell"><strong>Oil Volume:</strong><input value={formData.nameplate_oilVolume || ''} onChange={(e) => setField('nameplate_oilVolume', e.target.value)} readOnly={!isEditing} className="report-input" /></div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* VFI Data */}
      <section className="report-section">
        <div className="section-divider"></div>
        <h2 className="section-title">VFI Data</h2>
        <div className="enclosure-grid">
          <div className="enclosure-row">
            <div className="enclosure-cell"><strong>Manufacturer:</strong><input value={formData.vfiData.manufacturer} onChange={(e) => setField('vfiData.manufacturer', e.target.value)} readOnly={!isEditing} className="report-input" /></div>
            <div className="enclosure-cell"><strong>Catalog No.:</strong><input value={formData.vfiData.catalogNo} onChange={(e) => setField('vfiData.catalogNo', e.target.value)} readOnly={!isEditing} className="report-input" /></div>
            <div className="enclosure-cell"><strong>Type:</strong><input value={formData.vfiData.type} onChange={(e) => setField('vfiData.type', e.target.value)} readOnly={!isEditing} className="report-input" /></div>
          </div>
          <div className="enclosure-row">
            <div className="enclosure-cell"><strong>Rated Voltage:</strong><input value={formData.vfiData.ratedVoltage} onChange={(e) => setField('vfiData.ratedVoltage', e.target.value)} readOnly={!isEditing} className="report-input" /></div>
            <div className="enclosure-cell"><strong>Rated Current:</strong><input value={formData.vfiData.ratedCurrent} onChange={(e) => setField('vfiData.ratedCurrent', e.target.value)} readOnly={!isEditing} className="report-input" /></div>
            <div className="enclosure-cell"><strong>AIC Rating:</strong><input value={formData.vfiData.aicRating} onChange={(e) => setField('vfiData.aicRating', e.target.value)} readOnly={!isEditing} className="report-input" /></div>
          </div>
        </div>
      </section>

      {/* Visual and Mechanical Inspection */}
      <section className="report-section">
        <div className="section-divider"></div>
        <h2 className="section-title">Visual and Mechanical Inspection</h2>
        <p className="section-subtitle">Per NETA ATS Section 7.1.1</p>
        <div className="table-container">
          <table className="report-table">
            <thead>
              <tr>
                <th style={{ width: '12%' }}>NETA Section</th>
                <th style={{ width: '68%' }}>Description</th>
                <th style={{ width: '20%' }}>Results</th>
              </tr>
            </thead>
            <tbody>
              {formData.visualInspectionResults.map((item, idx) => (
                <tr key={item.netaSection || idx}>
                  <td>{item.netaSection}</td>
                  <td className="text-left">{item.description}</td>
                  <td>
                    <select
                      value={item.result}
                      onChange={(e) => updateVisualInspection(idx, e.target.value)}
                      disabled={!isEditing}
                      className="report-input"
                    >
                      {VISUAL_INSPECTION_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Insulation Resistance */}
      <section className="report-section">
        <div className="section-divider"></div>
        <h2 className="section-title">Electrical Tests - Insulation Resistance</h2>
        <div className="flex items-center gap-4 mb-4">
          <label className="font-medium">Test Voltage:</label>
          <select
            value={formData.s1_insulationResistance.testVoltage}
            onChange={(e) => {
              const v = e.target.value;
              ['s1', 's2', 't1', 't2', 't3'].forEach(ws => {
                setField(`${ws}_insulationResistance.testVoltage`, v);
              });
            }}
            disabled={!isEditing}
            className="report-input"
            style={{ width: '120px' }}
          >
            {TEST_VOLTAGE_OPTIONS.map((v) => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>
        {renderInsulationSection('S1', 's1_insulationResistance', 's1_correctedInsulationResistance')}
        {renderInsulationSection('S2', 's2_insulationResistance', 's2_correctedInsulationResistance')}
        {renderInsulationSection('T1', 't1_insulationResistance', 't1_correctedInsulationResistance')}
        {renderInsulationSection('T2', 't2_insulationResistance', 't2_correctedInsulationResistance')}
        {renderInsulationSection('T3', 't3_insulationResistance', 't3_correctedInsulationResistance')}
      </section>

      {/* Contact Resistance */}
      <section className="report-section">
        <div className="section-divider"></div>
        <h2 className="section-title">Electrical Tests - Contact Resistance</h2>
        <div className="table-container">
          <table className="report-table compact">
            <thead>
              <tr>
                <th>Way Section</th>
                <th>A Phase</th>
                <th>A-G</th>
                <th>B Phase</th>
                <th>B-G</th>
                <th>C Phase</th>
                <th>C-G</th>
                <th>Units</th>
              </tr>
            </thead>
            <tbody>
              {renderContactSection('S1', 's1_contactResistance')}
              {renderContactSection('S2', 's2_contactResistance')}
              {renderContactSection('T1', 't1_contactResistance')}
              {renderContactSection('T2', 't2_contactResistance')}
              {renderContactSection('T3', 't3_contactResistance')}
            </tbody>
          </table>
        </div>
      </section>

      {/* Dielectric Withstand Tests */}
      <section className="report-section">
        <div className="section-divider"></div>
        <h2 className="section-title">Dielectric Withstand Tests - Way Section</h2>
        <div className="table-container">
          <table className="report-table compact">
            <thead>
              <tr>
                <th>Way Section</th>
                <th>Test Voltage</th>
                <th>A-G</th>
                <th>B-G</th>
                <th>C-G</th>
                <th>Units</th>
                <th>Duration (sec)</th>
                <th>Result</th>
              </tr>
            </thead>
            <tbody>
              {formData.dielectricWaySectionTests.map((test, idx) => (
                <tr key={idx}>
                  <td>{test.waySection}</td>
                  <td>
                    <select value={test.testVoltageApplied} onChange={(e) => updateDielectricTest(idx, 'testVoltageApplied', e.target.value)} disabled={!isEditing} className="report-input">
                      {DIELECTRIC_VOLTAGE_OPTIONS.map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </td>
                  <td><input type="text" value={test.ag} onChange={(e) => updateDielectricTest(idx, 'ag', e.target.value)} readOnly={!isEditing} className="report-input text-center" /></td>
                  <td><input type="text" value={test.bg} onChange={(e) => updateDielectricTest(idx, 'bg', e.target.value)} readOnly={!isEditing} className="report-input text-center" /></td>
                  <td><input type="text" value={test.cg} onChange={(e) => updateDielectricTest(idx, 'cg', e.target.value)} readOnly={!isEditing} className="report-input text-center" /></td>
                  <td>
                    <select value={test.units} onChange={(e) => updateDielectricTest(idx, 'units', e.target.value)} disabled={!isEditing} className="report-input">
                      {DIELECTRIC_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </td>
                  <td><input type="number" value={test.duration} onChange={(e) => updateDielectricTest(idx, 'duration', Number(e.target.value))} readOnly={!isEditing} className="report-input text-center" /></td>
                  <td>
                    <select value={test.result} onChange={(e) => updateDielectricTest(idx, 'result', e.target.value)} disabled={!isEditing} className="report-input">
                      <option value="N/A">N/A</option>
                      <option value="PASS">PASS</option>
                      <option value="FAIL">FAIL</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Dielectric VFI Tests */}
      <section className="report-section">
        <div className="section-divider"></div>
        <h2 className="section-title">Dielectric Withstand Tests - VFI</h2>
        <div className="table-container">
          <table className="report-table compact">
            <thead>
              <tr>
                <th>VFI Identifier</th>
                <th>Serial Number</th>
                <th>Counter As Found</th>
                <th>Counter As Left</th>
                <th>Vacuum Integrity A</th>
                <th>Vacuum Integrity B</th>
                <th>Result C</th>
                <th>Units</th>
              </tr>
            </thead>
            <tbody>
              {formData.dielectricVFITests.map((test, idx) => (
                <tr key={idx}>
                  <td><input type="text" value={test.vfiIdentifier} onChange={(e) => updateDielectricVFI(idx, 'vfiIdentifier', e.target.value)} readOnly={!isEditing} className="report-input" /></td>
                  <td><input type="text" value={test.serialNumber} onChange={(e) => updateDielectricVFI(idx, 'serialNumber', e.target.value)} readOnly={!isEditing} className="report-input" /></td>
                  <td><input type="text" value={test.counterAsFound} onChange={(e) => updateDielectricVFI(idx, 'counterAsFound', e.target.value)} readOnly={!isEditing} className="report-input text-center" /></td>
                  <td><input type="text" value={test.counterAsLeft} onChange={(e) => updateDielectricVFI(idx, 'counterAsLeft', e.target.value)} readOnly={!isEditing} className="report-input text-center" /></td>
                  <td><input type="text" value={test.vacuumIntegrityA} onChange={(e) => updateDielectricVFI(idx, 'vacuumIntegrityA', e.target.value)} readOnly={!isEditing} className="report-input text-center" /></td>
                  <td><input type="text" value={test.vacuumIntegrityB} onChange={(e) => updateDielectricVFI(idx, 'vacuumIntegrityB', e.target.value)} readOnly={!isEditing} className="report-input text-center" /></td>
                  <td><input type="text" value={test.resultC} onChange={(e) => updateDielectricVFI(idx, 'resultC', e.target.value)} readOnly={!isEditing} className="report-input text-center" /></td>
                  <td>
                    <select value={test.unitsC} onChange={(e) => updateDielectricVFI(idx, 'unitsC', e.target.value)} disabled={!isEditing} className="report-input">
                      {DIELECTRIC_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Test Equipment Used */}
      <section className="report-section">
        <div className="section-divider"></div>
        <h2 className="section-title">Test Equipment Used</h2>
        <div className="equipment-grid">
          <div className="equipment-row">
            <label>Megohmmeter:</label>
            <input value={formData.testEquipment_megohmmeter_megger} onChange={(e) => setField('testEquipment_megohmmeter_megger', e.target.value)} readOnly={!isEditing} className="report-input" placeholder="Model" />
            <label>Serial #:</label>
            <input value={formData.testEquipment_megohmmeter_serialNo} onChange={(e) => setField('testEquipment_megohmmeter_serialNo', e.target.value)} readOnly={!isEditing} className="report-input" />
            <label>AMP ID:</label>
            <input value={formData.testEquipment_megohmmeter_ampId} onChange={(e) => setField('testEquipment_megohmmeter_ampId', e.target.value)} readOnly={!isEditing} className="report-input" />
          </div>
          <div className="equipment-row">
            <label>Low Resistance Ohmmeter:</label>
            <input value={formData.testEquipment_lowResistance_model} onChange={(e) => setField('testEquipment_lowResistance_model', e.target.value)} readOnly={!isEditing} className="report-input" placeholder="Model" />
            <label>Serial #:</label>
            <input value={formData.testEquipment_lowResistance_serialNo} onChange={(e) => setField('testEquipment_lowResistance_serialNo', e.target.value)} readOnly={!isEditing} className="report-input" />
            <label>AMP ID:</label>
            <input value={formData.testEquipment_lowResistance_ampId} onChange={(e) => setField('testEquipment_lowResistance_ampId', e.target.value)} readOnly={!isEditing} className="report-input" />
          </div>
          <div className="equipment-row">
            <label>Hipot:</label>
            <input value={formData.testEquipment_hipot_model} onChange={(e) => setField('testEquipment_hipot_model', e.target.value)} readOnly={!isEditing} className="report-input" placeholder="Model" />
            <label>Serial #:</label>
            <input value={formData.testEquipment_hipot_serialNo} onChange={(e) => setField('testEquipment_hipot_serialNo', e.target.value)} readOnly={!isEditing} className="report-input" />
            <label>AMP ID:</label>
            <input value={formData.testEquipment_hipot_ampId} onChange={(e) => setField('testEquipment_hipot_ampId', e.target.value)} readOnly={!isEditing} className="report-input" />
          </div>
        </div>
      </section>

      {/* Comments */}
      <section className="report-section">
        <div className="section-divider"></div>
        <h2 className="section-title">Comments</h2>
        <textarea
          className={`report-textarea ${!isEditing ? 'readonly' : ''}`}
          value={formData.comments}
          onChange={(e) => setField('comments', e.target.value)}
          readOnly={!isEditing}
          rows={4}
          placeholder="Enter comments here..."
        />
      </section>
    </div>
  );
}

export default MediumVoltageSwitchReport;
