/**
 * Automatic Transfer Switch ATS Report - Desktop Version
 * Matches web app: AutomaticTransferSwitchATSReport.tsx
 */

import React, { useState, useEffect } from 'react';
import {
  getTCF, fahrenheitToCelsius, multiplyByTCF,
  VISUAL_INSPECTION_OPTIONS, IR_UNITS, CONTACT_RESISTANCE_UNITS
} from './BaseReport';

// Alias for consistency
const INSULATION_RESISTANCE_UNITS = IR_UNITS;
import './ReportStyles.css';

interface AutomaticTransferSwitchReportProps {
  job: any;
  reportData: any;
  onSave: (data: any) => void;
}

// Match web app's visual inspection items - NETA ATS 7.22.3
const DEFAULT_VISUAL_INSPECTION_ITEMS = [
  { netaSection: '7.22.3.A.1', description: 'Compare equipment nameplate data with drawings and specifications.', result: 'Select One' },
  { netaSection: '7.22.3.A.2', description: 'Inspect physical and mechanical condition.', result: 'Select One' },
  { netaSection: '7.22.3.A.3', description: 'Inspect anchorage, alignment, grounding, and required clearances.', result: 'Select One' },
  { netaSection: '7.22.3.A.4', description: 'Verify the unit is clean.', result: 'Select One' },
  { netaSection: '7.22.3.A.5', description: 'Verify appropriate lubrication on moving current-carrying parts and on moving and sliding surfaces.', result: 'Select One' },
  { netaSection: '7.22.3.A.6', description: 'Verify that manual transfer warnings are attached and visible.', result: 'Select One' },
  { netaSection: '7.22.3.A.7', description: 'Verify tightness of all control connections.', result: 'Select One' },
  { netaSection: '7.22.3.A.8.1', description: 'Use of low-resistance ohmmeter in accordance with Section 7.22.3.B.1.', result: 'Select One' },
  { netaSection: '7.22.3.A.9', description: 'Perform manual transfer operation.', result: 'Select One' },
  { netaSection: '7.22.3.A.10', description: 'Verify positive mechanical interlocking between normal and alternate sources.', result: 'Select One' },
];

const TEST_VOLTAGE_OPTIONS = ['Select', '250V', '500V', '1000V', '2500V', '5000V', 'Other'];

interface InsulationResistanceRow {
  p1Reading: string;
  p1Corrected: string;
  p2Reading: string;
  p2Corrected: string;
  p3Reading: string;
  p3Corrected: string;
  neutralReading: string;
  neutralCorrected: string;
  units: string;
}

interface FormData {
  // Job Information
  customerName: string;
  customerLocation: string;
  userName: string;
  date: string;
  identifier: string;
  jobNumber: string;
  technicians: string;
  temperature: {
    fahrenheit: number;
    celsius: number;
    tcf: number;
    humidity: number;
  };
  substation: string;
  eqptLocation: string;

  // Nameplate Data
  nameplateManufacturer: string;
  nameplateModelType: string;
  nameplateCatalogNo: string;
  nameplateSerialNumber: string;
  nameplateSystemVoltage: string;
  nameplateRatedVoltage: string;
  nameplateRatedCurrent: string;
  nameplateSCCR: string;

  // Visual and Mechanical Inspection
  visualInspectionItems: Array<{ netaSection: string; description: string; result: string; }>;

  // Electrical Tests
  insulationTestVoltage: string;
  insulationResistance: {
    poleToPoleNormalClosed: InsulationResistanceRow;
    poleToPoleEmergencyClosed: InsulationResistanceRow;
    poleToNeutralNormalClosed: InsulationResistanceRow;
    poleToNeutralEmergencyClosed: InsulationResistanceRow;
    poleToGroundNormalClosed: InsulationResistanceRow;
    poleToGroundEmergencyClosed: InsulationResistanceRow;
    lineToLoadNormalOpen: InsulationResistanceRow;
    lineToLoadEmergencyOpen: InsulationResistanceRow;
  };

  contactResistance: {
    normal: { p1: string; p2: string; p3: string; neutral: string; units: string; };
    emergency: { p1: string; p2: string; p3: string; neutral: string; units: string; };
  };

  // Test Equipment Used
  testEquipmentUsed: {
    megohmmeter: { name: string; serialNumber: string; ampId: string; };
    lowResistanceOhmmeter: { name: string; serialNumber: string; ampId: string; };
  };

  comments: string;
  status: 'PASS' | 'FAIL';
}

const createDefaultInsulationRow = (): InsulationResistanceRow => ({
  p1Reading: '', p1Corrected: '',
  p2Reading: '', p2Corrected: '',
  p3Reading: '', p3Corrected: '',
  neutralReading: '', neutralCorrected: '',
  units: 'MΩ',
});

const createDefaultFormData = (): FormData => ({
  customerName: '',
  customerLocation: '',
  userName: '',
  date: new Date().toISOString().split('T')[0],
  identifier: '',
  jobNumber: '',
  technicians: '',
  temperature: { fahrenheit: 68, celsius: 20, tcf: 1, humidity: 50 },
  substation: '',
  eqptLocation: '',
  
  // Nameplate
  nameplateManufacturer: '',
  nameplateModelType: '',
  nameplateCatalogNo: '',
  nameplateSerialNumber: '',
  nameplateSystemVoltage: '',
  nameplateRatedVoltage: '',
  nameplateRatedCurrent: '',
  nameplateSCCR: '',
  
  // Visual Inspection
  visualInspectionItems: JSON.parse(JSON.stringify(DEFAULT_VISUAL_INSPECTION_ITEMS)),
  
  // Insulation Resistance
  insulationTestVoltage: '1000V',
  insulationResistance: {
    poleToPoleNormalClosed: createDefaultInsulationRow(),
    poleToPoleEmergencyClosed: createDefaultInsulationRow(),
    poleToNeutralNormalClosed: createDefaultInsulationRow(),
    poleToNeutralEmergencyClosed: createDefaultInsulationRow(),
    poleToGroundNormalClosed: createDefaultInsulationRow(),
    poleToGroundEmergencyClosed: createDefaultInsulationRow(),
    lineToLoadNormalOpen: createDefaultInsulationRow(),
    lineToLoadEmergencyOpen: createDefaultInsulationRow(),
  },
  
  // Contact Resistance
  contactResistance: {
    normal: { p1: '', p2: '', p3: '', neutral: '', units: 'µΩ' },
    emergency: { p1: '', p2: '', p3: '', neutral: '', units: 'µΩ' },
  },
  
  // Test Equipment
  testEquipmentUsed: {
    megohmmeter: { name: '', serialNumber: '', ampId: '' },
    lowResistanceOhmmeter: { name: '', serialNumber: '', ampId: '' },
  },
  
  comments: '',
  status: 'PASS',
});

const AutomaticTransferSwitchReport: React.FC<AutomaticTransferSwitchReportProps> = ({ job, reportData, onSave }) => {
  const [formData, setFormData] = useState<FormData>(createDefaultFormData());
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Parse incoming report data with flexible mapping
  const parseReportData = (data: any): Partial<FormData> => {
    if (!data) return {};
    
    // Handle nested structures from Supabase
    const reportInfo = data.report_info || data.reportInfo || {};
    const visualItems = data.visual_inspection_items || data.visualInspectionItems || reportInfo.visualInspectionItems;
    const insulationData = data.insulation_resistance || data.insulationResistance || reportInfo.insulationResistance;
    const contactData = data.contact_resistance || data.contactResistance || reportInfo.contactResistance;
    const testEquip = data.test_equipment_used || data.testEquipmentUsed || reportInfo.testEquipmentUsed;
    
    // Merge all possible sources
    const merged = { ...reportInfo, ...data };
    
    const result: Partial<FormData> = {
      customerName: merged.customerName || merged.customer || '',
      customerLocation: merged.customerLocation || merged.address || '',
      userName: merged.userName || merged.user || '',
      date: merged.date || new Date().toISOString().split('T')[0],
      identifier: merged.identifier || '',
      jobNumber: merged.jobNumber || merged.job_number || '',
      technicians: merged.technicians || '',
      substation: merged.substation || '',
      eqptLocation: merged.eqptLocation || merged.eqpt_location || '',
      
      // Nameplate - handle both naming conventions
      nameplateManufacturer: merged.nameplateManufacturer || merged.manufacturer || '',
      nameplateModelType: merged.nameplateModelType || merged.modelType || merged.model_type || '',
      nameplateCatalogNo: merged.nameplateCatalogNo || merged.catalogNo || merged.catalog_no || '',
      nameplateSerialNumber: merged.nameplateSerialNumber || merged.serialNumber || merged.serial_number || '',
      nameplateSystemVoltage: merged.nameplateSystemVoltage || merged.systemVoltage || merged.system_voltage || '',
      nameplateRatedVoltage: merged.nameplateRatedVoltage || merged.ratedVoltage || merged.rated_voltage || '',
      nameplateRatedCurrent: merged.nameplateRatedCurrent || merged.ratedCurrent || merged.rated_current || '',
      nameplateSCCR: merged.nameplateSCCR || merged.sccr || '',
      
      insulationTestVoltage: merged.insulationTestVoltage || merged.insulation_test_voltage || '1000V',
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
    
    // Visual inspection items
    if (visualItems && Array.isArray(visualItems) && visualItems.length > 0) {
      result.visualInspectionItems = visualItems.map((item: any) => ({
        netaSection: item.netaSection || item.neta_section || item.id || '',
        description: item.description || '',
        result: item.result || 'Select One',
      }));
    }
    
    // Insulation resistance
    if (insulationData) {
      const parseRow = (row: any): InsulationResistanceRow => ({
        p1Reading: row?.p1Reading || row?.p1_reading || '',
        p1Corrected: row?.p1Corrected || row?.p1_corrected || '',
        p2Reading: row?.p2Reading || row?.p2_reading || '',
        p2Corrected: row?.p2Corrected || row?.p2_corrected || '',
        p3Reading: row?.p3Reading || row?.p3_reading || '',
        p3Corrected: row?.p3Corrected || row?.p3_corrected || '',
        neutralReading: row?.neutralReading || row?.neutral_reading || '',
        neutralCorrected: row?.neutralCorrected || row?.neutral_corrected || '',
        units: row?.units || 'MΩ',
      });
      
      result.insulationResistance = {
        poleToPoleNormalClosed: parseRow(insulationData.poleToPoleNormalClosed || insulationData.pole_to_pole_normal_closed),
        poleToPoleEmergencyClosed: parseRow(insulationData.poleToPoleEmergencyClosed || insulationData.pole_to_pole_emergency_closed),
        poleToNeutralNormalClosed: parseRow(insulationData.poleToNeutralNormalClosed || insulationData.pole_to_neutral_normal_closed),
        poleToNeutralEmergencyClosed: parseRow(insulationData.poleToNeutralEmergencyClosed || insulationData.pole_to_neutral_emergency_closed),
        poleToGroundNormalClosed: parseRow(insulationData.poleToGroundNormalClosed || insulationData.pole_to_ground_normal_closed),
        poleToGroundEmergencyClosed: parseRow(insulationData.poleToGroundEmergencyClosed || insulationData.pole_to_ground_emergency_closed),
        lineToLoadNormalOpen: parseRow(insulationData.lineToLoadNormalOpen || insulationData.line_to_load_normal_open),
        lineToLoadEmergencyOpen: parseRow(insulationData.lineToLoadEmergencyOpen || insulationData.line_to_load_emergency_open),
      };
    }
    
    // Contact resistance
    if (contactData) {
      result.contactResistance = {
        normal: {
          p1: contactData.normal?.p1 || '',
          p2: contactData.normal?.p2 || '',
          p3: contactData.normal?.p3 || '',
          neutral: contactData.normal?.neutral || '',
          units: contactData.normal?.units || 'µΩ',
        },
        emergency: {
          p1: contactData.emergency?.p1 || '',
          p2: contactData.emergency?.p2 || '',
          p3: contactData.emergency?.p3 || '',
          neutral: contactData.emergency?.neutral || '',
          units: contactData.emergency?.units || 'µΩ',
        },
      };
    }
    
    // Test equipment
    if (testEquip) {
      result.testEquipmentUsed = {
        megohmmeter: {
          name: testEquip.megohmmeter?.name || '',
          serialNumber: testEquip.megohmmeter?.serialNumber || testEquip.megohmmeter?.serial_number || '',
          ampId: testEquip.megohmmeter?.ampId || testEquip.megohmmeter?.amp_id || '',
        },
        lowResistanceOhmmeter: {
          name: testEquip.lowResistanceOhmmeter?.name || '',
          serialNumber: testEquip.lowResistanceOhmmeter?.serialNumber || testEquip.lowResistanceOhmmeter?.serial_number || '',
          ampId: testEquip.lowResistanceOhmmeter?.ampId || testEquip.lowResistanceOhmmeter?.amp_id || '',
        },
      };
    }
    
    return result;
  };

  useEffect(() => {
    if (reportData) {
      const parsed = parseReportData(reportData);
      const merged = { ...createDefaultFormData(), ...parsed };
      if (!merged.visualInspectionItems?.length) {
        merged.visualInspectionItems = JSON.parse(JSON.stringify(DEFAULT_VISUAL_INSPECTION_ITEMS));
      }
      setFormData(merged);
    }
  }, [reportData]);

  useEffect(() => {
    if (job) {
      setFormData((prev) => ({
        ...prev,
        jobNumber: job.job_number || prev.jobNumber,
        customerName: job.customer_name || prev.customerName,
        customerLocation: job.site_address || prev.customerLocation,
      }));
    }
  }, [job]);

  // Recalculate celsius and TCF when fahrenheit changes
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

  // Recalculate corrected insulation resistance values when readings or TCF change
  useEffect(() => {
    const tcf = formData.temperature?.tcf || 1;
    const ir = formData.insulationResistance;
    
    const calcCorrected = (row: InsulationResistanceRow): InsulationResistanceRow => ({
      ...row,
      p1Corrected: multiplyByTCF(row.p1Reading, tcf),
      p2Corrected: multiplyByTCF(row.p2Reading, tcf),
      p3Corrected: multiplyByTCF(row.p3Reading, tcf),
      neutralCorrected: multiplyByTCF(row.neutralReading, tcf),
    });
    
    setFormData((prev) => ({
      ...prev,
      insulationResistance: {
        poleToPoleNormalClosed: calcCorrected(ir.poleToPoleNormalClosed),
        poleToPoleEmergencyClosed: calcCorrected(ir.poleToPoleEmergencyClosed),
        poleToNeutralNormalClosed: calcCorrected(ir.poleToNeutralNormalClosed),
        poleToNeutralEmergencyClosed: calcCorrected(ir.poleToNeutralEmergencyClosed),
        poleToGroundNormalClosed: calcCorrected(ir.poleToGroundNormalClosed),
        poleToGroundEmergencyClosed: calcCorrected(ir.poleToGroundEmergencyClosed),
        lineToLoadNormalOpen: calcCorrected(ir.lineToLoadNormalOpen),
        lineToLoadEmergencyOpen: calcCorrected(ir.lineToLoadEmergencyOpen),
      },
    }));
  }, [
    formData.insulationResistance.poleToPoleNormalClosed.p1Reading,
    formData.insulationResistance.poleToPoleNormalClosed.p2Reading,
    formData.insulationResistance.poleToPoleNormalClosed.p3Reading,
    formData.insulationResistance.poleToPoleNormalClosed.neutralReading,
    formData.insulationResistance.poleToPoleEmergencyClosed.p1Reading,
    formData.insulationResistance.poleToPoleEmergencyClosed.p2Reading,
    formData.insulationResistance.poleToPoleEmergencyClosed.p3Reading,
    formData.insulationResistance.poleToPoleEmergencyClosed.neutralReading,
    formData.insulationResistance.poleToNeutralNormalClosed.p1Reading,
    formData.insulationResistance.poleToNeutralNormalClosed.p2Reading,
    formData.insulationResistance.poleToNeutralNormalClosed.p3Reading,
    formData.insulationResistance.poleToNeutralNormalClosed.neutralReading,
    formData.insulationResistance.poleToNeutralEmergencyClosed.p1Reading,
    formData.insulationResistance.poleToNeutralEmergencyClosed.p2Reading,
    formData.insulationResistance.poleToNeutralEmergencyClosed.p3Reading,
    formData.insulationResistance.poleToNeutralEmergencyClosed.neutralReading,
    formData.insulationResistance.poleToGroundNormalClosed.p1Reading,
    formData.insulationResistance.poleToGroundNormalClosed.p2Reading,
    formData.insulationResistance.poleToGroundNormalClosed.p3Reading,
    formData.insulationResistance.poleToGroundNormalClosed.neutralReading,
    formData.insulationResistance.poleToGroundEmergencyClosed.p1Reading,
    formData.insulationResistance.poleToGroundEmergencyClosed.p2Reading,
    formData.insulationResistance.poleToGroundEmergencyClosed.p3Reading,
    formData.insulationResistance.poleToGroundEmergencyClosed.neutralReading,
    formData.insulationResistance.lineToLoadNormalOpen.p1Reading,
    formData.insulationResistance.lineToLoadNormalOpen.p2Reading,
    formData.insulationResistance.lineToLoadNormalOpen.p3Reading,
    formData.insulationResistance.lineToLoadNormalOpen.neutralReading,
    formData.insulationResistance.lineToLoadEmergencyOpen.p1Reading,
    formData.insulationResistance.lineToLoadEmergencyOpen.p2Reading,
    formData.insulationResistance.lineToLoadEmergencyOpen.p3Reading,
    formData.insulationResistance.lineToLoadEmergencyOpen.neutralReading,
    formData.temperature?.tcf,
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
      // Build payload matching web app structure
      const reportPayload = {
        report_info: {
          customerName: formData.customerName,
          customerLocation: formData.customerLocation,
          userName: formData.userName,
          date: formData.date,
          identifier: formData.identifier,
          jobNumber: formData.jobNumber,
          technicians: formData.technicians,
          temperature: formData.temperature,
          substation: formData.substation,
          eqptLocation: formData.eqptLocation,
          nameplateManufacturer: formData.nameplateManufacturer,
          nameplateModelType: formData.nameplateModelType,
          nameplateCatalogNo: formData.nameplateCatalogNo,
          nameplateSerialNumber: formData.nameplateSerialNumber,
          nameplateSystemVoltage: formData.nameplateSystemVoltage,
          nameplateRatedVoltage: formData.nameplateRatedVoltage,
          nameplateRatedCurrent: formData.nameplateRatedCurrent,
          nameplateSCCR: formData.nameplateSCCR,
          testEquipmentUsed: formData.testEquipmentUsed,
          status: formData.status,
        },
        visual_inspection_items: formData.visualInspectionItems,
        insulation_resistance: formData.insulationResistance,
        contact_resistance: formData.contactResistance,
        comments: formData.comments,
        // Also include full data blob for compatibility
        data: { ...formData },
      };
      
      await onSave(reportPayload);
      setIsEditing(false);
    } catch (error) {
      console.error('Save failed:', error);
      alert('Failed to save report');
    } finally {
      setSaving(false);
    }
  };

  const updateVisualInspection = (index: number, field: string, value: string) => {
    const items = [...formData.visualInspectionItems];
    items[index] = { ...items[index], [field]: value };
    setFormData((prev) => ({ ...prev, visualInspectionItems: items }));
  };

  const updateInsulationRow = (rowKey: keyof FormData['insulationResistance'], field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      insulationResistance: {
        ...prev.insulationResistance,
        [rowKey]: {
          ...prev.insulationResistance[rowKey],
          [field]: value,
        },
      },
    }));
  };

  const renderInsulationRow = (rowKey: keyof FormData['insulationResistance'], title: string, hasNeutral: boolean = true) => {
    const row = formData.insulationResistance[rowKey];
    return (
      <tr key={rowKey}>
        <td className="text-left">{title}</td>
        <td><input type="text" value={row.p1Reading} onChange={(e) => updateInsulationRow(rowKey, 'p1Reading', e.target.value)} readOnly={!isEditing} className="report-input text-center" /></td>
        <td><input type="text" value={row.p1Corrected} readOnly className="report-input text-center bg-gray-100" /></td>
        <td><input type="text" value={row.p2Reading} onChange={(e) => updateInsulationRow(rowKey, 'p2Reading', e.target.value)} readOnly={!isEditing} className="report-input text-center" /></td>
        <td><input type="text" value={row.p2Corrected} readOnly className="report-input text-center bg-gray-100" /></td>
        <td><input type="text" value={row.p3Reading} onChange={(e) => updateInsulationRow(rowKey, 'p3Reading', e.target.value)} readOnly={!isEditing} className="report-input text-center" /></td>
        <td><input type="text" value={row.p3Corrected} readOnly className="report-input text-center bg-gray-100" /></td>
        {hasNeutral ? (
          <>
            <td><input type="text" value={row.neutralReading} onChange={(e) => updateInsulationRow(rowKey, 'neutralReading', e.target.value)} readOnly={!isEditing} className="report-input text-center" /></td>
            <td><input type="text" value={row.neutralCorrected} readOnly className="report-input text-center bg-gray-100" /></td>
          </>
        ) : (
          <>
            <td className="bg-gray-50"></td>
            <td className="bg-gray-50"></td>
          </>
        )}
        <td>
          <select value={row.units} onChange={(e) => updateInsulationRow(rowKey, 'units', e.target.value)} disabled={!isEditing} className="report-input">
            {INSULATION_RESISTANCE_UNITS.map(u => <option key={u.symbol} value={u.symbol}>{u.symbol}</option>)}
          </select>
        </td>
      </tr>
    );
  };

  return (
    <div className="report-container">
      <div className="report-header-bar">
        <h1 className="report-title">Automatic Transfer Switch ATS Report</h1>
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
          <div className="form-field"><label>Customer:</label><input value={formData.customerName} onChange={(e) => setField('customerName', e.target.value)} readOnly={!isEditing} className="report-input" /></div>
          <div className="form-field col-span-2"><label>Address:</label><input value={formData.customerLocation} onChange={(e) => setField('customerLocation', e.target.value)} readOnly={!isEditing} className="report-input" /></div>
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
          <div className="form-field"><label>User:</label><input value={formData.userName} onChange={(e) => setField('userName', e.target.value)} readOnly={!isEditing} className="report-input" /></div>
        </div>
      </section>

      {/* Nameplate Data */}
      <section className="report-section">
        <div className="section-divider"></div>
        <h2 className="section-title">Nameplate Data</h2>
        <div className="enclosure-grid">
          <div className="enclosure-row">
            <div className="enclosure-cell"><strong>Manufacturer:</strong><input value={formData.nameplateManufacturer} onChange={(e) => setField('nameplateManufacturer', e.target.value)} readOnly={!isEditing} className="report-input" /></div>
            <div className="enclosure-cell"><strong>Model / Type:</strong><input value={formData.nameplateModelType} onChange={(e) => setField('nameplateModelType', e.target.value)} readOnly={!isEditing} className="report-input" /></div>
            <div className="enclosure-cell"><strong>Catalog No.:</strong><input value={formData.nameplateCatalogNo} onChange={(e) => setField('nameplateCatalogNo', e.target.value)} readOnly={!isEditing} className="report-input" /></div>
            <div className="enclosure-cell"><strong>Serial Number:</strong><input value={formData.nameplateSerialNumber} onChange={(e) => setField('nameplateSerialNumber', e.target.value)} readOnly={!isEditing} className="report-input" /></div>
          </div>
          <div className="enclosure-row">
            <div className="enclosure-cell"><strong>System Voltage (V):</strong><input value={formData.nameplateSystemVoltage} onChange={(e) => setField('nameplateSystemVoltage', e.target.value)} readOnly={!isEditing} className="report-input" /></div>
            <div className="enclosure-cell"><strong>Rated Voltage (V):</strong><input value={formData.nameplateRatedVoltage} onChange={(e) => setField('nameplateRatedVoltage', e.target.value)} readOnly={!isEditing} className="report-input" /></div>
            <div className="enclosure-cell"><strong>Rated Current (A):</strong><input value={formData.nameplateRatedCurrent} onChange={(e) => setField('nameplateRatedCurrent', e.target.value)} readOnly={!isEditing} className="report-input" /></div>
            <div className="enclosure-cell"><strong>SCCR (kA):</strong><input value={formData.nameplateSCCR} onChange={(e) => setField('nameplateSCCR', e.target.value)} readOnly={!isEditing} className="report-input" /></div>
          </div>
        </div>
      </section>

      {/* Visual and Mechanical Inspection */}
      <section className="report-section">
        <div className="section-divider"></div>
        <h2 className="section-title">Visual and Mechanical Inspection</h2>
        <p className="section-subtitle">Per NETA ATS Section 7.22.3</p>
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
              {formData.visualInspectionItems.map((item, idx) => (
                <tr key={item.netaSection || idx}>
                  <td>{item.netaSection}</td>
                  <td className="text-left">{item.description}</td>
                  <td>
                    <select
                      value={item.result}
                      onChange={(e) => updateVisualInspection(idx, 'result', e.target.value)}
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

      {/* Electrical Tests - Insulation Resistance */}
      <section className="report-section">
        <div className="section-divider"></div>
        <h2 className="section-title">Electrical Tests - Insulation Resistance</h2>
        <div className="flex items-center gap-4 mb-4">
          <label className="font-medium">Test Voltage:</label>
          <select
            value={formData.insulationTestVoltage}
            onChange={(e) => setField('insulationTestVoltage', e.target.value)}
            disabled={!isEditing}
            className="report-input"
            style={{ width: '120px' }}
          >
            {TEST_VOLTAGE_OPTIONS.map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </div>
        <div className="table-container">
          <table className="report-table">
            <thead>
              <tr>
                <th rowSpan={2}>Test Points</th>
                <th colSpan={2}>P1</th>
                <th colSpan={2}>P2</th>
                <th colSpan={2}>P3</th>
                <th colSpan={2}>Neutral</th>
                <th rowSpan={2}>Units</th>
              </tr>
              <tr>
                <th>Reading</th>
                <th>@20°C</th>
                <th>Reading</th>
                <th>@20°C</th>
                <th>Reading</th>
                <th>@20°C</th>
                <th>Reading</th>
                <th>@20°C</th>
              </tr>
            </thead>
            <tbody>
              {renderInsulationRow('poleToPoleNormalClosed', 'Pole to Pole (Normal Closed)', true)}
              {renderInsulationRow('poleToPoleEmergencyClosed', 'Pole to Pole (Emergency Closed)', true)}
              {renderInsulationRow('poleToNeutralNormalClosed', 'Pole to Neutral (Normal Closed)', true)}
              {renderInsulationRow('poleToNeutralEmergencyClosed', 'Pole to Neutral (Emergency Closed)', true)}
              {renderInsulationRow('poleToGroundNormalClosed', 'Pole to Ground (Normal Closed)', true)}
              {renderInsulationRow('poleToGroundEmergencyClosed', 'Pole to Ground (Emergency Closed)', true)}
              {renderInsulationRow('lineToLoadNormalOpen', 'Line to Load (Normal Open)', true)}
              {renderInsulationRow('lineToLoadEmergencyOpen', 'Line to Load (Emergency Open)', true)}
            </tbody>
          </table>
        </div>
      </section>

      {/* Electrical Tests - Contact/Pole Resistance */}
      <section className="report-section">
        <div className="section-divider"></div>
        <h2 className="section-title">Electrical Tests - Contact/Pole Resistance</h2>
        <div className="table-container">
          <table className="report-table">
            <thead>
              <tr>
                <th>State</th>
                <th>P1</th>
                <th>P2</th>
                <th>P3</th>
                <th>Neutral</th>
                <th>Units</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Normal</td>
                <td><input type="text" value={formData.contactResistance.normal.p1} onChange={(e) => setField('contactResistance.normal.p1', e.target.value)} readOnly={!isEditing} className="report-input text-center" /></td>
                <td><input type="text" value={formData.contactResistance.normal.p2} onChange={(e) => setField('contactResistance.normal.p2', e.target.value)} readOnly={!isEditing} className="report-input text-center" /></td>
                <td><input type="text" value={formData.contactResistance.normal.p3} onChange={(e) => setField('contactResistance.normal.p3', e.target.value)} readOnly={!isEditing} className="report-input text-center" /></td>
                <td><input type="text" value={formData.contactResistance.normal.neutral} onChange={(e) => setField('contactResistance.normal.neutral', e.target.value)} readOnly={!isEditing} className="report-input text-center" /></td>
                <td>
                  <select value={formData.contactResistance.normal.units} onChange={(e) => setField('contactResistance.normal.units', e.target.value)} disabled={!isEditing} className="report-input">
                    {CONTACT_RESISTANCE_UNITS.map((u) => <option key={u.symbol} value={u.symbol}>{u.symbol}</option>)}
                  </select>
                </td>
              </tr>
              <tr>
                <td>Emergency</td>
                <td><input type="text" value={formData.contactResistance.emergency.p1} onChange={(e) => setField('contactResistance.emergency.p1', e.target.value)} readOnly={!isEditing} className="report-input text-center" /></td>
                <td><input type="text" value={formData.contactResistance.emergency.p2} onChange={(e) => setField('contactResistance.emergency.p2', e.target.value)} readOnly={!isEditing} className="report-input text-center" /></td>
                <td><input type="text" value={formData.contactResistance.emergency.p3} onChange={(e) => setField('contactResistance.emergency.p3', e.target.value)} readOnly={!isEditing} className="report-input text-center" /></td>
                <td><input type="text" value={formData.contactResistance.emergency.neutral} onChange={(e) => setField('contactResistance.emergency.neutral', e.target.value)} readOnly={!isEditing} className="report-input text-center" /></td>
                <td>
                  <select value={formData.contactResistance.emergency.units} onChange={(e) => setField('contactResistance.emergency.units', e.target.value)} disabled={!isEditing} className="report-input">
                    {CONTACT_RESISTANCE_UNITS.map((u) => <option key={u.symbol} value={u.symbol}>{u.symbol}</option>)}
                  </select>
                </td>
              </tr>
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
            <input value={formData.testEquipmentUsed.megohmmeter.name} onChange={(e) => setField('testEquipmentUsed.megohmmeter.name', e.target.value)} readOnly={!isEditing} className="report-input" placeholder="Name" />
            <label>Serial #:</label>
            <input value={formData.testEquipmentUsed.megohmmeter.serialNumber} onChange={(e) => setField('testEquipmentUsed.megohmmeter.serialNumber', e.target.value)} readOnly={!isEditing} className="report-input" />
            <label>AMP ID:</label>
            <input value={formData.testEquipmentUsed.megohmmeter.ampId} onChange={(e) => setField('testEquipmentUsed.megohmmeter.ampId', e.target.value)} readOnly={!isEditing} className="report-input" />
          </div>
          <div className="equipment-row">
            <label>Low Resistance Ohmmeter:</label>
            <input value={formData.testEquipmentUsed.lowResistanceOhmmeter.name} onChange={(e) => setField('testEquipmentUsed.lowResistanceOhmmeter.name', e.target.value)} readOnly={!isEditing} className="report-input" placeholder="Name" />
            <label>Serial #:</label>
            <input value={formData.testEquipmentUsed.lowResistanceOhmmeter.serialNumber} onChange={(e) => setField('testEquipmentUsed.lowResistanceOhmmeter.serialNumber', e.target.value)} readOnly={!isEditing} className="report-input" />
            <label>AMP ID:</label>
            <input value={formData.testEquipmentUsed.lowResistanceOhmmeter.ampId} onChange={(e) => setField('testEquipmentUsed.lowResistanceOhmmeter.ampId', e.target.value)} readOnly={!isEditing} className="report-input" />
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
};

export default AutomaticTransferSwitchReport;
