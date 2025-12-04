/**
 * Potential Transformer ATS Report
 * Desktop offline version - matches web app structure exactly
 */

import { useState, useEffect, useMemo } from 'react';
import { Job } from '../../types';
import './ReportStyles.css';

interface Props {
  job: Job | null;
  reportData: any;
  onSave: (data: any) => void;
  variant?: 'ats' | 'mts';
}

// Interfaces matching web app exactly
interface DeviceData {
  manufacturer: string;
  catalogNo: string;
  serialNumber: string;
  accuracyClass: string;
  manufacturedYear: string;
  voltageRating: string;
  insulationClass: string;
  frequency: string;
}

interface FuseData {
  manufacturer: string;
  catalogNo: string;
  class: string;
  voltageRating: string;
  ampacity: string;
  icRating: string;
}

interface FuseResistance {
  asFound: string;
  asLeft: string;
  units: string;
}

interface InsulationRow {
  windingTested: string;
  testVoltage: string;
  results: string;
  units: string;
}

interface TurnsRatioRow {
  tap: string;
  primaryVoltage: string;
  calculatedRatio: string;
  measuredH1H2: string;
  percentDev: string;
  passFail: string;
}

interface EquipmentInfo {
  model: string;
  serial: string;
  ampId: string;
}

type ResultOption = 'Select One' | 'Satisfactory' | 'Unsatisfactory' | 'Cleaned' | 'See Comments' | 'Not Applicable';

// Visual inspection items matching web app exactly
const INSPECTION_ITEMS = [
  { id: '7.10.2.A.1', description: 'Compare equipment nameplate data with drawings and specifications.' },
  { id: '7.10.2.A.2', description: 'Inspect physical and mechanical condition.' },
  { id: '7.10.2.A.3', description: 'Verify proper connection of transformers with system requirements.' },
  { id: '7.10.2.A.4', description: 'Verify that adequate clearances exist between primary and secondary circuit wiring.' },
  { id: '7.10.2.A.5', description: 'Verify the unit is clean.' },
  { id: '7.10.2.A.6.1', description: 'Use of low-resistance ohmmeter in accordance with Section 7.10.2.B.1.' },
  { id: '7.10.2.A.7', description: 'Verify that all required grounding and connections provide good electrical contact.' },
  { id: '7.10.2.A.8', description: 'Verify correct primary and secondary fuse sizes for voltage transformers.' },
  { id: '7.10.2.A.9', description: 'Verify appropriate lubrication on moving current-carrying parts and on moving and sliding surfaces.' }
];

const RESULT_OPTIONS: ResultOption[] = ['Select One', 'Satisfactory', 'Unsatisfactory', 'Cleaned', 'See Comments', 'Not Applicable'];
const INSULATION_RESISTANCE_UNITS = ['kΩ', 'MΩ', 'GΩ'];
const INSULATION_RESISTANCE_TEST_VOLTAGES = ['250V', '500V', '1000V', '2500V', '5000V'];
const CONTACT_RESISTANCE_UNITS = ['μΩ', 'mΩ', 'Ω'];

// TCF data matching web app
const TCF_DATA: { celsius: number; multiplier: number }[] = [
  { celsius: 10, multiplier: 0.63 }, { celsius: 11, multiplier: 0.666 }, { celsius: 12, multiplier: 0.702 },
  { celsius: 13, multiplier: 0.738 }, { celsius: 14, multiplier: 0.774 }, { celsius: 15, multiplier: 0.81 },
  { celsius: 16, multiplier: 0.848 }, { celsius: 17, multiplier: 0.886 }, { celsius: 18, multiplier: 0.924 },
  { celsius: 19, multiplier: 0.962 }, { celsius: 20, multiplier: 1 }, { celsius: 21, multiplier: 1.05 },
  { celsius: 22, multiplier: 1.1 }, { celsius: 23, multiplier: 1.15 }, { celsius: 24, multiplier: 1.2 },
  { celsius: 25, multiplier: 1.25 }, { celsius: 26, multiplier: 1.316 }, { celsius: 27, multiplier: 1.382 },
  { celsius: 28, multiplier: 1.448 }, { celsius: 29, multiplier: 1.514 }, { celsius: 30, multiplier: 1.58 },
  { celsius: 31, multiplier: 1.664 }, { celsius: 32, multiplier: 1.748 }, { celsius: 33, multiplier: 1.832 },
  { celsius: 34, multiplier: 1.872 }, { celsius: 35, multiplier: 2 }, { celsius: 36, multiplier: 2.1 },
  { celsius: 37, multiplier: 2.2 }, { celsius: 38, multiplier: 2.3 }, { celsius: 39, multiplier: 2.4 },
  { celsius: 40, multiplier: 2.5 }
];

const convertFahrenheitToCelsius = (fahrenheit: number): number => {
  return Math.round((fahrenheit - 32) * 5 / 9);
};

const getTCF = (celsius: number): number => {
  const exactMatch = TCF_DATA.find(data => data.celsius === Math.round(celsius));
  if (exactMatch) return exactMatch.multiplier;
  
  const sortedData = [...TCF_DATA].sort((a, b) => a.celsius - b.celsius);
  if (celsius <= sortedData[0].celsius) return sortedData[0].multiplier;
  if (celsius >= sortedData[sortedData.length - 1].celsius) return sortedData[sortedData.length - 1].multiplier;
  
  for (let i = 0; i < sortedData.length - 1; i++) {
    if (celsius >= sortedData[i].celsius && celsius <= sortedData[i + 1].celsius) {
      const ratio = (celsius - sortedData[i].celsius) / (sortedData[i + 1].celsius - sortedData[i].celsius);
      return sortedData[i].multiplier + ratio * (sortedData[i + 1].multiplier - sortedData[i].multiplier);
    }
  }
  return 1.0;
};

const applyTCF = (reading: string, tcf: number): string => {
  if (!reading || reading.trim() === '') return '';
  const numericValue = parseFloat(reading);
  if (isNaN(numericValue)) return reading;
  const correctedValue = numericValue * tcf;
  return correctedValue >= 100 ? correctedValue.toFixed(1) : correctedValue.toFixed(2);
};

interface FormData {
  customer: string;
  address: string;
  user: string;
  date: string;
  jobNumber: string;
  technicians: string;
  temperature: number;
  humidity: number;
  identifier: string;
  substation: string;
  eqptLocation: string;
  deviceData: DeviceData;
  visualInspection: { [key: string]: string };
  fuseData: FuseData;
  fuseResistance: FuseResistance;
  insulationResistance: { rows: InsulationRow[] };
  insulationCorrected: { rows: InsulationRow[] };
  turnsRatio: { rows: TurnsRatioRow[]; secondaryVoltage: string };
  equipment: { megohmmeter: EquipmentInfo; lowResOhmmeter: EquipmentInfo; ttrTestSet: EquipmentInfo };
  comments: string;
}

// Initial form data matching web app
const getInitialFormData = (job: Job | null, data: any): FormData => {
  // Handle both direct data and nested report_info structure
  const reportInfo = data?.report_info || data || {};
  const deviceData = data?.device_data || data?.deviceData || {};
  const visualInspection = data?.visual_inspection || data?.visualInspection || {};
  const fuseDataIn = data?.fuse_data || data?.fuseData || {};
  const fuseResistance = data?.fuse_resistance || data?.fuseResistance || {};
  const insulationResistance = data?.insulation_resistance || data?.insulationResistance || {};
  const insulationCorrected = data?.insulation_corrected || data?.insulationCorrected || {};
  const turnsRatio = data?.turns_ratio || data?.turnsRatio || {};
  const equipment = data?.equipment_used || data?.equipment || {};

  return {
    customer: job?.customer_name || reportInfo.customer || '',
    address: reportInfo.address || '',
    user: reportInfo.user || '',
    date: reportInfo.date || new Date().toLocaleDateString(),
    jobNumber: job?.job_number || reportInfo.jobNumber || '',
    technicians: reportInfo.technicians || '',
    temperature: reportInfo.temperature ?? 72,
    humidity: reportInfo.humidity ?? 72,
    identifier: reportInfo.identifier || '',
    substation: reportInfo.substation || '',
    eqptLocation: reportInfo.eqptLocation || '',
    
    deviceData: {
      manufacturer: deviceData.manufacturer || '',
      catalogNo: deviceData.catalogNo || '',
      serialNumber: deviceData.serialNumber || '',
      accuracyClass: deviceData.accuracyClass || '',
      manufacturedYear: deviceData.manufacturedYear || '',
      voltageRating: deviceData.voltageRating || '',
      insulationClass: deviceData.insulationClass || '',
      frequency: deviceData.frequency || ''
    },
    
    visualInspection: visualInspection || INSPECTION_ITEMS.reduce((acc, item) => ({ ...acc, [item.id]: 'Select One' }), {}),
    
    fuseData: {
      manufacturer: fuseDataIn.manufacturer || '',
      catalogNo: fuseDataIn.catalogNo || '',
      class: fuseDataIn.class || '',
      voltageRating: fuseDataIn.voltageRating || '',
      ampacity: fuseDataIn.ampacity || '',
      icRating: fuseDataIn.icRating || ''
    },
    
    fuseResistance: {
      asFound: fuseResistance.asFound || '',
      asLeft: fuseResistance.asLeft || '',
      units: fuseResistance.units || 'μΩ'
    },
    
    insulationResistance: {
      rows: Array.isArray(insulationResistance.rows) ? insulationResistance.rows : [
        { windingTested: 'Primary to Ground', testVoltage: '250V', results: '', units: 'kΩ' },
        { windingTested: 'Secondary to Ground', testVoltage: '250V', results: '', units: 'kΩ' },
        { windingTested: 'Primary to Secondary', testVoltage: '250V', results: '', units: 'kΩ' }
      ]
    },
    
    insulationCorrected: {
      rows: Array.isArray(insulationCorrected.rows) ? insulationCorrected.rows : [
        { windingTested: 'Primary to Ground', testVoltage: '250V', results: '', units: 'kΩ' },
        { windingTested: 'Secondary to Ground', testVoltage: '250V', results: '', units: 'kΩ' },
        { windingTested: 'Primary to Secondary', testVoltage: '250V', results: '', units: 'kΩ' }
      ]
    },
    
    turnsRatio: {
      rows: Array.isArray(turnsRatio.rows) ? turnsRatio.rows : [
        { tap: 'N/A', primaryVoltage: '480', calculatedRatio: '4.0', measuredH1H2: '', percentDev: '', passFail: '' }
      ],
      secondaryVoltage: turnsRatio.secondaryVoltage || '120.0'
    },
    
    equipment: {
      megohmmeter: { 
        model: equipment.megohmmeter?.model || '', 
        serial: equipment.megohmmeter?.serial || '', 
        ampId: equipment.megohmmeter?.ampId || '' 
      },
      lowResOhmmeter: { 
        model: equipment.lowResOhmmeter?.model || '', 
        serial: equipment.lowResOhmmeter?.serial || '', 
        ampId: equipment.lowResOhmmeter?.ampId || '' 
      },
      ttrTestSet: { 
        model: equipment.ttrTestSet?.model || '', 
        serial: equipment.ttrTestSet?.serial || '', 
        ampId: equipment.ttrTestSet?.ampId || '' 
      }
    },
    
    comments: data?.comments || ''
  };
};

export function PotentialTransformerReport({ job, reportData, onSave, variant = 'ats' }: Props) {
  const [formData, setFormData] = useState<FormData>(() => getInitialFormData(job, reportData));
  const [status, setStatus] = useState<'PASS' | 'FAIL'>(reportData?.status || 'PASS');
  const [isEditMode, setIsEditMode] = useState(true);

  // Temperature calculations matching web app
  const celsiusTemperature = useMemo(() => convertFahrenheitToCelsius(formData.temperature), [formData.temperature]);
  const tcf = useMemo(() => getTCF(celsiusTemperature), [celsiusTemperature]);

  // Auto-calculate corrected insulation values when measured values or TCF changes
  useEffect(() => {
    const measuredRows = formData.insulationResistance?.rows || [];
    const correctedRows = measuredRows.map(row => ({
      ...row,
      results: applyTCF(row.results, tcf)
    }));
    setFormData(prev => ({
      ...prev,
      insulationCorrected: { rows: correctedRows }
    }));
  }, [formData.insulationResistance?.rows, tcf]);

  // Auto-calculate turns ratio and deviation
  const calculateDeviation = (calculatedRatio: string, measuredH1H2: string): string => {
    if (!calculatedRatio || !measuredH1H2 || calculatedRatio.trim() === '' || measuredH1H2.trim() === '') return '';
    const calculated = parseFloat(calculatedRatio);
    const measured = parseFloat(measuredH1H2);
    if (isNaN(calculated) || isNaN(measured) || calculated === 0) return '';
    const deviation = ((calculated - measured) / calculated) * 100;
    return deviation.toFixed(2);
  };

  const calculatePassFail = (percentDev: string): string => {
    if (!percentDev || percentDev.trim() === '') return '';
    const deviation = parseFloat(percentDev);
    if (isNaN(deviation)) return '';
    return (deviation < 1.2 && deviation > -1.2) ? 'Pass' : 'Fail';
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleDeviceDataChange = (field: keyof DeviceData, value: string) => {
    setFormData(prev => ({
      ...prev,
      deviceData: { ...prev.deviceData, [field]: value }
    }));
  };

  const handleInspectionChange = (itemId: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      visualInspection: { ...prev.visualInspection, [itemId]: value }
    }));
  };

  const handleFuseDataChange = (field: keyof FuseData, value: string) => {
    setFormData(prev => ({
      ...prev,
      fuseData: { ...prev.fuseData, [field]: value }
    }));
  };

  const handleFuseResistanceChange = (field: keyof FuseResistance, value: string) => {
    setFormData(prev => ({
      ...prev,
      fuseResistance: { ...prev.fuseResistance, [field]: value }
    }));
  };

  const handleInsulationChange = (index: number, field: keyof InsulationRow, value: string) => {
    setFormData(prev => {
      const rows = [...(prev.insulationResistance?.rows || [])];
      rows[index] = { ...rows[index], [field]: value };
      return { ...prev, insulationResistance: { rows } };
    });
  };

  const handleTurnsRatioChange = (index: number, field: keyof TurnsRatioRow, value: string) => {
    setFormData(prev => {
      const rows = [...(prev.turnsRatio?.rows || [])];
      const updatedRow = { ...rows[index], [field]: value };
      
      // Auto-calculate deviation and pass/fail
      if (field === 'calculatedRatio' || field === 'measuredH1H2') {
        const deviation = calculateDeviation(updatedRow.calculatedRatio, updatedRow.measuredH1H2);
        updatedRow.percentDev = deviation;
        updatedRow.passFail = calculatePassFail(deviation);
      }
      
      rows[index] = updatedRow;
      return { ...prev, turnsRatio: { ...prev.turnsRatio, rows } };
    });
  };

  const handleEquipmentChange = (equipment: 'megohmmeter' | 'lowResOhmmeter' | 'ttrTestSet', field: keyof EquipmentInfo, value: string) => {
    setFormData(prev => ({
      ...prev,
      equipment: {
        ...prev.equipment,
        [equipment]: { ...prev.equipment[equipment], [field]: value }
      }
    }));
  };

  const handleSave = () => {
    // Build payload matching web app structure exactly
    const payload = {
      status,
      report_info: {
        customer: formData.customer,
        address: formData.address,
        user: formData.user,
        date: formData.date,
        jobNumber: formData.jobNumber,
        technicians: formData.technicians,
        temperature: formData.temperature,
        humidity: formData.humidity,
        identifier: formData.identifier,
        substation: formData.substation,
        eqptLocation: formData.eqptLocation
      },
      device_data: formData.deviceData,
      visual_inspection: formData.visualInspection,
      fuse_data: formData.fuseData,
      fuse_resistance: formData.fuseResistance,
      insulation_resistance: formData.insulationResistance,
      insulation_corrected: formData.insulationCorrected,
      turns_ratio: formData.turnsRatio,
      equipment_used: formData.equipment,
      comments: formData.comments
    };
    onSave(payload);
    setIsEditMode(false);
  };

  const reportTitle = variant === 'mts' 
    ? '13-Voltage Potential Transformer Test MTS'
    : 'Potential Transformer ATS';

  return (
    <div className="report-container">
      {/* Header */}
      <div className="report-header-bar">
        <h1 className="report-title">{reportTitle}</h1>
        <div className="report-actions">
          <button
            onClick={() => setStatus(status === 'PASS' ? 'FAIL' : 'PASS')}
            className={`status-btn ${status === 'PASS' ? 'pass' : 'fail'}`}
          >
            {status}
          </button>
          <button onClick={handleSave} className="save-btn">
            Save Report
          </button>
        </div>
      </div>

      {/* Job Information */}
      <div className="report-section">
        <h2 className="section-title">Job Information</h2>
        <div className="form-grid-2">
          <div className="form-column">
            <div className="form-field">
              <label>Customer:</label>
              <input className="report-input" value={formData.customer} onChange={(e) => handleChange('customer', e.target.value)} readOnly={!isEditMode} />
            </div>
            <div className="form-field">
              <label>Address:</label>
              <input className="report-input" value={formData.address} onChange={(e) => handleChange('address', e.target.value)} readOnly={!isEditMode} />
            </div>
            <div className="form-field">
              <label>User:</label>
              <input className="report-input" value={formData.user} onChange={(e) => handleChange('user', e.target.value)} readOnly={!isEditMode} />
            </div>
            <div className="form-field">
              <label>Date:</label>
              <input className="report-input" value={formData.date} onChange={(e) => handleChange('date', e.target.value)} readOnly={!isEditMode} />
            </div>
            <div className="form-field">
              <label>Identifier:</label>
              <input className="report-input" value={formData.identifier} onChange={(e) => handleChange('identifier', e.target.value)} readOnly={!isEditMode} />
            </div>
          </div>
          <div className="form-column">
            <div className="form-field">
              <label>Job #:</label>
              <input className="report-input" value={formData.jobNumber} onChange={(e) => handleChange('jobNumber', e.target.value)} readOnly={!isEditMode} />
            </div>
            <div className="form-field">
              <label>Technicians:</label>
              <input className="report-input" value={formData.technicians} onChange={(e) => handleChange('technicians', e.target.value)} readOnly={!isEditMode} />
            </div>
            <div className="form-field">
              <label>Substation:</label>
              <input className="report-input" value={formData.substation} onChange={(e) => handleChange('substation', e.target.value)} readOnly={!isEditMode} />
            </div>
            <div className="form-field">
              <label>Eqpt. Location:</label>
              <input className="report-input" value={formData.eqptLocation} onChange={(e) => handleChange('eqptLocation', e.target.value)} readOnly={!isEditMode} />
            </div>
            <div className="form-field temp-field">
              <label>Temp:</label>
              <input type="number" className="report-input temp-input" value={formData.temperature} onChange={(e) => handleChange('temperature', Number(e.target.value))} readOnly={!isEditMode} />
              <span className="temp-unit">°F</span>
              <span className="temp-value">{celsiusTemperature}°C</span>
              <span className="tcf-label">TCF:</span>
              <span className="tcf-value">{tcf.toFixed(3)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Device Data */}
      <div className="report-section">
        <h2 className="section-title">Device Data</h2>
        <div className="form-grid-2">
          <div className="form-column">
            <div className="form-field">
              <label>Manufacturer:</label>
              <input className="report-input" value={formData.deviceData.manufacturer} onChange={(e) => handleDeviceDataChange('manufacturer', e.target.value)} readOnly={!isEditMode} />
            </div>
            <div className="form-field">
              <label>Catalog No:</label>
              <input className="report-input" value={formData.deviceData.catalogNo} onChange={(e) => handleDeviceDataChange('catalogNo', e.target.value)} readOnly={!isEditMode} />
            </div>
            <div className="form-field">
              <label>Serial Number:</label>
              <input className="report-input" value={formData.deviceData.serialNumber} onChange={(e) => handleDeviceDataChange('serialNumber', e.target.value)} readOnly={!isEditMode} />
            </div>
            <div className="form-field">
              <label>Accuracy Class:</label>
              <input className="report-input" value={formData.deviceData.accuracyClass} onChange={(e) => handleDeviceDataChange('accuracyClass', e.target.value)} readOnly={!isEditMode} />
            </div>
          </div>
          <div className="form-column">
            <div className="form-field">
              <label>Manufactured Year:</label>
              <input className="report-input" value={formData.deviceData.manufacturedYear} onChange={(e) => handleDeviceDataChange('manufacturedYear', e.target.value)} readOnly={!isEditMode} />
            </div>
            <div className="form-field">
              <label>Voltage Rating:</label>
              <input className="report-input" value={formData.deviceData.voltageRating} onChange={(e) => handleDeviceDataChange('voltageRating', e.target.value)} readOnly={!isEditMode} />
            </div>
            <div className="form-field">
              <label>Insulation Class:</label>
              <input className="report-input" value={formData.deviceData.insulationClass} onChange={(e) => handleDeviceDataChange('insulationClass', e.target.value)} readOnly={!isEditMode} />
            </div>
            <div className="form-field">
              <label>Frequency:</label>
              <input className="report-input" value={formData.deviceData.frequency} onChange={(e) => handleDeviceDataChange('frequency', e.target.value)} readOnly={!isEditMode} />
            </div>
          </div>
        </div>
      </div>

      {/* Visual and Mechanical Inspection */}
      <div className="report-section">
        <h2 className="section-title">Visual and Mechanical Inspection</h2>
        <div className="table-wrapper">
          <table className="report-table">
            <thead>
              <tr>
                <th style={{ width: '12%' }}>NETA Section</th>
                <th style={{ width: '58%' }}>Description</th>
                <th style={{ width: '15%' }}>Results</th>
                <th style={{ width: '15%' }}>Comments</th>
              </tr>
            </thead>
            <tbody>
              {INSPECTION_ITEMS.map((item) => (
                <tr key={item.id}>
                  <td className="neta-cell">{item.id}</td>
                  <td className="desc-cell">{item.description}</td>
                  <td>
                    <select 
                      value={formData.visualInspection[item.id] || 'Select One'} 
                      onChange={(e) => handleInspectionChange(item.id, e.target.value)} 
                      disabled={!isEditMode} 
                      className="table-select"
                    >
                      {RESULT_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </td>
                  <td>
                    <input 
                      type="text"
                      value={formData.visualInspection[`${item.id}_comments`] || ''} 
                      onChange={(e) => handleInspectionChange(`${item.id}_comments`, e.target.value)} 
                      readOnly={!isEditMode} 
                      className="table-input"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Fuse Data */}
      <div className="report-section">
        <h2 className="section-title">Fuse Data</h2>
        <div className="form-grid-2">
          <div className="form-column">
            <div className="form-field">
              <label>Manufacturer:</label>
              <input className="report-input" value={formData.fuseData.manufacturer} onChange={(e) => handleFuseDataChange('manufacturer', e.target.value)} readOnly={!isEditMode} />
            </div>
            <div className="form-field">
              <label>Catalog No:</label>
              <input className="report-input" value={formData.fuseData.catalogNo} onChange={(e) => handleFuseDataChange('catalogNo', e.target.value)} readOnly={!isEditMode} />
            </div>
            <div className="form-field">
              <label>Class:</label>
              <input className="report-input" value={formData.fuseData.class} onChange={(e) => handleFuseDataChange('class', e.target.value)} readOnly={!isEditMode} />
            </div>
          </div>
          <div className="form-column">
            <div className="form-field">
              <label>Voltage Rating (kV):</label>
              <input className="report-input" value={formData.fuseData.voltageRating} onChange={(e) => handleFuseDataChange('voltageRating', e.target.value)} readOnly={!isEditMode} />
            </div>
            <div className="form-field">
              <label>Ampacity (A):</label>
              <input className="report-input" value={formData.fuseData.ampacity} onChange={(e) => handleFuseDataChange('ampacity', e.target.value)} readOnly={!isEditMode} />
            </div>
            <div className="form-field">
              <label>I.C. Rating (kA):</label>
              <input className="report-input" value={formData.fuseData.icRating} onChange={(e) => handleFuseDataChange('icRating', e.target.value)} readOnly={!isEditMode} />
            </div>
          </div>
        </div>
      </div>

      {/* Electrical Tests */}
      <div className="report-section">
        <h2 className="section-title">Electrical Tests</h2>

        {/* Fuse Resistance */}
        <div className="subsection">
          <div className="table-wrapper">
            <table className="report-table">
              <thead>
                <tr>
                  <th></th>
                  <th>As Found</th>
                  <th>As Left</th>
                  <th>Units</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="label-cell">Fuse Resistance</td>
                  <td><input className="table-input" value={formData.fuseResistance.asFound} onChange={(e) => handleFuseResistanceChange('asFound', e.target.value)} readOnly={!isEditMode} /></td>
                  <td><input className="table-input" value={formData.fuseResistance.asLeft} onChange={(e) => handleFuseResistanceChange('asLeft', e.target.value)} readOnly={!isEditMode} /></td>
                  <td>
                    <select className="table-select" value={formData.fuseResistance.units} onChange={(e) => handleFuseResistanceChange('units', e.target.value)} disabled={!isEditMode}>
                      {CONTACT_RESISTANCE_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Insulation Resistance Tests */}
        <div className="subsection">
          <h3 className="subsection-title">Insulation Resistance</h3>
          <div className="side-by-side-tables">
            {/* Measured Values */}
            <div className="side-by-side-table-container">
              <h4 className="table-label">Measured Values</h4>
              <table className="report-table compact">
                <thead>
                  <tr>
                    <th>Winding Tested</th>
                    <th>Test Voltage</th>
                    <th>Results</th>
                    <th>Units</th>
                  </tr>
                </thead>
                <tbody>
                  {(formData.insulationResistance?.rows || []).map((row, idx) => (
                    <tr key={idx}>
                      <td><input className="table-input" value={row.windingTested} onChange={(e) => handleInsulationChange(idx, 'windingTested', e.target.value)} readOnly={!isEditMode} /></td>
                      <td>
                        <select className="table-select" value={row.testVoltage} onChange={(e) => handleInsulationChange(idx, 'testVoltage', e.target.value)} disabled={!isEditMode}>
                          {INSULATION_RESISTANCE_TEST_VOLTAGES.map(v => <option key={v} value={v}>{v}</option>)}
                        </select>
                      </td>
                      <td><input className="table-input" value={row.results} onChange={(e) => handleInsulationChange(idx, 'results', e.target.value)} readOnly={!isEditMode} /></td>
                      <td>
                        <select className="table-select" value={row.units} onChange={(e) => handleInsulationChange(idx, 'units', e.target.value)} disabled={!isEditMode}>
                          {INSULATION_RESISTANCE_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Temperature Corrected */}
            <div className="side-by-side-table-container">
              <h4 className="table-label">Temperature Corrected (TCF = {tcf.toFixed(3)})</h4>
              <table className="report-table compact corrected-table">
                <thead>
                  <tr>
                    <th>Winding Tested</th>
                    <th>Test Voltage</th>
                    <th>Results</th>
                    <th>Units</th>
                  </tr>
                </thead>
                <tbody>
                  {(formData.insulationCorrected?.rows || []).map((row, idx) => (
                    <tr key={idx} className="corrected-row">
                      <td>{row.windingTested}</td>
                      <td>{row.testVoltage}</td>
                      <td className="result-cell">{row.results}</td>
                      <td>{row.units}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Turns Ratio Test */}
        <div className="subsection">
          <h3 className="subsection-title">Turns Ratio Test</h3>
          <div className="form-field inline-field">
            <label>Secondary Voltage (As Found Tap):</label>
            <input 
              className="report-input short-input"
              value={formData.turnsRatio?.secondaryVoltage || '120.0'} 
              onChange={(e) => setFormData(prev => ({ ...prev, turnsRatio: { ...prev.turnsRatio, secondaryVoltage: e.target.value } }))} 
              readOnly={!isEditMode} 
            />
          </div>
          <div className="table-wrapper">
            <table className="report-table">
              <thead>
                <tr>
                  <th>Tap</th>
                  <th>Primary Voltage</th>
                  <th>Calculated Ratio</th>
                  <th>Measured H1-H2</th>
                  <th>% Deviation</th>
                  <th>Pass/Fail</th>
                </tr>
              </thead>
              <tbody>
                {(formData.turnsRatio?.rows || []).map((row, idx) => (
                  <tr key={idx}>
                    <td><input className="table-input" value={row.tap} onChange={(e) => handleTurnsRatioChange(idx, 'tap', e.target.value)} readOnly={!isEditMode} /></td>
                    <td><input className="table-input" value={row.primaryVoltage} onChange={(e) => handleTurnsRatioChange(idx, 'primaryVoltage', e.target.value)} readOnly={!isEditMode} /></td>
                    <td className="calculated-cell">{row.calculatedRatio}</td>
                    <td><input className="table-input" value={row.measuredH1H2} onChange={(e) => handleTurnsRatioChange(idx, 'measuredH1H2', e.target.value)} readOnly={!isEditMode} /></td>
                    <td className="calculated-cell">{row.percentDev}</td>
                    <td className={`result-status ${row.passFail === 'Pass' ? 'pass' : row.passFail === 'Fail' ? 'fail' : ''}`}>{row.passFail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Test Equipment */}
      <div className="report-section">
        <h2 className="section-title">Test Equipment Used</h2>
        <div className="table-wrapper">
          <table className="report-table">
            <thead>
              <tr>
                <th>Equipment</th>
                <th>Model</th>
                <th>Serial #</th>
                <th>AMP ID</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="label-cell">Megohmmeter</td>
                <td><input className="table-input" value={formData.equipment?.megohmmeter?.model || ''} onChange={(e) => handleEquipmentChange('megohmmeter', 'model', e.target.value)} readOnly={!isEditMode} /></td>
                <td><input className="table-input" value={formData.equipment?.megohmmeter?.serial || ''} onChange={(e) => handleEquipmentChange('megohmmeter', 'serial', e.target.value)} readOnly={!isEditMode} /></td>
                <td><input className="table-input" value={formData.equipment?.megohmmeter?.ampId || ''} onChange={(e) => handleEquipmentChange('megohmmeter', 'ampId', e.target.value)} readOnly={!isEditMode} /></td>
              </tr>
              <tr>
                <td className="label-cell">Low-Resistance Ohmmeter</td>
                <td><input className="table-input" value={formData.equipment?.lowResOhmmeter?.model || ''} onChange={(e) => handleEquipmentChange('lowResOhmmeter', 'model', e.target.value)} readOnly={!isEditMode} /></td>
                <td><input className="table-input" value={formData.equipment?.lowResOhmmeter?.serial || ''} onChange={(e) => handleEquipmentChange('lowResOhmmeter', 'serial', e.target.value)} readOnly={!isEditMode} /></td>
                <td><input className="table-input" value={formData.equipment?.lowResOhmmeter?.ampId || ''} onChange={(e) => handleEquipmentChange('lowResOhmmeter', 'ampId', e.target.value)} readOnly={!isEditMode} /></td>
              </tr>
              <tr>
                <td className="label-cell">TTR Test Set</td>
                <td><input className="table-input" value={formData.equipment?.ttrTestSet?.model || ''} onChange={(e) => handleEquipmentChange('ttrTestSet', 'model', e.target.value)} readOnly={!isEditMode} /></td>
                <td><input className="table-input" value={formData.equipment?.ttrTestSet?.serial || ''} onChange={(e) => handleEquipmentChange('ttrTestSet', 'serial', e.target.value)} readOnly={!isEditMode} /></td>
                <td><input className="table-input" value={formData.equipment?.ttrTestSet?.ampId || ''} onChange={(e) => handleEquipmentChange('ttrTestSet', 'ampId', e.target.value)} readOnly={!isEditMode} /></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Comments */}
      <div className="report-section">
        <h2 className="section-title">Comments</h2>
        <textarea
          className="comments-textarea"
          value={formData.comments}
          onChange={(e) => handleChange('comments', e.target.value)}
          readOnly={!isEditMode}
          rows={4}
        />
      </div>
    </div>
  );
}

export default PotentialTransformerReport;
