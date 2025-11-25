/**
 * Switchgear Report - Desktop Version
 * Matches the web app's SwitchgearReport.tsx structure
 */

import React, { useState, useEffect } from 'react';
import {
  getTCF, fahrenheitToCelsius, multiplyByTCF,
  VISUAL_INSPECTION_OPTIONS, TEST_VOLTAGE_OPTIONS, IR_UNITS, CONTACT_RESISTANCE_UNITS
} from './BaseReport';
import './ReportStyles.css';

interface SwitchgearReportProps {
  job: any;
  reportData: any;
  onSave: (data: any) => void;
}

// Visual inspection items matching the web app's SwitchgearSwitchboardAssembliesATS25Report.tsx
const DEFAULT_VISUAL_INSPECTION_ITEMS = [
  { id: '7.1.1.A.1', description: 'Compare equipment nameplate data with drawings.', result: 'Select One', comments: '' },
  { id: '7.1.1.A.2', description: 'Inspect physical, electrical, and mechanical condition.', result: 'Select One', comments: '' },
  { id: '7.1.1.A.3', description: 'Inspect anchorage, alignment, grounding, and required area clearances.', result: 'Select One', comments: '' },
  { id: '7.1.1.A.4', description: 'Verify unit is clean and all shipping bracing and loose parts removed.', result: 'Select One', comments: '' },
  { id: '7.1.1.A.5', description: 'Compare mimic diagram and device labeling with drawings.', result: 'Select One', comments: '' },
  { id: '7.1.1.A.6', description: 'Verify fuse and circuit breaker sizes and types correspond to drawings and coordination study.', result: 'Select One', comments: '' },
  { id: '7.1.1.A.7', description: 'Verify CT and PT ratios correspond to drawings.', result: 'Select One', comments: '' },
  { id: '7.1.1.A.8', description: 'Verify tight wiring connections and secure wiring for moving parts.', result: 'Select One', comments: '' },
  { id: '7.1.1.A.9', description: 'Verify tightness of accessible bolted electrical connections by calibrated torque-wrench method or manufacturer data.', result: 'Select One', comments: '' },
  { id: '7.1.1.A.10', description: 'Confirm correct operation/sequencing of electrical and mechanical interlock systems.', result: 'Select One', comments: '' },
  { id: '7.1.1.A.11', description: 'Verify appropriate lubrication on moving current-carrying parts and sliding surfaces.', result: 'Select One', comments: '' },
  { id: '7.1.1.A.12', description: 'Inspect insulators for damage or contamination.', result: 'Select One', comments: '' },
  { id: '7.1.1.A.13', description: 'Verify correct barrier and shutter installation and operation.', result: 'Select One', comments: '' },
  { id: '7.1.1.A.14', description: 'Exercise all active components.', result: 'Select One', comments: '' },
  { id: '7.1.1.A.15', description: 'Inspect mechanical indicating devices for correct operation.', result: 'Select One', comments: '' },
  { id: '7.1.1.A.16', description: 'Verify filters are in place and vents are clear.', result: 'Select One', comments: '' },
  { id: '7.1.1.A.17', description: 'Visual/mechanical inspection of instrument transformers per Section 7.19.', result: 'Select One', comments: '' },
  { id: '7.1.1.A.18', description: 'Visual/mechanical inspection of surge arresters per Section 7.19.', result: 'Select One', comments: '' },
  { id: '7.1.1.A.19', description: 'Inspect control power transformers.', result: 'Select One', comments: '' },
  { id: '7.1.1.A.20', description: '*Perform thermographic survey per Section 9.', result: 'Select One', comments: '' }
];

// Default bus sections matching web app (5 sections)
const DEFAULT_BUS_SECTIONS = ['Section 1', 'Section 2', 'Section 3', 'Section 4', 'Section 5'];

const createDefaultFormData = () => ({
  // Job Information - matches web app's FormData interface
  customerName: '',
  customerLocation: '',
  userName: '',
  date: new Date().toISOString().split('T')[0],
  identifier: '',
  jobNumber: '',
  technicians: '',
  temperature: { fahrenheit: 68, celsius: 20, tcf: 1, humidity: null as number | null },
  substation: '',
  eqptLocation: '',
  status: 'PASS' as 'PASS' | 'FAIL' | 'LIMITED SERVICE',
  
  // Nameplate - matches web app's nested nameplate structure
  nameplate: {
    manufacturer: '',
    catalogNumber: '',
    serialNumber: '',
    series: '',
    type: '',
    ratedVoltage: '',
    systemVoltage: '',
    ratedCurrent: '',
    aicRating: '',
    phaseConfiguration: ''
  },
  
  // Visual Inspection - matches web app's visualInspectionItems
  visualInspectionItems: [...DEFAULT_VISUAL_INSPECTION_ITEMS],
  
  // Insulation Resistance - matches web app's insulationMeasured structure
  insulationMeasured: DEFAULT_BUS_SECTIONS.map(b => ({
    busSection: b, ag: '', bg: '', cg: '', ab: '', bc: '', ca: '', an: '', bn: '', cn: ''
  })),
  insulationUnit: 'MΩ',
  insulationTestVoltage: '1000V',
  
  // Temperature Corrected - matches web app's tempCorrected
  tempCorrected: DEFAULT_BUS_SECTIONS.map(b => ({
    busSection: b, ag: '', bg: '', cg: '', ab: '', bc: '', ca: '', an: '', bn: '', cn: ''
  })),
  criteriaValue: '≥ 25',
  criteriaUnits: 'MΩ',
  
  // Contact Resistance - matches web app's contactResistance
  contactResistance: DEFAULT_BUS_SECTIONS.map(b => ({
    busSection: b, aPhase: '', bPhase: '', cPhase: '', neutral: '', ground: ''
  })),
  contactUnit: 'µΩ',
  contactEvaluation: DEFAULT_BUS_SECTIONS.map(() => ({ deviation: 'N/A', criteria: '<50%', result: 'N/A' as 'PASS' | 'FAIL' | 'N/A' })),
  contactNeutral: { criteria: 'N/A', result: 'N/A' as 'PASS' | 'FAIL' | 'N/A' },
  contactGround: { criteria: 'N/A', result: 'N/A' as 'PASS' | 'FAIL' | 'N/A' },
  
  // Dielectric Withstand - matches web app's dielectricWithstand
  dielectricWithstand: DEFAULT_BUS_SECTIONS.map(b => ({
    busSection: b, ag: '', bg: '', cg: '', result: '' as 'PASS' | 'FAIL' | ''
  })),
  dielectricUnit: 'µA',
  dielectricTestVoltage: '2.3 kVDC',
  dielectricTestDuration: '1 min.',
  
  // Test Equipment - matches web app's testEquipment structure
  testEquipment: {
    megohmmeter: { name: '', serialNumber: '', ampId: '' },
    lowResistanceOhmmeter: { name: '', serialNumber: '', ampId: '' },
    hipot: { name: '', serialNumber: '', ampId: '' }
  },
  
  // Comments
  comments: '',
  
  // Legacy fields for backward compatibility
  customer: '',
  address: '',
  manufacturer: '',
  catalogNumber: '',
  serialNumber: '',
  type: '',
  systemVoltage: '',
  ratedVoltage: '',
  ratedCurrent: '',
  phaseConfiguration: '',
  
  // Backward compatible arrays (will be populated from new structure)
  insulationResistanceTests: [] as any[],
  temperatureCorrectedTests: [] as any[],
  contactResistanceTests: [] as any[],
  dielectricWithstandTests: [] as any[]
});

const SwitchgearReport: React.FC<SwitchgearReportProps> = ({ job, reportData, onSave }) => {
  const [formData, setFormData] = useState<any>(createDefaultFormData());
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    console.log('SwitchgearReport: reportData received:', reportData);
    if (reportData) {
      const defaults = createDefaultFormData();
      const merged = { ...defaults };
      
      // Map data from web app's structure (report_info, visual_mechanical, insulation_resistance, contact_resistance)
      // The web app stores data in these JSONB columns which get flattened during sync
      
      // Job Information - check both direct fields and report_info
      const info = reportData.report_info || reportData;
      merged.customerName = info.customer || info.customerName || reportData.customerName || '';
      merged.customerLocation = info.address || info.customerLocation || reportData.customerLocation || '';
      merged.userName = info.userName || reportData.userName || '';
      merged.date = info.date || reportData.date || defaults.date;
      merged.identifier = info.identifier || reportData.identifier || '';
      merged.jobNumber = info.jobNumber || reportData.jobNumber || '';
      merged.technicians = info.technicians || reportData.technicians || '';
      merged.substation = info.substation || reportData.substation || '';
      merged.eqptLocation = info.eqptLocation || reportData.eqptLocation || '';
      merged.status = info.status || reportData.status || 'PASS';
      
      // Temperature - handle nested structure
      const temp = info.temperature || reportData.temperature || {};
      merged.temperature = {
        fahrenheit: temp.fahrenheit ?? 68,
        celsius: temp.celsius ?? 20,
        tcf: temp.tcf ?? 1,
        humidity: temp.humidity ?? null
      };
      
      // Nameplate - check both direct fields and nested nameplate object
      const np = reportData.nameplate || info;
      merged.nameplate = {
        manufacturer: np.manufacturer || info.manufacturer || reportData.manufacturer || '',
        catalogNumber: np.catalogNumber || info.catalogNumber || reportData.catalogNumber || '',
        serialNumber: np.serialNumber || info.serialNumber || reportData.serialNumber || '',
        series: np.series || info.series || reportData.series || '',
        type: np.type || info.type || reportData.type || '',
        ratedVoltage: np.ratedVoltage || info.ratedVoltage || reportData.ratedVoltage || '',
        systemVoltage: np.systemVoltage || info.systemVoltage || reportData.systemVoltage || '',
        ratedCurrent: np.ratedCurrent || info.ratedCurrent || reportData.ratedCurrent || '',
        aicRating: np.aicRating || info.aicRating || reportData.aicRating || '',
        phaseConfiguration: np.phaseConfiguration || info.phaseConfiguration || reportData.phaseConfiguration || ''
      };
      
      // Also set legacy flat fields for backward compatibility
      merged.manufacturer = merged.nameplate.manufacturer;
      merged.catalogNumber = merged.nameplate.catalogNumber;
      merged.serialNumber = merged.nameplate.serialNumber;
      merged.type = merged.nameplate.type;
      merged.systemVoltage = merged.nameplate.systemVoltage;
      merged.ratedVoltage = merged.nameplate.ratedVoltage;
      merged.ratedCurrent = merged.nameplate.ratedCurrent;
      merged.phaseConfiguration = merged.nameplate.phaseConfiguration;
      merged.customer = merged.customerName;
      merged.address = merged.customerLocation;
      
      // Visual Inspection Items - check visual_mechanical.items or visualInspectionItems
      const visualItems = reportData.visual_mechanical?.items || 
                          reportData.visualInspectionItems || 
                          reportData.visual_inspection_items?.items ||
                          reportData.visual_inspection_items ||
                          [];
      if (visualItems.length > 0) {
        merged.visualInspectionItems = visualItems.map((item: any) => ({
          id: item.id || '',
          description: item.description || '',
          result: item.result || 'Select One',
          comments: item.comments || ''
        }));
      }
      
      // Insulation Resistance - check insulation_resistance.tests or insulationMeasured
      const irData = reportData.insulation_resistance || {};
      const irTests = irData.tests || reportData.insulationMeasured || reportData.insulationResistanceTests || [];
      if (irTests.length > 0) {
        merged.insulationMeasured = irTests.map((test: any, idx: number) => ({
          busSection: test.busSection || DEFAULT_BUS_SECTIONS[idx] || `Section ${idx + 1}`,
          ag: test.ag || test.values?.ag || '',
          bg: test.bg || test.values?.bg || '',
          cg: test.cg || test.values?.cg || '',
          ab: test.ab || test.values?.ab || '',
          bc: test.bc || test.values?.bc || '',
          ca: test.ca || test.values?.ca || '',
          an: test.an || test.values?.an || '',
          bn: test.bn || test.values?.bn || '',
          cn: test.cn || test.values?.cn || ''
        }));
      }
      merged.insulationUnit = irData.unit || reportData.insulationUnit || 'MΩ';
      merged.insulationTestVoltage = irData.testVoltage || reportData.insulationTestVoltage || '1000V';
      
      // Temperature Corrected - check insulation_resistance.correctedTests or tempCorrected
      const correctedTests = irData.correctedTests || reportData.tempCorrected || reportData.temperatureCorrectedTests || [];
      if (correctedTests.length > 0) {
        merged.tempCorrected = correctedTests.map((test: any, idx: number) => ({
          busSection: test.busSection || DEFAULT_BUS_SECTIONS[idx] || `Section ${idx + 1}`,
          ag: test.ag || test.values?.ag || '',
          bg: test.bg || test.values?.bg || '',
          cg: test.cg || test.values?.cg || '',
          ab: test.ab || test.values?.ab || '',
          bc: test.bc || test.values?.bc || '',
          ca: test.ca || test.values?.ca || '',
          an: test.an || test.values?.an || '',
          bn: test.bn || test.values?.bn || '',
          cn: test.cn || test.values?.cn || ''
        }));
      }
      
      // Contact Resistance - check contact_resistance.tests or contactResistance
      const crData = reportData.contact_resistance || {};
      const crTests = crData.tests || reportData.contactResistance || reportData.contactResistanceTests || [];
      if (crTests.length > 0) {
        merged.contactResistance = crTests.map((test: any, idx: number) => ({
          busSection: test.busSection || DEFAULT_BUS_SECTIONS[idx] || `Section ${idx + 1}`,
          aPhase: test.aPhase || test.values?.aPhase || '',
          bPhase: test.bPhase || test.values?.bPhase || '',
          cPhase: test.cPhase || test.values?.cPhase || '',
          neutral: test.neutral || test.values?.neutral || '',
          ground: test.ground || test.values?.ground || ''
        }));
      }
      merged.contactUnit = crData.unit || reportData.contactUnit || 'µΩ';
      
      // Dielectric Withstand - check contact_resistance.dielectricTests or dielectricWithstand
      const dwTests = crData.dielectricTests || reportData.dielectricWithstand || reportData.dielectricWithstandTests || [];
      if (dwTests.length > 0) {
        merged.dielectricWithstand = dwTests.map((test: any, idx: number) => ({
          busSection: test.busSection || DEFAULT_BUS_SECTIONS[idx] || `Section ${idx + 1}`,
          ag: test.ag || test.values?.ag || '',
          bg: test.bg || test.values?.bg || '',
          cg: test.cg || test.values?.cg || '',
          result: test.result || ''
        }));
      }
      merged.dielectricUnit = crData.dielectricUnit || reportData.dielectricUnit || 'µA';
      merged.dielectricTestVoltage = crData.dielectricTestVoltage || reportData.dielectricTestVoltage || '2.3 kVDC';
      merged.dielectricTestDuration = crData.dielectricDuration || reportData.dielectricTestDuration || '1 min.';
      
      // Test Equipment - check testEquipment or test_equipment_used
      const te = reportData.testEquipment || reportData.test_equipment_used || info.testEquipment || {};
      merged.testEquipment = {
        megohmmeter: {
          name: te.megohmmeter?.name || '',
          serialNumber: te.megohmmeter?.serialNumber || '',
          ampId: te.megohmmeter?.ampId || ''
        },
        lowResistanceOhmmeter: {
          name: te.lowResistanceOhmmeter?.name || te.lowResistance?.name || '',
          serialNumber: te.lowResistanceOhmmeter?.serialNumber || te.lowResistance?.serialNumber || '',
          ampId: te.lowResistanceOhmmeter?.ampId || te.lowResistance?.ampId || ''
        },
        hipot: {
          name: te.hipot?.name || '',
          serialNumber: te.hipot?.serialNumber || '',
          ampId: te.hipot?.ampId || ''
        }
      };
      
      // Comments
      merged.comments = reportData.comments || '';
      
      console.log('SwitchgearReport: merged data:', {
        customerName: merged.customerName,
        visualInspectionItems: merged.visualInspectionItems?.length,
        insulationMeasured: merged.insulationMeasured?.length,
        contactResistance: merged.contactResistance?.length
      });
      
      setFormData(merged);
    }
  }, [reportData]);

  useEffect(() => {
    if (job) {
      setFormData((prev: any) => ({
        ...prev,
        jobNumber: job.job_number || prev.jobNumber,
        customerName: job.customer_name || prev.customerName,
        customerLocation: job.site_address || prev.customerLocation,
        customer: job.customer_name || prev.customer,
        address: job.site_address || prev.address,
        jobTitle: job.title || prev.jobTitle
      }));
    }
  }, [job]);

  useEffect(() => {
    const fahrenheit = formData.temperature?.fahrenheit || 68;
    const celsius = fahrenheitToCelsius(fahrenheit);
    const tcf = getTCF(celsius);
    if (celsius !== formData.temperature?.celsius || tcf !== formData.temperature?.tcf) {
      setFormData((prev: any) => ({ ...prev, temperature: { ...prev.temperature, celsius, tcf } }));
    }
  }, [formData.temperature?.fahrenheit]);

  // Calculate temperature corrected values when insulation measured or TCF changes
  useEffect(() => {
    const tcf = formData.temperature?.tcf || 1;
    if (formData.insulationMeasured?.length > 0) {
      const correctedTests = formData.insulationMeasured.map((test: any) => ({
        busSection: test.busSection,
        ag: multiplyByTCF(test.ag, tcf),
        bg: multiplyByTCF(test.bg, tcf),
        cg: multiplyByTCF(test.cg, tcf),
        ab: multiplyByTCF(test.ab, tcf),
        bc: multiplyByTCF(test.bc, tcf),
        ca: multiplyByTCF(test.ca, tcf),
        an: multiplyByTCF(test.an, tcf),
        bn: multiplyByTCF(test.bn, tcf),
        cn: multiplyByTCF(test.cn, tcf)
      }));
      setFormData((prev: any) => ({ ...prev, tempCorrected: correctedTests }));
    }
  }, [formData.insulationMeasured, formData.temperature?.tcf]);

  const setField = (path: string, value: any) => {
    setFormData((prev: any) => {
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
      await onSave(formData);
      setIsEditing(false);
    } catch (error) {
      console.error('Save failed:', error);
      alert('Failed to save report');
    } finally {
      setSaving(false);
    }
  };

  // Update insulation measured test (new flat structure)
  const updateInsulationTest = (index: number, field: string, value: any) => {
    const tests = [...formData.insulationMeasured];
    tests[index] = { ...tests[index], [field]: value };
    setFormData((prev: any) => ({ ...prev, insulationMeasured: tests }));
  };

  // Update contact resistance test (new flat structure)
  const updateContactTest = (index: number, field: string, value: any) => {
    const tests = [...formData.contactResistance];
    tests[index] = { ...tests[index], [field]: value };
    setFormData((prev: any) => ({ ...prev, contactResistance: tests }));
  };

  // Update dielectric withstand test (new flat structure)
  const updateDielectricTest = (index: number, field: string, value: any) => {
    const tests = [...formData.dielectricWithstand];
    tests[index] = { ...tests[index], [field]: value };
    setFormData((prev: any) => ({ ...prev, dielectricWithstand: tests }));
  };

  const updateVisualInspection = (index: number, field: string, value: string) => {
    const items = [...formData.visualInspectionItems];
    items[index] = { ...items[index], [field]: value };
    setFormData((prev: any) => ({ ...prev, visualInspectionItems: items }));
  };

  return (
    <div className="report-container">
      {/* Header */}
      <div className="report-header-bar">
        <h1 className="report-title">Switchgear, Switchboard, Panelboard Inspection & Test Report ATS 21</h1>
        <div className="report-actions">
          <button onClick={() => setField('status', formData.status === 'PASS' ? 'FAIL' : 'PASS')} disabled={!isEditing} className={`status-btn ${formData.status === 'PASS' ? 'pass' : 'fail'}`}>
            {formData.status}
          </button>
          {!isEditing ? (
            <button onClick={() => setIsEditing(true)} className="btn-primary">Edit Report</button>
          ) : (
            <button onClick={handleSave} disabled={saving} className="btn-save">{saving ? 'Saving...' : 'Save Report'}</button>
          )}
        </div>
      </div>

      {/* Job Information */}
      <section className="report-section">
        <div className="section-divider"></div>
        <h2 className="section-title">Job Information</h2>
        <div className="form-grid-6">
          <div className="form-field"><label>Customer:</label><input value={formData.customerName || ''} onChange={e => setField('customerName', e.target.value)} readOnly={!isEditing} className="report-input" /></div>
          <div className="form-field"><label>Address:</label><input value={formData.customerLocation || ''} onChange={e => setField('customerLocation', e.target.value)} readOnly={!isEditing} className="report-input" /></div>
          <div className="form-field"><label>Job #:</label><input value={formData.jobNumber || ''} onChange={e => setField('jobNumber', e.target.value)} readOnly={!isEditing} className="report-input" /></div>
          <div className="form-field"><label>User:</label><input value={formData.userName || ''} onChange={e => setField('userName', e.target.value)} readOnly={!isEditing} className="report-input" /></div>
          <div className="form-field"><label>Date:</label><input type="date" value={formData.date || ''} onChange={e => setField('date', e.target.value)} readOnly={!isEditing} className="report-input" /></div>
          <div className="form-field"><label>Identifier:</label><input value={formData.identifier || ''} onChange={e => setField('identifier', e.target.value)} readOnly={!isEditing} className="report-input" /></div>
          <div className="form-field"><label>Technicians:</label><input value={formData.technicians || ''} onChange={e => setField('technicians', e.target.value)} readOnly={!isEditing} className="report-input" /></div>
          <div className="form-field temp-field">
            <label>Temp:</label>
            <div className="temp-inputs">
              <input type="number" value={formData.temperature?.fahrenheit ?? 68} onChange={e => setField('temperature.fahrenheit', Number(e.target.value))} readOnly={!isEditing} className="report-input temp-input" />
              <span>°F</span>
              <span className="temp-celsius">{formData.temperature?.celsius ?? 20}</span>
              <span>°C</span>
              <span className="temp-label">TCF</span>
              <span className="temp-value">{(formData.temperature?.tcf ?? 1).toFixed(3)}</span>
            </div>
          </div>
          <div className="form-field"><label>Humidity:</label><div className="humidity-input"><input type="number" value={formData.temperature?.humidity ?? ''} onChange={e => setField('temperature.humidity', Number(e.target.value))} readOnly={!isEditing} className="report-input humidity-field" /><span>%</span></div></div>
          <div className="form-field"><label>Substation:</label><input value={formData.substation || ''} onChange={e => setField('substation', e.target.value)} readOnly={!isEditing} className="report-input" /></div>
          <div className="form-field"><label>Eqpt. Location:</label><input value={formData.eqptLocation || ''} onChange={e => setField('eqptLocation', e.target.value)} readOnly={!isEditing} className="report-input" /></div>
        </div>
      </section>

      {/* Nameplate Data */}
      <section className="report-section">
        <div className="section-divider"></div>
        <h2 className="section-title">Nameplate Data</h2>
        <div className="enclosure-grid">
          <div className="enclosure-row">
            <div className="enclosure-cell"><strong>Manufacturer:</strong><input value={formData.nameplate?.manufacturer || ''} onChange={e => setField('nameplate.manufacturer', e.target.value)} readOnly={!isEditing} className="report-input" /></div>
            <div className="enclosure-cell"><strong>Catalog #:</strong><input value={formData.nameplate?.catalogNumber || ''} onChange={e => setField('nameplate.catalogNumber', e.target.value)} readOnly={!isEditing} className="report-input" /></div>
            <div className="enclosure-cell"><strong>Serial #:</strong><input value={formData.nameplate?.serialNumber || ''} onChange={e => setField('nameplate.serialNumber', e.target.value)} readOnly={!isEditing} className="report-input" /></div>
            <div className="enclosure-cell"><strong>Series:</strong><input value={formData.nameplate?.series || ''} onChange={e => setField('nameplate.series', e.target.value)} readOnly={!isEditing} className="report-input" /></div>
          </div>
          <div className="enclosure-row">
            <div className="enclosure-cell"><strong>Type:</strong><input value={formData.nameplate?.type || ''} onChange={e => setField('nameplate.type', e.target.value)} readOnly={!isEditing} className="report-input" /></div>
            <div className="enclosure-cell"><strong>System Voltage:</strong><input value={formData.nameplate?.systemVoltage || ''} onChange={e => setField('nameplate.systemVoltage', e.target.value)} readOnly={!isEditing} className="report-input" /></div>
            <div className="enclosure-cell">
              <strong>Rated Voltage:</strong>
              <select value={formData.nameplate?.ratedVoltage || ''} onChange={e => setField('nameplate.ratedVoltage', e.target.value)} disabled={!isEditing} className="report-input">
                <option value="">Select...</option>
                {['250','480','600','1000','2500','5000','8000','15000','25000','34500','46000'].map(v => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>
            <div className="enclosure-cell"><strong>Rated Current:</strong><input value={formData.nameplate?.ratedCurrent || ''} onChange={e => setField('nameplate.ratedCurrent', e.target.value)} readOnly={!isEditing} className="report-input" /></div>
          </div>
          <div className="enclosure-row">
            <div className="enclosure-cell"><strong>AIC Rating:</strong><input value={formData.nameplate?.aicRating || ''} onChange={e => setField('nameplate.aicRating', e.target.value)} readOnly={!isEditing} className="report-input" /></div>
            <div className="enclosure-cell"><strong>Phase Config:</strong><input value={formData.nameplate?.phaseConfiguration || ''} onChange={e => setField('nameplate.phaseConfiguration', e.target.value)} readOnly={!isEditing} className="report-input" /></div>
          </div>
        </div>
      </section>

      {/* Visual and Mechanical Inspection */}
      <section className="report-section">
        <div className="section-divider"></div>
        <h2 className="section-title">Visual and Mechanical Inspection</h2>
        <p className="section-subtitle">Per NETA ATS Section 7.1</p>
        <div className="table-container">
          <table className="report-table">
            <thead>
              <tr>
                <th style={{ width: '8%' }}>#</th>
                <th style={{ width: '52%' }}>Description</th>
                <th style={{ width: '15%' }}>Result</th>
                <th style={{ width: '25%' }}>Comments</th>
              </tr>
            </thead>
            <tbody>
              {formData.visualInspectionItems.map((item: any, idx: number) => (
                <tr key={item.id || idx}>
                  <td>{item.id}</td>
                  <td className="text-left">{item.description}</td>
                  <td>
                    <select value={item.result} onChange={e => updateVisualInspection(idx, 'result', e.target.value)} disabled={!isEditing} className="report-input">
                      {VISUAL_INSPECTION_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </td>
                  <td><input value={item.comments || ''} onChange={e => updateVisualInspection(idx, 'comments', e.target.value)} readOnly={!isEditing} className="report-input" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Measured Insulation Resistance */}
      <section className="report-section">
        <div className="section-divider"></div>
        <h2 className="section-title">Electrical Tests - Measured Insulation Resistance Values</h2>
        <div className="flex gap-4 mb-2">
          <div className="flex items-center gap-2">
            <label className="font-medium">Test Voltage:</label>
            <select value={formData.insulationTestVoltage || '1000V'} onChange={e => setField('insulationTestVoltage', e.target.value)} disabled={!isEditing} className="report-input" style={{width: 'auto'}}>
              {TEST_VOLTAGE_OPTIONS.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="font-medium">Unit:</label>
            <select value={formData.insulationUnit || 'MΩ'} onChange={e => setField('insulationUnit', e.target.value)} disabled={!isEditing} className="report-input" style={{width: 'auto'}}>
              {IR_UNITS.map(u => <option key={u.symbol} value={u.symbol}>{u.symbol}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="font-medium">Criteria:</label>
            <input value={formData.criteriaValue || '≥ 25'} onChange={e => setField('criteriaValue', e.target.value)} readOnly={!isEditing} className="report-input" style={{width: '80px'}} />
            <span>{formData.criteriaUnits || 'MΩ'}</span>
          </div>
        </div>
        <div className="table-container">
          <table className="report-table ir-table">
            <thead>
              <tr><th>Bus Section</th><th>A-G</th><th>B-G</th><th>C-G</th><th>A-B</th><th>B-C</th><th>C-A</th><th>A-N</th><th>B-N</th><th>C-N</th></tr>
            </thead>
            <tbody>
              {formData.insulationMeasured?.map((test: any, idx: number) => (
                <tr key={idx}>
                  <td>{test.busSection}</td>
                  <td><input value={test.ag || ''} onChange={e => updateInsulationTest(idx, 'ag', e.target.value)} readOnly={!isEditing} className="report-input" /></td>
                  <td><input value={test.bg || ''} onChange={e => updateInsulationTest(idx, 'bg', e.target.value)} readOnly={!isEditing} className="report-input" /></td>
                  <td><input value={test.cg || ''} onChange={e => updateInsulationTest(idx, 'cg', e.target.value)} readOnly={!isEditing} className="report-input" /></td>
                  <td><input value={test.ab || ''} onChange={e => updateInsulationTest(idx, 'ab', e.target.value)} readOnly={!isEditing} className="report-input" /></td>
                  <td><input value={test.bc || ''} onChange={e => updateInsulationTest(idx, 'bc', e.target.value)} readOnly={!isEditing} className="report-input" /></td>
                  <td><input value={test.ca || ''} onChange={e => updateInsulationTest(idx, 'ca', e.target.value)} readOnly={!isEditing} className="report-input" /></td>
                  <td><input value={test.an || ''} onChange={e => updateInsulationTest(idx, 'an', e.target.value)} readOnly={!isEditing} className="report-input" /></td>
                  <td><input value={test.bn || ''} onChange={e => updateInsulationTest(idx, 'bn', e.target.value)} readOnly={!isEditing} className="report-input" /></td>
                  <td><input value={test.cn || ''} onChange={e => updateInsulationTest(idx, 'cn', e.target.value)} readOnly={!isEditing} className="report-input" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Temperature Corrected Insulation Resistance */}
      <section className="report-section">
        <div className="section-divider"></div>
        <h2 className="section-title">Electrical Tests - Temperature Corrected Insulation Resistance Values</h2>
        <p className="section-note">(Auto-calculated from measured values × TCF = {(formData.temperature?.tcf ?? 1).toFixed(3)})</p>
        <div className="table-container">
          <table className="report-table ir-table">
            <thead>
              <tr><th>Bus Section</th><th>A-G</th><th>B-G</th><th>C-G</th><th>A-B</th><th>B-C</th><th>C-A</th><th>A-N</th><th>B-N</th><th>C-N</th></tr>
            </thead>
            <tbody>
              {formData.tempCorrected?.map((test: any, idx: number) => (
                <tr key={idx}>
                  <td>{test.busSection}</td>
                  <td><input value={test.ag || ''} readOnly className="report-input calculated" /></td>
                  <td><input value={test.bg || ''} readOnly className="report-input calculated" /></td>
                  <td><input value={test.cg || ''} readOnly className="report-input calculated" /></td>
                  <td><input value={test.ab || ''} readOnly className="report-input calculated" /></td>
                  <td><input value={test.bc || ''} readOnly className="report-input calculated" /></td>
                  <td><input value={test.ca || ''} readOnly className="report-input calculated" /></td>
                  <td><input value={test.an || ''} readOnly className="report-input calculated" /></td>
                  <td><input value={test.bn || ''} readOnly className="report-input calculated" /></td>
                  <td><input value={test.cn || ''} readOnly className="report-input calculated" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Contact Resistance */}
      <section className="report-section">
        <div className="section-divider"></div>
        <h2 className="section-title">Electrical Tests - Contact Resistance</h2>
        <div className="flex gap-4 mb-2">
          <div className="flex items-center gap-2">
            <label className="font-medium">Unit:</label>
            <select value={formData.contactUnit || 'µΩ'} onChange={e => setField('contactUnit', e.target.value)} disabled={!isEditing} className="report-input" style={{width: 'auto'}}>
              {CONTACT_RESISTANCE_UNITS.map(u => <option key={u.symbol} value={u.symbol}>{u.symbol}</option>)}
            </select>
          </div>
        </div>
        <div className="table-container">
          <table className="report-table contact-table">
            <thead>
              <tr><th>Bus Section</th><th>A Phase</th><th>B Phase</th><th>C Phase</th><th>Neutral</th><th>Ground</th></tr>
            </thead>
            <tbody>
              {formData.contactResistance?.map((test: any, idx: number) => (
                <tr key={idx}>
                  <td>{test.busSection}</td>
                  <td><input value={test.aPhase || ''} onChange={e => updateContactTest(idx, 'aPhase', e.target.value)} readOnly={!isEditing} className="report-input" /></td>
                  <td><input value={test.bPhase || ''} onChange={e => updateContactTest(idx, 'bPhase', e.target.value)} readOnly={!isEditing} className="report-input" /></td>
                  <td><input value={test.cPhase || ''} onChange={e => updateContactTest(idx, 'cPhase', e.target.value)} readOnly={!isEditing} className="report-input" /></td>
                  <td><input value={test.neutral || ''} onChange={e => updateContactTest(idx, 'neutral', e.target.value)} readOnly={!isEditing} className="report-input" /></td>
                  <td><input value={test.ground || ''} onChange={e => updateContactTest(idx, 'ground', e.target.value)} readOnly={!isEditing} className="report-input" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Dielectric Withstand */}
      <section className="report-section">
        <div className="section-divider"></div>
        <h2 className="section-title">Electrical Tests - Dielectric Withstand (Hi-Pot)</h2>
        <div className="flex gap-4 mb-2">
          <div className="flex items-center gap-2">
            <label className="font-medium">Test Voltage:</label>
            <input value={formData.dielectricTestVoltage || ''} onChange={e => setField('dielectricTestVoltage', e.target.value)} readOnly={!isEditing} className="report-input" style={{width: '100px'}} />
          </div>
          <div className="flex items-center gap-2">
            <label className="font-medium">Duration:</label>
            <input value={formData.dielectricTestDuration || ''} onChange={e => setField('dielectricTestDuration', e.target.value)} readOnly={!isEditing} className="report-input" style={{width: '80px'}} />
          </div>
          <div className="flex items-center gap-2">
            <label className="font-medium">Unit:</label>
            <select value={formData.dielectricUnit || 'µA'} onChange={e => setField('dielectricUnit', e.target.value)} disabled={!isEditing} className="report-input" style={{width: 'auto'}}>
              <option value="µA">µA</option>
              <option value="mA">mA</option>
            </select>
          </div>
        </div>
        <div className="table-container">
          <table className="report-table">
            <thead>
              <tr><th>Bus Section</th><th>A-G</th><th>B-G</th><th>C-G</th><th>Result</th></tr>
            </thead>
            <tbody>
              {formData.dielectricWithstand?.map((test: any, idx: number) => (
                <tr key={idx}>
                  <td>{test.busSection}</td>
                  <td><input value={test.ag || ''} onChange={e => updateDielectricTest(idx, 'ag', e.target.value)} readOnly={!isEditing} className="report-input" /></td>
                  <td><input value={test.bg || ''} onChange={e => updateDielectricTest(idx, 'bg', e.target.value)} readOnly={!isEditing} className="report-input" /></td>
                  <td><input value={test.cg || ''} onChange={e => updateDielectricTest(idx, 'cg', e.target.value)} readOnly={!isEditing} className="report-input" /></td>
                  <td>
                    <select value={test.result || ''} onChange={e => updateDielectricTest(idx, 'result', e.target.value)} disabled={!isEditing} className="report-input">
                      <option value="">-</option>
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

      {/* Test Equipment Used */}
      <section className="report-section">
        <div className="section-divider"></div>
        <h2 className="section-title">Test Equipment Used</h2>
        <div className="table-container">
          <table className="report-table">
            <thead>
              <tr><th>Equipment</th><th>Name</th><th>Serial Number</th><th>AMP ID</th></tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Megohmmeter</strong></td>
                <td><input value={formData.testEquipment?.megohmmeter?.name || ''} onChange={e => setField('testEquipment.megohmmeter.name', e.target.value)} readOnly={!isEditing} className="report-input" /></td>
                <td><input value={formData.testEquipment?.megohmmeter?.serialNumber || ''} onChange={e => setField('testEquipment.megohmmeter.serialNumber', e.target.value)} readOnly={!isEditing} className="report-input" /></td>
                <td><input value={formData.testEquipment?.megohmmeter?.ampId || ''} onChange={e => setField('testEquipment.megohmmeter.ampId', e.target.value)} readOnly={!isEditing} className="report-input" /></td>
              </tr>
              <tr>
                <td><strong>Low Resistance Ohmmeter</strong></td>
                <td><input value={formData.testEquipment?.lowResistanceOhmmeter?.name || ''} onChange={e => setField('testEquipment.lowResistanceOhmmeter.name', e.target.value)} readOnly={!isEditing} className="report-input" /></td>
                <td><input value={formData.testEquipment?.lowResistanceOhmmeter?.serialNumber || ''} onChange={e => setField('testEquipment.lowResistanceOhmmeter.serialNumber', e.target.value)} readOnly={!isEditing} className="report-input" /></td>
                <td><input value={formData.testEquipment?.lowResistanceOhmmeter?.ampId || ''} onChange={e => setField('testEquipment.lowResistanceOhmmeter.ampId', e.target.value)} readOnly={!isEditing} className="report-input" /></td>
              </tr>
              <tr>
                <td><strong>Hi-Pot</strong></td>
                <td><input value={formData.testEquipment?.hipot?.name || ''} onChange={e => setField('testEquipment.hipot.name', e.target.value)} readOnly={!isEditing} className="report-input" /></td>
                <td><input value={formData.testEquipment?.hipot?.serialNumber || ''} onChange={e => setField('testEquipment.hipot.serialNumber', e.target.value)} readOnly={!isEditing} className="report-input" /></td>
                <td><input value={formData.testEquipment?.hipot?.ampId || ''} onChange={e => setField('testEquipment.hipot.ampId', e.target.value)} readOnly={!isEditing} className="report-input" /></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Comments */}
      <section className="report-section">
        <div className="section-divider"></div>
        <h2 className="section-title">Comments</h2>
        <textarea className={`report-textarea ${!isEditing ? 'readonly' : ''}`} value={formData.comments || ''} onChange={e => setField('comments', e.target.value)} readOnly={!isEditing} rows={4} />
      </section>
    </div>
  );
};

export default SwitchgearReport;



