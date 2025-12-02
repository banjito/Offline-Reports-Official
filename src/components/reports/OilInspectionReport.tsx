import React, { useState, useEffect } from 'react';
import './ReportStyles.css';

interface ReportProps {
  reportData: any;
  onSave?: (data: any) => void;
  job?: any;
}

// Temperature conversion and TCF tables
const tcfTable: [number, number][] = [
  [-24, 0.054], [-23, 0.068], [-22, 0.082], [-21, 0.096], [-20, 0.11],
  [-19, 0.124], [-18, 0.138], [-17, 0.152], [-16, 0.166], [-15, 0.18],
  [-14, 0.194], [-13, 0.208], [-12, 0.222], [-11, 0.236], [-10, 0.25],
  [-9, 0.264], [-8, 0.278], [-7, 0.292], [-6, 0.306], [-5, 0.32],
  [-4, 0.336], [-3, 0.352], [-2, 0.368], [-1, 0.384], [0, 0.4],
  [1, 0.42], [2, 0.44], [3, 0.46], [4, 0.48], [5, 0.5],
  [6, 0.526], [7, 0.552], [8, 0.578], [9, 0.604], [10, 0.63],
  [11, 0.666], [12, 0.702], [13, 0.738], [14, 0.774], [15, 0.81],
  [16, 0.848], [17, 0.886], [18, 0.924], [19, 0.962], [20, 1.0],
  [21, 1.05], [22, 1.1], [23, 1.15], [24, 1.2], [25, 1.25],
  [26, 1.316], [27, 1.382], [28, 1.448], [29, 1.514], [30, 1.58],
  [31, 1.664], [32, 1.748], [33, 1.832], [34, 1.872], [35, 2.0],
  [36, 2.1], [37, 2.2], [38, 2.3], [39, 2.4], [40, 2.5]
];

const testVoltageOptions = ["250V", "500V", "1000V", "2500V", "5000V", "10000V"];
const VISUAL_INSPECTION_OPTIONS = ['Select One', 'Satisfactory', 'Unsatisfactory', 'Cleaned', 'See Comments', 'Not Applicable'];

// Visual inspection items based on web app
const visualInspectionItems = [
  { id: "7.2.1.2.A.1", description: "Inspect physical and mechanical condition." },
  { id: "7.2.1.2.A.2", description: "Inspect anchorage, alignment, and grounding." },
  { id: "7.2.1.2.A.3*", description: "Prior to cleaning the unit, perform as-found tests." },
  { id: "7.2.1.2.A.4", description: "Clean the unit." },
  { id: "7.2.1.2.A.5*", description: "Verify that control and alarm settings on temperature indicators are as specified." },
  { id: "7.2.1.2.A.6", description: "Verify that cooling fans operate correctly." },
  { id: "7.2.1.2.A.7", description: "Inspect bolted electrical connections for high resistance using a low-resistance ohmmeter" },
  { id: "7.2.1.2.A.8", description: "Perform specific inspections and mechanical tests as recommended by the manufacturer." },
  { id: "7.2.1.2.A.9", description: "Perform as-left tests." },
  { id: "7.2.1.2.A.10", description: "Verify that as-left tap connections are as specified." },
  { id: "7.2.1.2.A.11", description: "Verify the presence of surge arresters." }
];

interface InsulationTest {
  testVoltage: string;
  unit: string;
  readings: { halfMinute: string; oneMinute: string; tenMinute: string };
  corrected: { halfMinute: string; oneMinute: string; tenMinute: string };
  dielectricAbsorption: string;
  polarizationIndex: string;
}

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
  };
  nameplateData: {
    manufacturer: string;
    catalogNumber: string;
    serialNumber: string;
    kva: string;
    tempRise: string;
    impedance: string;
    primary: { volts: string; voltsSecondary: string; connection: string; material: string };
    secondary: { volts: string; voltsSecondary: string; connection: string; material: string };
    indicatorGauges: {
      oilLevel: string;
      tankPressure: string;
      oilTemperature: string;
      windingTemperature: string;
    };
  };
  visualInspection: { [key: string]: string };
  insulationResistance: {
    temperature: string;
    primaryToGround: InsulationTest;
    secondaryToGround: InsulationTest;
    primaryToSecondary: InsulationTest;
    dielectricAbsorptionAcceptable: string;
    polarizationIndexAcceptable: string;
  };
  testEquipment: {
    megohmmeter: { name: string; serialNumber: string; ampId: string };
    ttrTestSet: { name: string; serialNumber: string; ampId: string };
    windingResistanceTestSet: { name: string; serialNumber: string; ampId: string };
    excitationTestSet: { name: string; serialNumber: string; ampId: string };
    powerFactorTestSet: { name: string; serialNumber: string; ampId: string };
  };
  comments: string;
  status: string;
}

const defaultInsulationTest: InsulationTest = {
  testVoltage: "5000V",
  unit: "MΩ",
  readings: { halfMinute: "", oneMinute: "", tenMinute: "" },
  corrected: { halfMinute: "", oneMinute: "", tenMinute: "" },
  dielectricAbsorption: "",
  polarizationIndex: ""
};

const initialFormData: FormData = {
  customer: '',
  address: '',
  date: new Date().toISOString().split('T')[0],
  technicians: '',
  jobNumber: '',
  substation: '',
  eqptLocation: '',
  identifier: '',
  userName: '',
  temperature: { ambient: 72, celsius: 22, fahrenheit: 72, correctionFactor: 1.1 },
  nameplateData: {
    manufacturer: '',
    catalogNumber: '',
    serialNumber: '',
    kva: '',
    tempRise: '',
    impedance: '',
    primary: { volts: '', voltsSecondary: '', connection: 'Delta', material: 'Aluminum' },
    secondary: { volts: '', voltsSecondary: '', connection: 'Wye', material: 'Aluminum' },
    indicatorGauges: { oilLevel: '', tankPressure: '', oilTemperature: '', windingTemperature: '' }
  },
  visualInspection: {},
  insulationResistance: {
    temperature: '',
    primaryToGround: { ...defaultInsulationTest },
    secondaryToGround: { ...defaultInsulationTest, testVoltage: "1000V" },
    primaryToSecondary: { ...defaultInsulationTest },
    dielectricAbsorptionAcceptable: '',
    polarizationIndexAcceptable: ''
  },
  testEquipment: {
    megohmmeter: { name: '', serialNumber: '', ampId: '' },
    ttrTestSet: { name: '', serialNumber: '', ampId: '' },
    windingResistanceTestSet: { name: '', serialNumber: '', ampId: '' },
    excitationTestSet: { name: '', serialNumber: '', ampId: '' },
    powerFactorTestSet: { name: '', serialNumber: '', ampId: '' }
  },
  comments: '',
  status: 'PASS'
};

// Helper functions
const getTCF = (celsius: number): number => {
  const match = tcfTable.find(([c]) => c === celsius);
  return match ? match[1] : 1.0;
};

const calculateCorrectedValue = (readingStr: string, tcf: number): string => {
  if (typeof readingStr === 'string' && (readingStr.includes('>') || readingStr.includes('<'))) {
    return readingStr;
  }
  const readingNum = parseFloat(readingStr);
  if (isNaN(readingNum) || !isFinite(readingNum)) return '';
  return (readingNum * tcf).toFixed(2);
};

const calculateRatio = (numeratorStr: string, denominatorStr: string): string => {
  const numerator = parseFloat(numeratorStr);
  const denominator = parseFloat(denominatorStr);
  if (isNaN(numerator) || isNaN(denominator) || denominator === 0) return '';
  return (numerator / denominator).toFixed(2);
};

const OilInspectionReport: React.FC<ReportProps> = ({ reportData, onSave, job }) => {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [isEditing, setIsEditing] = useState(true);

  useEffect(() => {
    if (reportData) {
      loadFromProps(reportData);
    }
  }, [reportData]);

  useEffect(() => {
    if (job) {
      setFormData(prev => ({
        ...prev,
        customer: job.customer_name || job.customerName || prev.customer,
        address: job.site_address || job.address || prev.address,
        jobNumber: job.job_number || job.jobNumber || prev.jobNumber
      }));
    }
  }, [job]);

  const loadFromProps = (data: any) => {
    console.log('=== Loading Oil Inspection Report ===');
    console.log('Raw data:', data);

    // The web app stores data in separate columns:
    // report_info, nameplate_data, visual_inspection, insulation_resistance, test_equipment, etc.
    const ri = data.report_info || {};
    const np = data.nameplate_data || data.nameplateData || {};
    const vi = data.visual_inspection || data.visualInspection || {};
    const ir = data.insulation_resistance || data.insulationResistance || {};
    const te = data.test_equipment || data.testEquipment || {};

    console.log('Parsed sections:', { ri, np, vi, ir, te });

    setFormData({
      ...initialFormData,
      customer: ri.customer || data.customer || '',
      address: ri.address || data.address || '',
      date: ri.date || data.date || initialFormData.date,
      technicians: ri.technicians || data.technicians || '',
      jobNumber: ri.jobNumber || data.jobNumber || '',
      substation: ri.substation || data.substation || '',
      eqptLocation: ri.eqptLocation || data.eqptLocation || '',
      identifier: ri.identifier || data.identifier || '',
      userName: ri.userName || data.userName || '',
      temperature: ri.temperature || data.temperature || initialFormData.temperature,
      nameplateData: np && Object.keys(np).length > 0 ? {
        ...initialFormData.nameplateData,
        manufacturer: np.manufacturer || '',
        catalogNumber: np.catalogNumber || '',
        serialNumber: np.serialNumber || '',
        kva: np.kva || '',
        tempRise: np.tempRise || '',
        impedance: np.impedance || '',
        primary: np.primary || initialFormData.nameplateData.primary,
        secondary: np.secondary || initialFormData.nameplateData.secondary,
        indicatorGauges: np.indicatorGauges || initialFormData.nameplateData.indicatorGauges
      } : initialFormData.nameplateData,
      visualInspection: vi && Object.keys(vi).length > 0 ? vi : {},
      insulationResistance: ir && Object.keys(ir).length > 0 ? {
        ...initialFormData.insulationResistance,
        temperature: ir.temperature || '',
        primaryToGround: ir.primaryToGround || initialFormData.insulationResistance.primaryToGround,
        secondaryToGround: ir.secondaryToGround || initialFormData.insulationResistance.secondaryToGround,
        primaryToSecondary: ir.primaryToSecondary || initialFormData.insulationResistance.primaryToSecondary,
        dielectricAbsorptionAcceptable: ir.dielectricAbsorptionAcceptable || '',
        polarizationIndexAcceptable: ir.polarizationIndexAcceptable || ''
      } : initialFormData.insulationResistance,
      testEquipment: te && Object.keys(te).length > 0 ? te : initialFormData.testEquipment,
      comments: data.comments || ri.comments || '',
      status: ri.status || data.status || 'PASS'
    });
  };

  // Calculate corrected insulation resistance values
  useEffect(() => {
    const tcf = formData.temperature.correctionFactor;
    
    const updateTest = (test: InsulationTest): InsulationTest => {
      const corrected = {
        halfMinute: calculateCorrectedValue(test.readings.halfMinute, tcf),
        oneMinute: calculateCorrectedValue(test.readings.oneMinute, tcf),
        tenMinute: calculateCorrectedValue(test.readings.tenMinute, tcf)
      };
      const da = calculateRatio(corrected.oneMinute, corrected.halfMinute);
      const pi = calculateRatio(corrected.tenMinute, corrected.oneMinute);
      return { ...test, corrected, dielectricAbsorption: da, polarizationIndex: pi };
    };

    setFormData(prev => ({
      ...prev,
      insulationResistance: {
        ...prev.insulationResistance,
        primaryToGround: updateTest(prev.insulationResistance.primaryToGround),
        secondaryToGround: updateTest(prev.insulationResistance.secondaryToGround),
        primaryToSecondary: updateTest(prev.insulationResistance.primaryToSecondary)
      }
    }));
  }, [
    formData.insulationResistance.primaryToGround.readings,
    formData.insulationResistance.secondaryToGround.readings,
    formData.insulationResistance.primaryToSecondary.readings,
    formData.temperature.correctionFactor
  ]);

  const handleSave = () => {
    if (onSave) {
      // Save in the same format as web app - separate columns
      onSave({
        report_info: {
          customer: formData.customer,
          address: formData.address,
          date: formData.date,
          technicians: formData.technicians,
          jobNumber: formData.jobNumber,
          substation: formData.substation,
          eqptLocation: formData.eqptLocation,
          identifier: formData.identifier,
          userName: formData.userName,
          temperature: formData.temperature,
          status: formData.status
        },
        nameplate_data: formData.nameplateData,
        visual_inspection: formData.visualInspection,
        insulation_resistance: formData.insulationResistance,
        test_equipment: formData.testEquipment,
        comments: formData.comments
      });
    }
  };

  return (
    <div className="report-container">
      {/* Header */}
      <div className="report-header-bar">
        <h1 className="report-title">Oil Inspection Report</h1>
        <div className="report-actions">
          <button
            className={`status-btn ${formData.status === 'PASS' ? 'pass' : 'fail'}`}
            onClick={() => setFormData(prev => ({ ...prev, status: prev.status === 'PASS' ? 'FAIL' : 'PASS' }))}
          >
            {formData.status}
          </button>
          <button className="btn-save" onClick={handleSave}>Save Report</button>
        </div>
      </div>

      {/* Job Information */}
      <section className="report-section">
        <div className="section-divider"></div>
        <h2 className="section-title">Job Information</h2>
        <div className="form-grid-4">
          <div className="form-field">
            <label>Customer</label>
            <input type="text" className="report-input" value={formData.customer} onChange={e => setFormData(prev => ({ ...prev, customer: e.target.value }))} readOnly={!isEditing} />
          </div>
          <div className="form-field">
            <label>Address</label>
            <input type="text" className="report-input" value={formData.address} onChange={e => setFormData(prev => ({ ...prev, address: e.target.value }))} readOnly={!isEditing} />
          </div>
          <div className="form-field">
            <label>Job Number</label>
            <input type="text" className="report-input" value={formData.jobNumber} onChange={e => setFormData(prev => ({ ...prev, jobNumber: e.target.value }))} readOnly={!isEditing} />
          </div>
          <div className="form-field">
            <label>Date</label>
            <input type="date" className="report-input" value={formData.date} onChange={e => setFormData(prev => ({ ...prev, date: e.target.value }))} readOnly={!isEditing} />
          </div>
          <div className="form-field">
            <label>Technicians</label>
            <input type="text" className="report-input" value={formData.technicians} onChange={e => setFormData(prev => ({ ...prev, technicians: e.target.value }))} readOnly={!isEditing} />
          </div>
          <div className="form-field">
            <label>Identifier</label>
            <input type="text" className="report-input" value={formData.identifier} onChange={e => setFormData(prev => ({ ...prev, identifier: e.target.value }))} readOnly={!isEditing} />
          </div>
          <div className="form-field">
            <label>Substation</label>
            <input type="text" className="report-input" value={formData.substation} onChange={e => setFormData(prev => ({ ...prev, substation: e.target.value }))} readOnly={!isEditing} />
          </div>
          <div className="form-field">
            <label>Eqpt. Location</label>
            <input type="text" className="report-input" value={formData.eqptLocation} onChange={e => setFormData(prev => ({ ...prev, eqptLocation: e.target.value }))} readOnly={!isEditing} />
          </div>
        </div>
        <div className="form-grid-4" style={{ marginTop: '16px' }}>
          <div className="form-field temp-field">
            <label>Temperature:</label>
            <div className="temp-inputs">
              <input type="number" className="report-input" style={{ width: '70px' }} value={formData.temperature.fahrenheit} onChange={e => {
                const f = parseFloat(e.target.value) || 72;
                const c = Math.round((f - 32) * 5 / 9);
                const tcf = getTCF(c);
                setFormData(prev => ({ ...prev, temperature: { ambient: f, fahrenheit: f, celsius: c, correctionFactor: tcf } }));
              }} readOnly={!isEditing} />
              <span>°F</span>
              <span className="temp-celsius">{formData.temperature.celsius}°C</span>
              <span className="temp-label">TCF:</span>
              <span className="temp-value">{formData.temperature.correctionFactor.toFixed(3)}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Nameplate Data */}
      <section className="report-section">
        <div className="section-divider"></div>
        <h2 className="section-title">Nameplate Data</h2>
        <div className="form-grid-3">
          <div className="form-field">
            <label>Manufacturer</label>
            <input type="text" className="report-input" value={formData.nameplateData.manufacturer} onChange={e => setFormData(prev => ({ ...prev, nameplateData: { ...prev.nameplateData, manufacturer: e.target.value } }))} readOnly={!isEditing} />
          </div>
          <div className="form-field">
            <label>Catalog Number</label>
            <input type="text" className="report-input" value={formData.nameplateData.catalogNumber} onChange={e => setFormData(prev => ({ ...prev, nameplateData: { ...prev.nameplateData, catalogNumber: e.target.value } }))} readOnly={!isEditing} />
          </div>
          <div className="form-field">
            <label>Serial Number</label>
            <input type="text" className="report-input" value={formData.nameplateData.serialNumber} onChange={e => setFormData(prev => ({ ...prev, nameplateData: { ...prev.nameplateData, serialNumber: e.target.value } }))} readOnly={!isEditing} />
          </div>
          <div className="form-field">
            <label>KVA</label>
            <input type="text" className="report-input" value={formData.nameplateData.kva} onChange={e => setFormData(prev => ({ ...prev, nameplateData: { ...prev.nameplateData, kva: e.target.value } }))} readOnly={!isEditing} />
          </div>
          <div className="form-field">
            <label>Temp. Rise (°C)</label>
            <input type="text" className="report-input" value={formData.nameplateData.tempRise} onChange={e => setFormData(prev => ({ ...prev, nameplateData: { ...prev.nameplateData, tempRise: e.target.value } }))} readOnly={!isEditing} />
          </div>
          <div className="form-field">
            <label>Impedance (%)</label>
            <input type="text" className="report-input" value={formData.nameplateData.impedance} onChange={e => setFormData(prev => ({ ...prev, nameplateData: { ...prev.nameplateData, impedance: e.target.value } }))} readOnly={!isEditing} />
          </div>
        </div>

        {/* Primary/Secondary Voltages */}
        <div className="table-container" style={{ marginTop: '16px' }}>
          <table className="report-table">
            <thead>
              <tr>
                <th style={{ width: '100px' }}></th>
                <th>Volts</th>
                <th>Connection</th>
                <th>Winding Material</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ fontWeight: 600 }}>Primary</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                    <input type="text" value={formData.nameplateData.primary.volts} onChange={e => setFormData(prev => ({ ...prev, nameplateData: { ...prev.nameplateData, primary: { ...prev.nameplateData.primary, volts: e.target.value } } }))} style={{ width: '80px', textAlign: 'center' }} readOnly={!isEditing} />
                    <span>/</span>
                    <input type="text" value={formData.nameplateData.primary.voltsSecondary} onChange={e => setFormData(prev => ({ ...prev, nameplateData: { ...prev.nameplateData, primary: { ...prev.nameplateData.primary, voltsSecondary: e.target.value } } }))} style={{ width: '80px', textAlign: 'center' }} readOnly={!isEditing} />
                  </div>
                </td>
                <td>
                  <select value={formData.nameplateData.primary.connection} onChange={e => setFormData(prev => ({ ...prev, nameplateData: { ...prev.nameplateData, primary: { ...prev.nameplateData.primary, connection: e.target.value } } }))} disabled={!isEditing}>
                    <option>Delta</option>
                    <option>Wye</option>
                    <option>Single Phase</option>
                  </select>
                </td>
                <td>
                  <select value={formData.nameplateData.primary.material} onChange={e => setFormData(prev => ({ ...prev, nameplateData: { ...prev.nameplateData, primary: { ...prev.nameplateData.primary, material: e.target.value } } }))} disabled={!isEditing}>
                    <option>Aluminum</option>
                    <option>Copper</option>
                  </select>
                </td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600 }}>Secondary</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                    <input type="text" value={formData.nameplateData.secondary.volts} onChange={e => setFormData(prev => ({ ...prev, nameplateData: { ...prev.nameplateData, secondary: { ...prev.nameplateData.secondary, volts: e.target.value } } }))} style={{ width: '80px', textAlign: 'center' }} readOnly={!isEditing} />
                    <span>/</span>
                    <input type="text" value={formData.nameplateData.secondary.voltsSecondary} onChange={e => setFormData(prev => ({ ...prev, nameplateData: { ...prev.nameplateData, secondary: { ...prev.nameplateData.secondary, voltsSecondary: e.target.value } } }))} style={{ width: '80px', textAlign: 'center' }} readOnly={!isEditing} />
                  </div>
                </td>
                <td>
                  <select value={formData.nameplateData.secondary.connection} onChange={e => setFormData(prev => ({ ...prev, nameplateData: { ...prev.nameplateData, secondary: { ...prev.nameplateData.secondary, connection: e.target.value } } }))} disabled={!isEditing}>
                    <option>Delta</option>
                    <option>Wye</option>
                    <option>Single Phase</option>
                  </select>
                </td>
                <td>
                  <select value={formData.nameplateData.secondary.material} onChange={e => setFormData(prev => ({ ...prev, nameplateData: { ...prev.nameplateData, secondary: { ...prev.nameplateData.secondary, material: e.target.value } } }))} disabled={!isEditing}>
                    <option>Aluminum</option>
                    <option>Copper</option>
                  </select>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Indicator Gauges */}
        <div style={{ marginTop: '16px' }}>
          <h4 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '12px' }}>Indicator/Gauge Values</h4>
          <div className="form-grid-4">
            <div className="form-field">
              <label>Oil Level</label>
              <input type="text" className="report-input" value={formData.nameplateData.indicatorGauges.oilLevel} onChange={e => setFormData(prev => ({ ...prev, nameplateData: { ...prev.nameplateData, indicatorGauges: { ...prev.nameplateData.indicatorGauges, oilLevel: e.target.value } } }))} readOnly={!isEditing} />
            </div>
            <div className="form-field">
              <label>Tank Pressure</label>
              <input type="text" className="report-input" value={formData.nameplateData.indicatorGauges.tankPressure} onChange={e => setFormData(prev => ({ ...prev, nameplateData: { ...prev.nameplateData, indicatorGauges: { ...prev.nameplateData.indicatorGauges, tankPressure: e.target.value } } }))} readOnly={!isEditing} />
            </div>
            <div className="form-field">
              <label>Oil Temperature</label>
              <input type="text" className="report-input" value={formData.nameplateData.indicatorGauges.oilTemperature} onChange={e => setFormData(prev => ({ ...prev, nameplateData: { ...prev.nameplateData, indicatorGauges: { ...prev.nameplateData.indicatorGauges, oilTemperature: e.target.value } } }))} readOnly={!isEditing} />
            </div>
            <div className="form-field">
              <label>Winding Temperature</label>
              <input type="text" className="report-input" value={formData.nameplateData.indicatorGauges.windingTemperature} onChange={e => setFormData(prev => ({ ...prev, nameplateData: { ...prev.nameplateData, indicatorGauges: { ...prev.nameplateData.indicatorGauges, windingTemperature: e.target.value } } }))} readOnly={!isEditing} />
            </div>
          </div>
        </div>
      </section>

      {/* Visual and Mechanical Inspection */}
      <section className="report-section">
        <div className="section-divider"></div>
        <h2 className="section-title">Visual and Mechanical Inspection</h2>
        <div className="table-container">
          <table className="report-table neta-table">
            <thead>
              <tr>
                <th style={{ width: '120px' }}>Section</th>
                <th>Description</th>
                <th style={{ width: '150px' }}>Result</th>
                <th>Comments</th>
              </tr>
            </thead>
            <tbody>
              {visualInspectionItems.map(item => (
                <tr key={item.id}>
                  <td>{item.id}</td>
                  <td>{item.description}</td>
                  <td>
                    <select
                      value={formData.visualInspection[item.id] || 'Select One'}
                      onChange={e => setFormData(prev => ({ ...prev, visualInspection: { ...prev.visualInspection, [item.id]: e.target.value } }))}
                      disabled={!isEditing}
                    >
                      {VISUAL_INSPECTION_OPTIONS.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <input
                      type="text"
                      value={formData.visualInspection[`${item.id}_comments`] || ''}
                      onChange={e => setFormData(prev => ({ ...prev, visualInspection: { ...prev.visualInspection, [`${item.id}_comments`]: e.target.value } }))}
                      placeholder="Comments..."
                      readOnly={!isEditing}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Insulation Resistance Tests */}
      <section className="report-section">
        <div className="section-divider"></div>
        <h2 className="section-title">Electrical Tests - Insulation Resistance</h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          {/* Measured Values */}
          <div>
            <h4 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '12px', textAlign: 'center' }}>Insulation Resistance Values</h4>
            <table className="report-table ir-table">
              <thead>
                <tr>
                  <th>Test</th>
                  <th>kV</th>
                  <th>0.5 Min</th>
                  <th>1 Min</th>
                  <th>10 Min</th>
                  <th>Unit</th>
                </tr>
              </thead>
              <tbody>
                {(['primaryToGround', 'secondaryToGround', 'primaryToSecondary'] as const).map(testId => {
                  const test = formData.insulationResistance[testId];
                  const label = testId === 'primaryToGround' ? 'Pri-Gnd' :
                               testId === 'secondaryToGround' ? 'Sec-Gnd' : 'Pri-Sec';
                  return (
                    <tr key={testId}>
                      <td style={{ fontWeight: 500 }}>{label}</td>
                      <td>
                        <select value={test.testVoltage} onChange={e => setFormData(prev => ({ ...prev, insulationResistance: { ...prev.insulationResistance, [testId]: { ...test, testVoltage: e.target.value } } }))} disabled={!isEditing}>
                          {testVoltageOptions.map(v => <option key={v}>{v}</option>)}
                        </select>
                      </td>
                      <td>
                        <input type="text" value={test.readings.halfMinute} onChange={e => setFormData(prev => ({ ...prev, insulationResistance: { ...prev.insulationResistance, [testId]: { ...test, readings: { ...test.readings, halfMinute: e.target.value } } } }))} className="text-center" readOnly={!isEditing} />
                      </td>
                      <td>
                        <input type="text" value={test.readings.oneMinute} onChange={e => setFormData(prev => ({ ...prev, insulationResistance: { ...prev.insulationResistance, [testId]: { ...test, readings: { ...test.readings, oneMinute: e.target.value } } } }))} className="text-center" readOnly={!isEditing} />
                      </td>
                      <td>
                        <input type="text" value={test.readings.tenMinute} onChange={e => setFormData(prev => ({ ...prev, insulationResistance: { ...prev.insulationResistance, [testId]: { ...test, readings: { ...test.readings, tenMinute: e.target.value } } } }))} className="text-center" readOnly={!isEditing} />
                      </td>
                      <td>
                        <select value={test.unit} onChange={e => setFormData(prev => ({ ...prev, insulationResistance: { ...prev.insulationResistance, [testId]: { ...test, unit: e.target.value } } }))} disabled={!isEditing}>
                          <option>kΩ</option>
                          <option>MΩ</option>
                          <option>GΩ</option>
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Temperature Corrected Values */}
          <div>
            <h4 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '12px', textAlign: 'center' }}>Temperature Corrected Values</h4>
            <table className="report-table ir-table">
              <thead>
                <tr>
                  <th>0.5 Min</th>
                  <th>1 Min</th>
                  <th>10 Min</th>
                  <th>DA</th>
                  <th>PI</th>
                </tr>
              </thead>
              <tbody>
                {(['primaryToGround', 'secondaryToGround', 'primaryToSecondary'] as const).map(testId => {
                  const test = formData.insulationResistance[testId];
                  return (
                    <tr key={`${testId}-corr`} className="corrected-row">
                      <td><input type="text" value={test.corrected.halfMinute} className="text-center calculated" readOnly /></td>
                      <td><input type="text" value={test.corrected.oneMinute} className="text-center calculated" readOnly /></td>
                      <td><input type="text" value={test.corrected.tenMinute} className="text-center calculated" readOnly /></td>
                      <td><input type="text" value={test.dielectricAbsorption} className="text-center calculated" readOnly /></td>
                      <td><input type="text" value={test.polarizationIndex} className="text-center calculated" readOnly /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Test Equipment */}
      <section className="report-section">
        <div className="section-divider"></div>
        <h2 className="section-title">Test Equipment Used</h2>
        <div className="table-container">
          <table className="report-table">
            <thead>
              <tr>
                <th style={{ width: '200px' }}>Equipment</th>
                <th>Name</th>
                <th>Serial Number</th>
                <th>AMP ID</th>
              </tr>
            </thead>
            <tbody>
              {(['megohmmeter', 'ttrTestSet', 'windingResistanceTestSet', 'excitationTestSet', 'powerFactorTestSet'] as const).map(eqId => {
                const eq = formData.testEquipment[eqId];
                const label = eqId === 'megohmmeter' ? 'Megohmmeter' :
                             eqId === 'ttrTestSet' ? 'TTR Test Set' :
                             eqId === 'windingResistanceTestSet' ? 'Winding Resistance Test Set' :
                             eqId === 'excitationTestSet' ? 'Excitation Test Set' : 'Power Factor Test Set';
                return (
                  <tr key={eqId}>
                    <td style={{ fontWeight: 500 }}>{label}</td>
                    <td><input type="text" value={eq.name} onChange={e => setFormData(prev => ({ ...prev, testEquipment: { ...prev.testEquipment, [eqId]: { ...eq, name: e.target.value } } }))} readOnly={!isEditing} /></td>
                    <td><input type="text" value={eq.serialNumber} onChange={e => setFormData(prev => ({ ...prev, testEquipment: { ...prev.testEquipment, [eqId]: { ...eq, serialNumber: e.target.value } } }))} readOnly={!isEditing} /></td>
                    <td><input type="text" value={eq.ampId} onChange={e => setFormData(prev => ({ ...prev, testEquipment: { ...prev.testEquipment, [eqId]: { ...eq, ampId: e.target.value } } }))} readOnly={!isEditing} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Comments */}
      <section className="report-section">
        <div className="section-divider"></div>
        <h2 className="section-title">Comments</h2>
        <textarea
          className="report-textarea"
          value={formData.comments}
          onChange={e => setFormData(prev => ({ ...prev, comments: e.target.value }))}
          readOnly={!isEditing}
          placeholder="Enter any additional comments..."
        />
      </section>
    </div>
  );
};

export default OilInspectionReport;
