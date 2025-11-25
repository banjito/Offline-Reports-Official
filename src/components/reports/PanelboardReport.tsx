/**
 * Panelboard Report - Desktop Version
 * Matches the web app's PanelboardReport.tsx structure EXACTLY
 * 
 * Key Structure:
 * - Insulation Resistance: Single row with A-G, B-G, C-G, A-B, B-C, C-A, A-N, B-N, C-N columns
 * - Temperature Corrected Values: Same 9 columns, auto-calculated
 * - Contact Resistance: A Phase, B Phase, C Phase, Neutral, Ground columns
 * - Visual Inspection: Items with IDs like 7.1.A.1, 7.1.A.2, etc.
 */

import React, { useState, useEffect } from 'react';
import { getTCF, VISUAL_INSPECTION_OPTIONS } from './BaseReport';
import './ReportStyles.css';

interface PanelboardReportProps {
  job: any;
  reportData: any;
  onSave: (data: any) => void;
}

// Constants matching web app exactly
const INSULATION_RESISTANCE_UNITS = [
  { symbol: 'kΩ', name: 'Kilo-Ohms' },
  { symbol: 'MΩ', name: 'Mega-Ohms' },
  { symbol: 'GΩ', name: 'Giga-Ohms' }
];

const CONTACT_RESISTANCE_UNITS = [
  { symbol: 'µΩ', name: 'Micro-Ohms' },
  { symbol: 'mΩ', name: 'Milli-Ohms' },
  { symbol: 'Ω', name: 'Ohms' }
];

// Visual inspection items matching the web app's PanelboardReport.tsx EXACTLY
const DEFAULT_VISUAL_INSPECTION_ITEMS = [
  { id: '7.1.A.1', description: 'Compare equipment nameplate data with drawings and specifications.', result: '', comments: '' },
  { id: '7.1.A.2', description: 'Inspect physical, electrical, and mechanical condition of cords and connectors.', result: '', comments: '' },
  { id: '7.1.A.3', description: 'Inspect anchorage, alignment, grounding, and required area clearances.', result: '', comments: '' },
  { id: '7.1.A.4', description: 'Verify the unit is clean and all shipping bracing, loose parts, and documentation shipped inside cubicles have been removed.', result: '', comments: '' },
  { id: '7.1.A.5', description: 'Verify that fuse and circuit breaker sizes and types correspond to drawings and coordination study as well as to the circuit breaker address for microprocessor-communication packages.', result: '', comments: '' },
  { id: '7.1.A.6', description: 'Verify that current and voltage transformer ratios correspond to drawings.', result: '', comments: '' },
  { id: '7.1.A.7', description: 'Verify that wiring connections are tight and that wiring is secure to prevent damage during routine operation of moving parts.', result: '', comments: '' },
  { id: '7.1.A.8.1', description: 'Use of a low-resistance ohmmeter in accordance with Section 7.1.B.1.', result: '', comments: '' },
  { id: '7.1.A.9', description: 'Confirm correct operation and sequencing of electrical and mechanical interlock systems.', result: '', comments: '' },
  { id: '7.1.A.10', description: 'Verify appropriate lubrication on moving current-carrying parts and on moving and sliding surfaces.', result: '', comments: '' },
  { id: '7.1.A.11', description: 'Inspect insulators for evidence of physical damage or contaminated surfaces.', result: '', comments: '' },
  { id: '7.1.A.12', description: 'Verify correct barrier and shutter installation and operation.', result: '', comments: '' },
  { id: '7.1.A.13', description: 'Exercise all active components.', result: '', comments: '' },
  { id: '7.1.A.14', description: 'Inspect mechanical indicating devices for correct operation.', result: '', comments: '' },
  { id: '7.1.A.15', description: 'Verify that filters are in place and vents are clear.', result: '', comments: '' }
];

// Insulation resistance values structure - single row with 9 test points
interface InsulationValues {
  ag: string;
  bg: string;
  cg: string;
  ab: string;
  bc: string;
  ca: string;
  an: string;
  bn: string;
  cn: string;
}

// Contact resistance values structure
interface ContactValues {
  aPhase: string;
  bPhase: string;
  cPhase: string;
  neutral: string;
  ground: string;
}

interface FormData {
  // Job Information
  jobNumber: string;
  customerName: string;
  customerLocation: string;
  date: string;
  technicians: string;
  jobTitle: string;
  substation: string;
  eqptLocation: string;
  temperature: {
    celsius: number;
    fahrenheit: number;
    humidity: number;
    tcf: number;
  };
  
  // Nameplate Data
  manufacturer: string;
  catalogNumber: string;
  serialNumber: string;
  type: string;
  systemVoltage: string;
  ratedVoltage: string;
  ratedCurrent: string;
  phaseConfiguration: string;

  // Visual and Mechanical Inspection
  visualInspectionItems: {
    id: string;
    description: string;
    result: string;
    comments: string;
  }[];

  // Electrical Tests - Insulation Resistance
  insulationResistanceTests: {
    values: InsulationValues;
    testVoltage: string;
    unit: string;
  }[];

  // Temperature Corrected Values
  temperatureCorrectedTests: {
    values: InsulationValues;
  }[];

  // Contact Resistance Tests
  contactResistanceTests: {
    busSection: string;
    values: ContactValues;
    testVoltage: string;
    unit: string;
  }[];

  // Test Equipment Used
  testEquipment: {
    megohmmeter: {
      name: string;
      serialNumber: string;
      ampId: string;
    };
    lowResistanceOhmmeter: {
      name: string;
      serialNumber: string;
      ampId: string;
    };
  };

  comments: string;
  status: string;
  identifier: string;
  userName: string;
}

const createDefaultFormData = (): FormData => ({
  jobNumber: '',
  customerName: '',
  customerLocation: '',
  date: new Date().toISOString().split('T')[0],
  technicians: '',
  jobTitle: '',
  substation: '',
  eqptLocation: '',
  temperature: {
    fahrenheit: 68,
    celsius: 20,
    humidity: 0,
    tcf: 1
  },
  manufacturer: '',
  catalogNumber: '',
  serialNumber: '',
  type: '',
  systemVoltage: '',
  ratedVoltage: '',
  ratedCurrent: '',
  phaseConfiguration: '',
  visualInspectionItems: [...DEFAULT_VISUAL_INSPECTION_ITEMS],
  insulationResistanceTests: [{
    values: { ag: '', bg: '', cg: '', ab: '', bc: '', ca: '', an: '', bn: '', cn: '' },
    testVoltage: '',
    unit: 'MΩ'
  }],
  temperatureCorrectedTests: [{
    values: { ag: '', bg: '', cg: '', ab: '', bc: '', ca: '', an: '', bn: '', cn: '' }
  }],
  contactResistanceTests: [{
    busSection: '',
    values: { aPhase: '', bPhase: '', cPhase: '', neutral: '', ground: '' },
    testVoltage: '',
    unit: 'µΩ'
  }],
  testEquipment: {
    megohmmeter: { name: '', serialNumber: '', ampId: '' },
    lowResistanceOhmmeter: { name: '', serialNumber: '', ampId: '' }
  },
  comments: '',
  status: 'PASS',
  identifier: '',
  userName: ''
});

const PanelboardReport: React.FC<PanelboardReportProps> = ({ job, reportData, onSave }) => {
  const [isEditing] = useState(true);
  const [formData, setFormData] = useState<FormData>(createDefaultFormData());

  // Parse report data on load
  useEffect(() => {
    const defaults = createDefaultFormData();
    const merged = { ...defaults };
    
    // Get job info
    const info = reportData?.report_info || reportData || {};
    
    // Job Information
    merged.customerName = info.customer || info.customerName || job?.customer || '';
    merged.customerLocation = info.address || info.customerLocation || job?.address || '';
    merged.userName = info.userName || info.user || '';
    merged.date = info.date || defaults.date;
    merged.identifier = info.identifier || '';
    merged.jobNumber = info.jobNumber || job?.job_number || '';
    merged.technicians = info.technicians || '';
    merged.substation = info.substation || '';
    merged.eqptLocation = info.eqptLocation || '';
    merged.status = info.status || 'PASS';
    
    // Temperature
    const temp = info.temperature || reportData?.temperature || {};
    merged.temperature = {
      fahrenheit: temp.fahrenheit ?? 68,
      celsius: temp.celsius ?? 20,
      tcf: temp.tcf ?? 1,
      humidity: temp.humidity ?? 0
    };
    
    // Nameplate - flat fields in web app
    merged.manufacturer = info.manufacturer || reportData?.manufacturer || '';
    merged.catalogNumber = info.catalogNumber || reportData?.catalogNumber || '';
    merged.serialNumber = info.serialNumber || reportData?.serialNumber || '';
    merged.type = info.type || reportData?.type || '';
    merged.systemVoltage = info.systemVoltage || reportData?.systemVoltage || '';
    merged.ratedVoltage = info.ratedVoltage || reportData?.ratedVoltage || '';
    merged.ratedCurrent = info.ratedCurrent || reportData?.ratedCurrent || '';
    merged.phaseConfiguration = info.phaseConfiguration || reportData?.phaseConfiguration || '';
    
    // Visual Inspection Items - from visual_mechanical.items or visualInspectionItems
    const visualSource = reportData?.visual_mechanical?.items ||
                         reportData?.visualInspectionItems ||
                         info.visualInspectionItems ||
                         [];
    if (Array.isArray(visualSource) && visualSource.length > 0) {
      // Merge by ID to keep descriptions intact
      const byId: Record<string, any> = {};
      visualSource.forEach((item: any) => {
        if (item && item.id) byId[item.id] = item;
      });
      merged.visualInspectionItems = defaults.visualInspectionItems.map(item => ({
        ...item,
        result: byId[item.id]?.result ?? item.result ?? '',
        comments: byId[item.id]?.comments ?? item.comments ?? ''
      }));
    }
    
    // Insulation Resistance Tests - from insulation_resistance.tests
    const irData = reportData?.insulation_resistance || {};
    const irTests = irData.tests || reportData?.insulationResistanceTests || info.insulationResistanceTests || [];
    if (Array.isArray(irTests) && irTests.length > 0) {
      merged.insulationResistanceTests = irTests.map((test: any) => ({
        values: {
          ag: test.values?.ag || test.ag || '',
          bg: test.values?.bg || test.bg || '',
          cg: test.values?.cg || test.cg || '',
          ab: test.values?.ab || test.ab || '',
          bc: test.values?.bc || test.bc || '',
          ca: test.values?.ca || test.ca || '',
          an: test.values?.an || test.an || '',
          bn: test.values?.bn || test.bn || '',
          cn: test.values?.cn || test.cn || ''
        },
        testVoltage: test.testVoltage || irData.testVoltage || '',
        unit: test.unit || irData.unit || 'MΩ'
      }));
    }
    
    // Temperature Corrected - from insulation_resistance.correctedTests
    const correctedTests = irData.correctedTests || reportData?.temperatureCorrectedTests || info.temperatureCorrectedTests || [];
    if (Array.isArray(correctedTests) && correctedTests.length > 0) {
      merged.temperatureCorrectedTests = correctedTests.map((test: any) => ({
        values: {
          ag: test.values?.ag || test.ag || '',
          bg: test.values?.bg || test.bg || '',
          cg: test.values?.cg || test.cg || '',
          ab: test.values?.ab || test.ab || '',
          bc: test.values?.bc || test.bc || '',
          ca: test.values?.ca || test.ca || '',
          an: test.values?.an || test.an || '',
          bn: test.values?.bn || test.bn || '',
          cn: test.values?.cn || test.cn || ''
        }
      }));
    }
    
    // Contact Resistance Tests - from contact_resistance.tests
    const crData = reportData?.contact_resistance || {};
    const crTests = crData.tests || reportData?.contactResistanceTests || info.contactResistanceTests || [];
    if (Array.isArray(crTests) && crTests.length > 0) {
      merged.contactResistanceTests = crTests.map((test: any) => ({
        busSection: test.busSection || '',
        values: {
          aPhase: test.values?.aPhase || test.aPhase || '',
          bPhase: test.values?.bPhase || test.bPhase || '',
          cPhase: test.values?.cPhase || test.cPhase || '',
          neutral: test.values?.neutral || test.neutral || '',
          ground: test.values?.ground || test.ground || ''
        },
        testVoltage: test.testVoltage || crData.testVoltage || '',
        unit: test.unit || crData.unit || 'µΩ'
      }));
    }
    
    // Test Equipment - from test_equipment_used or testEquipment
    const te = reportData?.test_equipment_used || reportData?.testEquipment || info.testEquipment || {};
    merged.testEquipment = {
      megohmmeter: {
        name: te.megohmmeter?.name || '',
        serialNumber: te.megohmmeter?.serialNumber || '',
        ampId: te.megohmmeter?.ampId || ''
      },
      lowResistanceOhmmeter: {
        name: te.lowResistanceOhmmeter?.name || '',
        serialNumber: te.lowResistanceOhmmeter?.serialNumber || '',
        ampId: te.lowResistanceOhmmeter?.ampId || ''
      }
    };
    
    // Comments
    merged.comments = reportData?.comments || info.comments || '';
    
    setFormData(merged);
  }, [reportData, job]);

  // Calculate TCF when temperature changes
  useEffect(() => {
    const tcf = getTCF(formData.temperature.celsius);
    if (tcf !== formData.temperature.tcf) {
      setFormData(prev => ({
        ...prev,
        temperature: { ...prev.temperature, tcf }
      }));
    }
  }, [formData.temperature.celsius]);

  // Calculate temperature corrected value
  const calculateCorrectedValue = (value: string): string => {
    if (!value || value === '' || value.toUpperCase() === 'N/A') return value;
    const trimmed = value.trim();
    if (trimmed.includes('>') || trimmed.includes('<')) return value;
    const numeric = parseFloat(trimmed);
    if (isNaN(numeric)) return value;
    return (numeric * formData.temperature.tcf).toFixed(2);
  };

  // Set field helper
  const setField = (path: string, value: any) => {
    setFormData(prev => {
      const newData = { ...prev };
      const parts = path.split('.');
      let current: any = newData;
      for (let i = 0; i < parts.length - 1; i++) {
        if (current[parts[i]] === undefined) current[parts[i]] = {};
        current = current[parts[i]];
      }
      current[parts[parts.length - 1]] = value;
      return newData;
    });
  };

  // Handle temperature changes
  const handleFahrenheitChange = (fahrenheit: number) => {
    const celsius = Math.round((fahrenheit - 32) * 5 / 9);
    const tcf = getTCF(celsius);
    setFormData(prev => ({
      ...prev,
      temperature: { ...prev.temperature, fahrenheit, celsius, tcf }
    }));
  };

  const handleCelsiusChange = (celsius: number) => {
    const fahrenheit = Math.round((celsius * 9 / 5) + 32);
    const tcf = getTCF(celsius);
    setFormData(prev => ({
      ...prev,
      temperature: { ...prev.temperature, fahrenheit, celsius, tcf }
    }));
  };

  // Update insulation resistance value
  const updateInsulationValue = (key: string, value: string) => {
    setFormData(prev => {
      const newTests = [...prev.insulationResistanceTests];
      if (newTests.length === 0) {
        newTests.push({
          values: { ag: '', bg: '', cg: '', ab: '', bc: '', ca: '', an: '', bn: '', cn: '' },
          testVoltage: '',
          unit: 'MΩ'
        });
      }
      newTests[0] = {
        ...newTests[0],
        values: { ...newTests[0].values, [key]: value }
      };
      return { ...prev, insulationResistanceTests: newTests };
    });
  };

  // Update contact resistance value
  const updateContactValue = (key: string, value: string) => {
    setFormData(prev => {
      const newTests = [...prev.contactResistanceTests];
      if (newTests.length === 0) {
        newTests.push({
          busSection: '',
          values: { aPhase: '', bPhase: '', cPhase: '', neutral: '', ground: '' },
          testVoltage: '',
          unit: 'µΩ'
        });
      }
      newTests[0] = {
        ...newTests[0],
        values: { ...newTests[0].values, [key]: value }
      };
      return { ...prev, contactResistanceTests: newTests };
    });
  };

  // Update visual inspection item
  const updateVisualInspection = (index: number, field: string, value: string) => {
    setFormData(prev => {
      const newItems = [...prev.visualInspectionItems];
      newItems[index] = { ...newItems[index], [field]: value };
      return { ...prev, visualInspectionItems: newItems };
    });
  };

  // Handle save
  const handleSave = () => {
    const saveData = {
      report_info: {
        customer: formData.customerName,
        address: formData.customerLocation,
        date: formData.date,
        technicians: formData.technicians,
        jobNumber: formData.jobNumber,
        substation: formData.substation,
        eqptLocation: formData.eqptLocation,
        temperature: formData.temperature,
        manufacturer: formData.manufacturer,
        catalogNumber: formData.catalogNumber,
        serialNumber: formData.serialNumber,
        type: formData.type,
        systemVoltage: formData.systemVoltage,
        ratedVoltage: formData.ratedVoltage,
        ratedCurrent: formData.ratedCurrent,
        phaseConfiguration: formData.phaseConfiguration,
        testEquipment: formData.testEquipment,
        identifier: formData.identifier,
        userName: formData.userName,
        status: formData.status
      },
      visual_mechanical: {
        items: formData.visualInspectionItems
      },
      insulation_resistance: {
        tests: formData.insulationResistanceTests,
        correctedTests: formData.temperatureCorrectedTests
      },
      contact_resistance: {
        tests: formData.contactResistanceTests
      },
      comments: formData.comments
    };
    onSave(saveData);
  };

  return (
    <div className="report-container">
      {/* Header */}
      <div className="report-header">
        <h1 className="report-title">Panelboard Inspection & Test Report</h1>
        <div className="report-header-buttons">
          <button
            className={`status-button ${formData.status === 'PASS' ? 'pass' : 'fail'}`}
            onClick={() => isEditing && setField('status', formData.status === 'PASS' ? 'FAIL' : 'PASS')}
            disabled={!isEditing}
          >
            {formData.status}
          </button>
          <button className="save-button" onClick={handleSave}>
            Save Report
          </button>
        </div>
      </div>

      {/* Job Information */}
      <section className="report-section">
        <div className="section-divider"></div>
        <h2 className="section-title">Job Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="form-field">
            <label>Job #:</label>
            <input value={formData.jobNumber || ''} readOnly className="report-input bg-gray-100" />
          </div>
          <div className="form-field">
            <label>Customer:</label>
            <input value={formData.customerName || ''} readOnly className="report-input bg-gray-100" />
          </div>
          <div className="form-field">
            <label>Address:</label>
            <input value={formData.customerLocation || ''} readOnly className="report-input bg-gray-100" />
          </div>
          <div className="form-field">
            <label>Identifier:</label>
            <input value={formData.identifier || ''} onChange={e => setField('identifier', e.target.value)} readOnly={!isEditing} className="report-input" />
          </div>
          <div className="form-field">
            <label>Technicians:</label>
            <input value={formData.technicians || ''} onChange={e => setField('technicians', e.target.value)} readOnly={!isEditing} className="report-input" />
          </div>
          <div className="form-field">
            <label>Substation:</label>
            <input value={formData.substation || ''} onChange={e => setField('substation', e.target.value)} readOnly={!isEditing} className="report-input" />
          </div>
          <div className="form-field">
            <label>Eqpt. Location:</label>
            <input value={formData.eqptLocation || ''} onChange={e => setField('eqptLocation', e.target.value)} readOnly={!isEditing} className="report-input" />
          </div>
          <div className="form-field">
            <label>Date:</label>
            <input type="date" value={formData.date || ''} onChange={e => setField('date', e.target.value)} readOnly={!isEditing} className="report-input" />
          </div>
          <div className="form-field">
            <label>User:</label>
            <input value={formData.userName || ''} onChange={e => setField('userName', e.target.value)} readOnly={!isEditing} className="report-input" />
          </div>
          <div className="form-field">
            <label>Temp. °F:</label>
            <input type="number" value={formData.temperature?.fahrenheit ?? 68} onChange={e => handleFahrenheitChange(Number(e.target.value))} readOnly={!isEditing} className="report-input" style={{width: '80px'}} />
          </div>
          <div className="form-field">
            <label>°C:</label>
            <input type="number" value={formData.temperature?.celsius ?? 20} onChange={e => handleCelsiusChange(Number(e.target.value))} readOnly={!isEditing} className="report-input" style={{width: '80px'}} />
          </div>
          <div className="form-field">
            <label>TCF:</label>
            <input value={formData.temperature?.tcf ?? 1} readOnly className="report-input bg-gray-100" style={{width: '80px'}} />
          </div>
        </div>
      </section>

      {/* Nameplate Data */}
      <section className="report-section">
        <div className="section-divider"></div>
        <h2 className="section-title">Nameplate Data</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="form-field">
            <label>Manufacturer:</label>
            <input value={formData.manufacturer || ''} onChange={e => setField('manufacturer', e.target.value)} readOnly={!isEditing} className="report-input" />
          </div>
          <div className="form-field">
            <label>Catalog No.:</label>
            <input value={formData.catalogNumber || ''} onChange={e => setField('catalogNumber', e.target.value)} readOnly={!isEditing} className="report-input" />
          </div>
          <div className="form-field">
            <label>Serial Number:</label>
            <input value={formData.serialNumber || ''} onChange={e => setField('serialNumber', e.target.value)} readOnly={!isEditing} className="report-input" />
          </div>
          <div className="form-field">
            <label>Type:</label>
            <input value={formData.type || ''} onChange={e => setField('type', e.target.value)} readOnly={!isEditing} className="report-input" />
          </div>
          <div className="form-field">
            <label>System Voltage (V):</label>
            <input value={formData.systemVoltage || ''} onChange={e => setField('systemVoltage', e.target.value)} readOnly={!isEditing} className="report-input" />
          </div>
          <div className="form-field">
            <label>Rated Voltage (V):</label>
            <input value={formData.ratedVoltage || ''} onChange={e => setField('ratedVoltage', e.target.value)} readOnly={!isEditing} className="report-input" />
          </div>
          <div className="form-field">
            <label>Rated Current (A):</label>
            <input value={formData.ratedCurrent || ''} onChange={e => setField('ratedCurrent', e.target.value)} readOnly={!isEditing} className="report-input" />
          </div>
          <div className="form-field">
            <label>Phase Configuration:</label>
            <input value={formData.phaseConfiguration || ''} onChange={e => setField('phaseConfiguration', e.target.value)} readOnly={!isEditing} className="report-input" />
          </div>
        </div>
      </section>

      {/* Visual and Mechanical Inspection */}
      <section className="report-section">
        <div className="section-divider"></div>
        <h2 className="section-title">Visual and Mechanical Inspection</h2>
        <div className="table-container">
          <table className="report-table">
            <thead>
              <tr>
                <th style={{ width: '10%' }}>ID</th>
                <th style={{ width: '55%' }}>Description</th>
                <th style={{ width: '15%' }}>Result</th>
                <th style={{ width: '20%' }}>Comments</th>
              </tr>
            </thead>
            <tbody>
              {formData.visualInspectionItems.map((item, idx) => (
                <tr key={item.id || idx}>
                  <td className="text-center">{item.id}</td>
                  <td className="text-left">{item.description}</td>
                  <td>
                    <select
                      value={item.result || ''}
                      onChange={e => updateVisualInspection(idx, 'result', e.target.value)}
                      disabled={!isEditing}
                      className="report-input"
                    >
                      <option value="">Select One</option>
                      {VISUAL_INSPECTION_OPTIONS.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <input
                      value={item.comments || ''}
                      onChange={e => updateVisualInspection(idx, 'comments', e.target.value)}
                      readOnly={!isEditing}
                      className="report-input"
                    />
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
        <div className="flex flex-wrap gap-4 mb-4 items-center">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Test Voltage:</label>
            <select
              value={formData.insulationResistanceTests[0]?.testVoltage || ''}
              onChange={e => {
                const newTests = [...formData.insulationResistanceTests];
                if (newTests.length > 0) newTests[0].testVoltage = e.target.value;
                setFormData(prev => ({ ...prev, insulationResistanceTests: newTests }));
              }}
              disabled={!isEditing}
              className="report-input"
              style={{ width: 'auto' }}
            >
              <option value="">Select...</option>
              <option value="250V">250V</option>
              <option value="500V">500V</option>
              <option value="1000V">1000V</option>
              <option value="2500V">2500V</option>
              <option value="5000V">5000V</option>
            </select>
          </div>
        </div>
        <div className="table-container">
          <table className="report-table">
            <thead>
              <tr>
                <th colSpan={9} className="text-center">INSULATION RESISTANCE</th>
                <th>UNITS</th>
              </tr>
              <tr>
                <th>A-G</th>
                <th>B-G</th>
                <th>C-G</th>
                <th>A-B</th>
                <th>B-C</th>
                <th>C-A</th>
                <th>A-N</th>
                <th>B-N</th>
                <th>C-N</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr>
                {['ag', 'bg', 'cg', 'ab', 'bc', 'ca', 'an', 'bn', 'cn'].map(key => (
                  <td key={key}>
                    <input
                      value={formData.insulationResistanceTests[0]?.values?.[key as keyof InsulationValues] || ''}
                      onChange={e => updateInsulationValue(key, e.target.value)}
                      readOnly={!isEditing}
                      className="report-input text-center"
                    />
                  </td>
                ))}
                <td>
                  <select
                    value={formData.insulationResistanceTests[0]?.unit || 'MΩ'}
                    onChange={e => {
                      const newTests = [...formData.insulationResistanceTests];
                      if (newTests.length > 0) newTests[0].unit = e.target.value;
                      setFormData(prev => ({ ...prev, insulationResistanceTests: newTests }));
                    }}
                    disabled={!isEditing}
                    className="report-input"
                  >
                    {INSULATION_RESISTANCE_UNITS.map(u => (
                      <option key={u.symbol} value={u.symbol}>{u.symbol}</option>
                    ))}
                  </select>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Temperature Corrected Values */}
      <section className="report-section">
        <div className="section-divider"></div>
        <h2 className="section-title">Temperature Corrected Values</h2>
        <div className="table-container">
          <table className="report-table">
            <thead>
              <tr>
                <th colSpan={9} className="text-center">INSULATION RESISTANCE</th>
                <th>UNITS</th>
              </tr>
              <tr>
                <th>A-G</th>
                <th>B-G</th>
                <th>C-G</th>
                <th>A-B</th>
                <th>B-C</th>
                <th>C-A</th>
                <th>A-N</th>
                <th>B-N</th>
                <th>C-N</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr>
                {['ag', 'bg', 'cg', 'ab', 'bc', 'ca', 'an', 'bn', 'cn'].map(key => (
                  <td key={key}>
                    <input
                      value={calculateCorrectedValue(formData.insulationResistanceTests[0]?.values?.[key as keyof InsulationValues] || '')}
                      readOnly
                      className="report-input text-center bg-yellow-50"
                    />
                  </td>
                ))}
                <td>
                  <input
                    value={formData.insulationResistanceTests[0]?.unit || 'MΩ'}
                    readOnly
                    className="report-input text-center bg-gray-100"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Contact Resistance */}
      <section className="report-section">
        <div className="section-divider"></div>
        <h2 className="section-title">Contact Resistance</h2>
        <div className="flex flex-wrap gap-4 mb-4 items-center">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Test Amperage:</label>
            <select
              value={formData.contactResistanceTests[0]?.testVoltage || ''}
              onChange={e => {
                const newTests = [...formData.contactResistanceTests];
                if (newTests.length > 0) newTests[0].testVoltage = e.target.value;
                setFormData(prev => ({ ...prev, contactResistanceTests: newTests }));
              }}
              disabled={!isEditing}
              className="report-input"
              style={{ width: 'auto' }}
            >
              <option value="">Select...</option>
              <option value="100 mA">100 mA</option>
              <option value="1 A">1 A</option>
              <option value="10 A">10 A</option>
              <option value="100 A">100 A</option>
            </select>
          </div>
        </div>
        <div className="table-container">
          <table className="report-table">
            <thead>
              <tr>
                <th>A PHASE</th>
                <th>B PHASE</th>
                <th>C PHASE</th>
                <th>NEUTRAL</th>
                <th>GROUND</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr>
                {['aPhase', 'bPhase', 'cPhase', 'neutral', 'ground'].map(key => (
                  <td key={key}>
                    <input
                      value={formData.contactResistanceTests[0]?.values?.[key as keyof ContactValues] || ''}
                      onChange={e => updateContactValue(key, e.target.value)}
                      readOnly={!isEditing}
                      className="report-input text-center"
                    />
                  </td>
                ))}
                <td>
                  <select
                    value={formData.contactResistanceTests[0]?.unit || 'µΩ'}
                    onChange={e => {
                      const newTests = [...formData.contactResistanceTests];
                      if (newTests.length > 0) newTests[0].unit = e.target.value;
                      setFormData(prev => ({ ...prev, contactResistanceTests: newTests }));
                    }}
                    disabled={!isEditing}
                    className="report-input"
                  >
                    {CONTACT_RESISTANCE_UNITS.map(u => (
                      <option key={u.symbol} value={u.symbol}>{u.symbol}</option>
                    ))}
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="form-field">
            <label>Megohmmeter:</label>
            <input
              value={formData.testEquipment?.megohmmeter?.name || ''}
              onChange={e => setField('testEquipment.megohmmeter.name', e.target.value)}
              readOnly={!isEditing}
              className="report-input"
              placeholder="Equipment Name"
            />
          </div>
          <div className="form-field">
            <label>Serial Number:</label>
            <input
              value={formData.testEquipment?.megohmmeter?.serialNumber || ''}
              onChange={e => setField('testEquipment.megohmmeter.serialNumber', e.target.value)}
              readOnly={!isEditing}
              className="report-input"
            />
          </div>
          <div className="form-field">
            <label>AMP ID:</label>
            <input
              value={formData.testEquipment?.megohmmeter?.ampId || ''}
              onChange={e => setField('testEquipment.megohmmeter.ampId', e.target.value)}
              readOnly={!isEditing}
              className="report-input"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="form-field">
            <label>Low-Resistance Ohmmeter:</label>
            <input
              value={formData.testEquipment?.lowResistanceOhmmeter?.name || ''}
              onChange={e => setField('testEquipment.lowResistanceOhmmeter.name', e.target.value)}
              readOnly={!isEditing}
              className="report-input"
              placeholder="Equipment Name"
            />
          </div>
          <div className="form-field">
            <label>Serial Number:</label>
            <input
              value={formData.testEquipment?.lowResistanceOhmmeter?.serialNumber || ''}
              onChange={e => setField('testEquipment.lowResistanceOhmmeter.serialNumber', e.target.value)}
              readOnly={!isEditing}
              className="report-input"
            />
          </div>
          <div className="form-field">
            <label>AMP ID:</label>
            <input
              value={formData.testEquipment?.lowResistanceOhmmeter?.ampId || ''}
              onChange={e => setField('testEquipment.lowResistanceOhmmeter.ampId', e.target.value)}
              readOnly={!isEditing}
              className="report-input"
            />
          </div>
        </div>
      </section>

      {/* Comments */}
      <section className="report-section">
        <div className="section-divider"></div>
        <h2 className="section-title">Comments</h2>
        <textarea
          value={formData.comments || ''}
          onChange={e => setField('comments', e.target.value)}
          readOnly={!isEditing}
          className="report-input w-full"
          rows={6}
          placeholder="Enter any additional comments, observations, or notes..."
        />
      </section>
    </div>
  );
};

export default PanelboardReport;
