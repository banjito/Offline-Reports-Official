import React, { useState, useEffect } from 'react';
import './ReportStyles.css';

interface ReportProps {
  reportData: any;
  onSave?: (data: any) => void;
  job?: any;
}

// Temperature correction factor table
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

const visualInspectionResultOptions = ['', 'Satisfactory', 'Unsatisfactory', 'Cleaned', 'Adjusted', 'Repaired', 'Replaced', 'See Comments', 'N/A'];
const poleOptions = ['', '1', '2', '3'];

interface BreakerTestData {
  result?: 'PASS' | 'FAIL' | '';
  circuitNumber: string;
  poles: string;
  manuf: string;
  type: string;
  frameA: string;
  tripA: string;
  ratedCurrentA: string;
  testCurrentA: string;
  tripToleranceMin: string;
  tripToleranceMax: string;
  tripTime: string;
  insulationLL: string;
  insulationLP: string;
  insulationPP: string;
}

interface FormData {
  customer: string;
  address: string;
  user: string;
  date: string;
  jobNumber: string;
  technicians: string;
  substation: string;
  eqptLocation: string;
  identifier: string;
  temperature: {
    fahrenheit: number;
    celsius: number;
    tcf: number;
  };
  humidity: number;
  panelboardManufacturer: string;
  panelboardTypeCat: string;
  panelboardSizeA: string;
  panelboardVoltageV: string;
  panelboardSCCRkA: string;
  mainBreakerManufacturer: string;
  mainBreakerType: string;
  mainBreakerFrameSizeA: string;
  mainBreakerRatingPlugA: string;
  mainBreakerICRatingkA: string;
  visualInspectionItems: {
    netaSection: string;
    description: string;
    results: string;
    comments?: string;
  }[];
  megohmmeterName: string;
  megohmmeterSerial: string;
  megohmmeterAmpId: string;
  lowResistanceOhmmeterName: string;
  lowResistanceOhmmeterSerial: string;
  lowResistanceOhmmeterAmpId: string;
  primaryInjectionTestSetName: string;
  primaryInjectionTestSetSerial: string;
  primaryInjectionTestSetAmpId: string;
  comments: string;
  numberOfCircuitSpaces: string;
  electricalTestOrdering: string;
  tripCurveNumbers: string;
  breakers: BreakerTestData[];
  status: string;
}

const visualInspectionDefaults = [
  { netaSection: '7.6.1.2.A.1', description: 'Compare equipment nameplate data with drawings and specifications.', results: '' },
  { netaSection: '7.6.1.2.A.2', description: 'Inspect physical and mechanical condition.', results: '' },
  { netaSection: '7.6.1.2.A.3', description: 'Inspect anchorage and alignment [and grounding].', results: '' },
  { netaSection: '7.6.1.2.A.4', description: 'Verify that all maintenance devices are available for servicing and operating the breaker.', results: '' },
  { netaSection: '7.6.1.2.A.5', description: 'Verify the unit is clean.', results: '' },
  { netaSection: '7.6.1.2.A.6', description: 'Verify the arc chutes are intact. [For insulated-case/molded-case breakers, only perform if unsealed]', results: '' },
  { netaSection: '7.6.1.2.A.7', description: 'Inspect moving and stationary contacts for condition and alignment [For insulated-case/molded-case breakers, only perform if unsealed]', results: '' },
  { netaSection: '7.6.1.2.A.10.1', description: 'Use of a low-resistance ohmmeter in accordance with Section 7.6.1.2.B.1.', results: '' },
  { netaSection: '7.6.1.2.A.14', description: 'Perform adjustments for final protective device settings in accordance with coordination study provided by end user.', results: '' },
];

const initialBreakerData = (circuitNum: number): BreakerTestData => ({
  circuitNumber: circuitNum.toString(), result: '', poles: '1', manuf: '', type: '', frameA: '', tripA: '',
  ratedCurrentA: '', testCurrentA: '', tripToleranceMin: '', tripToleranceMax: '', tripTime: '',
  insulationLL: '', insulationLP: '', insulationPP: ''
});

const initialFormData: FormData = {
  customer: '',
  address: '',
  user: '',
  date: new Date().toISOString().split('T')[0],
  jobNumber: '',
  technicians: '',
  substation: '',
  eqptLocation: '',
  identifier: '',
  temperature: { fahrenheit: 68, celsius: 20, tcf: 1 },
  humidity: 0,
  panelboardManufacturer: '',
  panelboardTypeCat: '',
  panelboardSizeA: '',
  panelboardVoltageV: '',
  panelboardSCCRkA: '',
  mainBreakerManufacturer: '',
  mainBreakerType: '',
  mainBreakerFrameSizeA: '',
  mainBreakerRatingPlugA: '',
  mainBreakerICRatingkA: '',
  visualInspectionItems: visualInspectionDefaults,
  megohmmeterName: '',
  megohmmeterSerial: '',
  megohmmeterAmpId: '',
  lowResistanceOhmmeterName: '',
  lowResistanceOhmmeterSerial: '',
  lowResistanceOhmmeterAmpId: '',
  primaryInjectionTestSetName: '',
  primaryInjectionTestSetSerial: '',
  primaryInjectionTestSetAmpId: '',
  comments: 'Some items specific to switchgear draw-out breakers were removed from the above list.',
  numberOfCircuitSpaces: '42',
  electricalTestOrdering: 'Sequential',
  tripCurveNumbers: '',
  breakers: Array(42).fill(null).map((_, i) => initialBreakerData(i + 1)),
  status: 'PASS'
};

const LowVoltagePanelboardSmallBreakerReport: React.FC<ReportProps> = ({ reportData, onSave, job }) => {
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
    console.log('=== Loading Low Voltage Panelboard Small Breaker Report ===');
    console.log('Raw data:', data);

    // Handle multiple possible data structures
    const ri = data.report_info || data.reportInfo || data;
    const np = data.nameplate_data || data.nameplateData || ri.nameplateData || {};
    const vi = data.visual_mechanical_inspection || data.visualInspection || ri.visualInspection || {};
    const et = data.electrical_tests || data.electricalTests || ri.electricalTests || {};
    const te = data.test_equipment || data.testEquipment || ri.testEquipment || {};

    // Parse breakers
    let breakers = initialFormData.breakers;
    const breakerSource = et.breakers || data.breakers || ri.breakers;
    if (Array.isArray(breakerSource) && breakerSource.length > 0) {
      breakers = breakerSource.map((b: any, i: number) => ({
        ...initialBreakerData(i + 1),
        circuitNumber: b.circuitNumber || (i + 1).toString(),
        result: b.result || '',
        poles: b.poles || '1',
        manuf: b.manuf || '',
        type: b.type || '',
        frameA: b.frameA || '',
        tripA: b.tripA || '',
        ratedCurrentA: b.ratedCurrentA || '',
        testCurrentA: b.testCurrentA || '',
        tripToleranceMin: b.tripToleranceMin || '',
        tripToleranceMax: b.tripToleranceMax || '',
        tripTime: b.tripTime || '',
        insulationLL: b.insulationLL || '',
        insulationLP: b.insulationLP || '',
        insulationPP: b.insulationPP || ''
      }));
    }

    // Parse visual inspection
    let visualItems = visualInspectionDefaults.map(item => ({ ...item }));
    if (vi && typeof vi === 'object') {
      if (Array.isArray(vi)) {
        visualItems = vi.map((item: any, i: number) => ({
          netaSection: item.netaSection || visualInspectionDefaults[i]?.netaSection || '',
          description: item.description || visualInspectionDefaults[i]?.description || '',
          results: item.results || item.result || '',
          comments: item.comments || ''
        }));
      } else {
        // Object keyed by section
        visualItems = visualInspectionDefaults.map(item => ({
          ...item,
          results: vi[item.netaSection] || ''
        }));
      }
    }

    setFormData({
      ...initialFormData,
      customer: ri.customer || data.customer || '',
      address: ri.address || data.address || '',
      user: ri.user || ri.userName || data.user || '',
      date: ri.date || data.date || initialFormData.date,
      jobNumber: ri.jobNumber || data.jobNumber || '',
      technicians: ri.technicians || data.technicians || '',
      substation: ri.substation || data.substation || '',
      eqptLocation: ri.eqptLocation || data.eqptLocation || '',
      identifier: ri.identifier || data.identifier || '',
      temperature: ri.temperature || data.temperature || initialFormData.temperature,
      humidity: ri.humidity || data.humidity || 0,
      panelboardManufacturer: np.panelboardManufacturer || ri.panelboardManufacturer || '',
      panelboardTypeCat: np.panelboardTypeCatalog || np.panelboardTypeCat || ri.panelboardTypeCat || '',
      panelboardSizeA: np.panelboardSizeA || ri.panelboardSizeA || '',
      panelboardVoltageV: np.panelboardVoltageV || ri.panelboardVoltageV || '',
      panelboardSCCRkA: np.panelboardSCCRkA || ri.panelboardSCCRkA || '',
      mainBreakerManufacturer: np.mainBreakerManufacturer || ri.mainBreakerManufacturer || '',
      mainBreakerType: np.mainBreakerType || ri.mainBreakerType || '',
      mainBreakerFrameSizeA: np.mainBreakerFrameSizeA || ri.mainBreakerFrameSizeA || '',
      mainBreakerRatingPlugA: np.mainBreakerRatingPlugA || ri.mainBreakerRatingPlugA || '',
      mainBreakerICRatingkA: np.mainBreakerICRatingkA || ri.mainBreakerICRatingkA || '',
      visualInspectionItems: visualItems,
      megohmmeterName: te.megohmmeter?.name || ri.megohmmeterName || '',
      megohmmeterSerial: te.megohmmeter?.serialNumber || ri.megohmmeterSerial || '',
      megohmmeterAmpId: te.megohmmeter?.ampId || ri.megohmmeterAmpId || '',
      lowResistanceOhmmeterName: te.lowResistanceOhmmeter?.name || ri.lowResistanceOhmmeterName || '',
      lowResistanceOhmmeterSerial: te.lowResistanceOhmmeter?.serialNumber || ri.lowResistanceOhmmeterSerial || '',
      lowResistanceOhmmeterAmpId: te.lowResistanceOhmmeter?.ampId || ri.lowResistanceOhmmeterAmpId || '',
      primaryInjectionTestSetName: te.primaryInjectionTestSet?.name || ri.primaryInjectionTestSetName || '',
      primaryInjectionTestSetSerial: te.primaryInjectionTestSet?.serialNumber || ri.primaryInjectionTestSetSerial || '',
      primaryInjectionTestSetAmpId: te.primaryInjectionTestSet?.ampId || ri.primaryInjectionTestSetAmpId || '',
      comments: data.comments || data.comments_text || ri.comments || initialFormData.comments,
      numberOfCircuitSpaces: et.numberOfCircuitSpaces?.toString() || ri.numberOfCircuitSpaces?.toString() || '42',
      electricalTestOrdering: et.ordering || et.electricalTestOrdering || ri.electricalTestOrdering || 'Sequential',
      tripCurveNumbers: et.tripCurveNumbers || ri.tripCurveNumbers || '',
      breakers,
      status: ri.status || data.status || 'PASS'
    });
  };

  const handleSave = () => {
    if (onSave) {
      onSave({
        report_info: {
          customer: formData.customer,
          address: formData.address,
          user: formData.user,
          date: formData.date,
          jobNumber: formData.jobNumber,
          technicians: formData.technicians,
          substation: formData.substation,
          eqptLocation: formData.eqptLocation,
          identifier: formData.identifier,
          temperature: formData.temperature,
          humidity: formData.humidity,
          status: formData.status
        },
        nameplate_data: {
          panelboardManufacturer: formData.panelboardManufacturer,
          panelboardTypeCatalog: formData.panelboardTypeCat,
          panelboardSizeA: formData.panelboardSizeA,
          panelboardVoltageV: formData.panelboardVoltageV,
          panelboardSCCRkA: formData.panelboardSCCRkA,
          mainBreakerManufacturer: formData.mainBreakerManufacturer,
          mainBreakerType: formData.mainBreakerType,
          mainBreakerFrameSizeA: formData.mainBreakerFrameSizeA,
          mainBreakerRatingPlugA: formData.mainBreakerRatingPlugA,
          mainBreakerICRatingkA: formData.mainBreakerICRatingkA
        },
        visual_mechanical_inspection: formData.visualInspectionItems,
        electrical_tests: {
          numberOfCircuitSpaces: formData.numberOfCircuitSpaces,
          ordering: formData.electricalTestOrdering,
          tripCurveNumbers: formData.tripCurveNumbers,
          breakers: formData.breakers
        },
        test_equipment: {
          megohmmeter: { name: formData.megohmmeterName, serialNumber: formData.megohmmeterSerial, ampId: formData.megohmmeterAmpId },
          lowResistanceOhmmeter: { name: formData.lowResistanceOhmmeterName, serialNumber: formData.lowResistanceOhmmeterSerial, ampId: formData.lowResistanceOhmmeterAmpId },
          primaryInjectionTestSet: { name: formData.primaryInjectionTestSetName, serialNumber: formData.primaryInjectionTestSetSerial, ampId: formData.primaryInjectionTestSetAmpId }
        },
        comments: formData.comments
      });
    }
  };

  const handleTemperatureChange = (fahrenheit: number) => {
    const celsius = Math.round((fahrenheit - 32) * 5 / 9);
    const tcf = getTCF(celsius);
    setFormData(prev => ({
      ...prev,
      temperature: { fahrenheit, celsius, tcf }
    }));
  };

  const handleBreakerChange = (index: number, field: keyof BreakerTestData, value: string) => {
    setFormData(prev => {
      const newBreakers = [...prev.breakers];
      newBreakers[index] = { ...newBreakers[index], [field]: value };
      // Auto-calculate test current as 3x rated current
      if (field === 'ratedCurrentA') {
        const rated = parseFloat(value);
        if (!isNaN(rated)) {
          newBreakers[index].testCurrentA = (rated * 3).toString();
        }
      }
      return { ...prev, breakers: newBreakers };
    });
  };

  return (
    <div className="report-container">
      {/* Header */}
      <div className="report-header-bar">
        <h1 className="report-title">Low Voltage Panelboard Small Breaker Test Report</h1>
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
              <input type="number" className="report-input" style={{ width: '70px' }} value={formData.temperature.fahrenheit} onChange={e => handleTemperatureChange(parseFloat(e.target.value) || 68)} readOnly={!isEditing} />
              <span>°F</span>
              <span className="temp-celsius">{formData.temperature.celsius}°C</span>
              <span className="temp-label">TCF:</span>
              <span className="temp-value">{formData.temperature.tcf.toFixed(3)}</span>
            </div>
          </div>
          <div className="form-field">
            <label>Humidity (%)</label>
            <input type="number" className="report-input" style={{ width: '80px' }} value={formData.humidity} onChange={e => setFormData(prev => ({ ...prev, humidity: parseFloat(e.target.value) || 0 }))} readOnly={!isEditing} />
          </div>
        </div>
      </section>

      {/* Nameplate Data */}
      <section className="report-section">
        <div className="section-divider"></div>
        <h2 className="section-title">Nameplate Data</h2>
        <div className="form-grid-3">
          <div className="form-field">
            <label>Panelboard Manufacturer</label>
            <input type="text" className="report-input" value={formData.panelboardManufacturer} onChange={e => setFormData(prev => ({ ...prev, panelboardManufacturer: e.target.value }))} readOnly={!isEditing} />
          </div>
          <div className="form-field">
            <label>Panelboard Type/Cat</label>
            <input type="text" className="report-input" value={formData.panelboardTypeCat} onChange={e => setFormData(prev => ({ ...prev, panelboardTypeCat: e.target.value }))} readOnly={!isEditing} />
          </div>
          <div className="form-field">
            <label>Panelboard Size (A)</label>
            <input type="text" className="report-input" value={formData.panelboardSizeA} onChange={e => setFormData(prev => ({ ...prev, panelboardSizeA: e.target.value }))} readOnly={!isEditing} />
          </div>
          <div className="form-field">
            <label>Panelboard Voltage (V)</label>
            <input type="text" className="report-input" value={formData.panelboardVoltageV} onChange={e => setFormData(prev => ({ ...prev, panelboardVoltageV: e.target.value }))} readOnly={!isEditing} />
          </div>
          <div className="form-field">
            <label>Panelboard SCCR (kA)</label>
            <input type="text" className="report-input" value={formData.panelboardSCCRkA} onChange={e => setFormData(prev => ({ ...prev, panelboardSCCRkA: e.target.value }))} readOnly={!isEditing} />
          </div>
        </div>
        <h4 style={{ fontSize: '0.875rem', fontWeight: 600, margin: '16px 0 12px 0' }}>Main Breaker</h4>
        <div className="form-grid-3">
          <div className="form-field">
            <label>Manufacturer</label>
            <input type="text" className="report-input" value={formData.mainBreakerManufacturer} onChange={e => setFormData(prev => ({ ...prev, mainBreakerManufacturer: e.target.value }))} readOnly={!isEditing} />
          </div>
          <div className="form-field">
            <label>Type</label>
            <input type="text" className="report-input" value={formData.mainBreakerType} onChange={e => setFormData(prev => ({ ...prev, mainBreakerType: e.target.value }))} readOnly={!isEditing} />
          </div>
          <div className="form-field">
            <label>Frame Size (A)</label>
            <input type="text" className="report-input" value={formData.mainBreakerFrameSizeA} onChange={e => setFormData(prev => ({ ...prev, mainBreakerFrameSizeA: e.target.value }))} readOnly={!isEditing} />
          </div>
          <div className="form-field">
            <label>Rating Plug (A)</label>
            <input type="text" className="report-input" value={formData.mainBreakerRatingPlugA} onChange={e => setFormData(prev => ({ ...prev, mainBreakerRatingPlugA: e.target.value }))} readOnly={!isEditing} />
          </div>
          <div className="form-field">
            <label>IC Rating (kA)</label>
            <input type="text" className="report-input" value={formData.mainBreakerICRatingkA} onChange={e => setFormData(prev => ({ ...prev, mainBreakerICRatingkA: e.target.value }))} readOnly={!isEditing} />
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
              </tr>
            </thead>
            <tbody>
              {formData.visualInspectionItems.map((item, idx) => (
                <tr key={idx}>
                  <td>{item.netaSection}</td>
                  <td>{item.description}</td>
                  <td>
                    <select
                      value={item.results}
                      onChange={e => {
                        const newItems = [...formData.visualInspectionItems];
                        newItems[idx] = { ...newItems[idx], results: e.target.value };
                        setFormData(prev => ({ ...prev, visualInspectionItems: newItems }));
                      }}
                      disabled={!isEditing}
                    >
                      {visualInspectionResultOptions.map(opt => (
                        <option key={opt} value={opt}>{opt || 'Select...'}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Electrical Tests - Breaker Table */}
      <section className="report-section">
        <div className="section-divider"></div>
        <h2 className="section-title">Electrical Tests - Circuit Breakers</h2>
        
        <div className="form-grid-3" style={{ marginBottom: '16px' }}>
          <div className="form-field">
            <label>Number of Circuit Spaces</label>
            <input
              type="number"
              className="report-input"
              value={formData.numberOfCircuitSpaces}
              onChange={e => {
                const num = parseInt(e.target.value) || 0;
                const clamped = Math.min(Math.max(num, 0), 120);
                const newBreakers = Array(clamped).fill(null).map((_, i) => 
                  formData.breakers[i] || initialBreakerData(i + 1)
                );
                setFormData(prev => ({ ...prev, numberOfCircuitSpaces: clamped.toString(), breakers: newBreakers }));
              }}
              readOnly={!isEditing}
            />
          </div>
          <div className="form-field">
            <label>Test Ordering</label>
            <select
              className="report-input"
              value={formData.electricalTestOrdering}
              onChange={e => setFormData(prev => ({ ...prev, electricalTestOrdering: e.target.value }))}
              disabled={!isEditing}
            >
              <option>Sequential</option>
              <option>Other</option>
            </select>
          </div>
          <div className="form-field">
            <label>Trip Curve Numbers</label>
            <input type="text" className="report-input" value={formData.tripCurveNumbers} onChange={e => setFormData(prev => ({ ...prev, tripCurveNumbers: e.target.value }))} readOnly={!isEditing} />
          </div>
        </div>

        <div className="table-container" style={{ maxHeight: '600px', overflowY: 'auto' }}>
          <table className="report-table compact">
            <thead>
              <tr>
                <th style={{ width: '50px' }}>Ckt#</th>
                <th style={{ width: '60px' }}>Result</th>
                <th style={{ width: '50px' }}>Poles</th>
                <th>Manuf</th>
                <th>Type</th>
                <th>Frame (A)</th>
                <th>Trip (A)</th>
                <th>Rated (A)</th>
                <th>Test (A)</th>
                <th>Trip Min</th>
                <th>Trip Max</th>
                <th>Trip Time</th>
                <th>IR L-L</th>
                <th>IR L-P</th>
                <th>IR P-P</th>
              </tr>
            </thead>
            <tbody>
              {formData.breakers.map((breaker, idx) => (
                <tr key={idx}>
                  <td style={{ textAlign: 'center', fontWeight: 500 }}>{breaker.circuitNumber}</td>
                  <td>
                    <select
                      value={breaker.result}
                      onChange={e => handleBreakerChange(idx, 'result', e.target.value)}
                      disabled={!isEditing}
                      style={{ fontSize: '0.75rem', padding: '2px' }}
                    >
                      <option value=""></option>
                      <option value="PASS">PASS</option>
                      <option value="FAIL">FAIL</option>
                    </select>
                  </td>
                  <td>
                    <select
                      value={breaker.poles}
                      onChange={e => handleBreakerChange(idx, 'poles', e.target.value)}
                      disabled={!isEditing}
                      style={{ fontSize: '0.75rem', padding: '2px' }}
                    >
                      {poleOptions.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </td>
                  <td><input type="text" value={breaker.manuf} onChange={e => handleBreakerChange(idx, 'manuf', e.target.value)} readOnly={!isEditing} /></td>
                  <td><input type="text" value={breaker.type} onChange={e => handleBreakerChange(idx, 'type', e.target.value)} readOnly={!isEditing} /></td>
                  <td><input type="text" value={breaker.frameA} onChange={e => handleBreakerChange(idx, 'frameA', e.target.value)} readOnly={!isEditing} /></td>
                  <td><input type="text" value={breaker.tripA} onChange={e => handleBreakerChange(idx, 'tripA', e.target.value)} readOnly={!isEditing} /></td>
                  <td><input type="text" value={breaker.ratedCurrentA} onChange={e => handleBreakerChange(idx, 'ratedCurrentA', e.target.value)} readOnly={!isEditing} /></td>
                  <td><input type="text" value={breaker.testCurrentA} className="calculated" readOnly /></td>
                  <td><input type="text" value={breaker.tripToleranceMin} onChange={e => handleBreakerChange(idx, 'tripToleranceMin', e.target.value)} readOnly={!isEditing} /></td>
                  <td><input type="text" value={breaker.tripToleranceMax} onChange={e => handleBreakerChange(idx, 'tripToleranceMax', e.target.value)} readOnly={!isEditing} /></td>
                  <td><input type="text" value={breaker.tripTime} onChange={e => handleBreakerChange(idx, 'tripTime', e.target.value)} readOnly={!isEditing} /></td>
                  <td><input type="text" value={breaker.insulationLL} onChange={e => handleBreakerChange(idx, 'insulationLL', e.target.value)} readOnly={!isEditing} /></td>
                  <td><input type="text" value={breaker.insulationLP} onChange={e => handleBreakerChange(idx, 'insulationLP', e.target.value)} readOnly={!isEditing} /></td>
                  <td><input type="text" value={breaker.insulationPP} onChange={e => handleBreakerChange(idx, 'insulationPP', e.target.value)} readOnly={!isEditing} /></td>
                </tr>
              ))}
            </tbody>
          </table>
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
              <tr>
                <td style={{ fontWeight: 500 }}>Megohmmeter</td>
                <td><input type="text" value={formData.megohmmeterName} onChange={e => setFormData(prev => ({ ...prev, megohmmeterName: e.target.value }))} readOnly={!isEditing} /></td>
                <td><input type="text" value={formData.megohmmeterSerial} onChange={e => setFormData(prev => ({ ...prev, megohmmeterSerial: e.target.value }))} readOnly={!isEditing} /></td>
                <td><input type="text" value={formData.megohmmeterAmpId} onChange={e => setFormData(prev => ({ ...prev, megohmmeterAmpId: e.target.value }))} readOnly={!isEditing} /></td>
              </tr>
              <tr>
                <td style={{ fontWeight: 500 }}>Low Resistance Ohmmeter</td>
                <td><input type="text" value={formData.lowResistanceOhmmeterName} onChange={e => setFormData(prev => ({ ...prev, lowResistanceOhmmeterName: e.target.value }))} readOnly={!isEditing} /></td>
                <td><input type="text" value={formData.lowResistanceOhmmeterSerial} onChange={e => setFormData(prev => ({ ...prev, lowResistanceOhmmeterSerial: e.target.value }))} readOnly={!isEditing} /></td>
                <td><input type="text" value={formData.lowResistanceOhmmeterAmpId} onChange={e => setFormData(prev => ({ ...prev, lowResistanceOhmmeterAmpId: e.target.value }))} readOnly={!isEditing} /></td>
              </tr>
              <tr>
                <td style={{ fontWeight: 500 }}>Primary Injection Test Set</td>
                <td><input type="text" value={formData.primaryInjectionTestSetName} onChange={e => setFormData(prev => ({ ...prev, primaryInjectionTestSetName: e.target.value }))} readOnly={!isEditing} /></td>
                <td><input type="text" value={formData.primaryInjectionTestSetSerial} onChange={e => setFormData(prev => ({ ...prev, primaryInjectionTestSetSerial: e.target.value }))} readOnly={!isEditing} /></td>
                <td><input type="text" value={formData.primaryInjectionTestSetAmpId} onChange={e => setFormData(prev => ({ ...prev, primaryInjectionTestSetAmpId: e.target.value }))} readOnly={!isEditing} /></td>
              </tr>
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

export default LowVoltagePanelboardSmallBreakerReport;


