import React, { useState, useEffect } from 'react';
import './ReportStyles.css';

interface ReportProps {
  reportData: any;
  onSave?: (data: any) => void;
  job?: any;
}

// Visual inspection items based on web app
const visualInspectionItems = [
  { id: '7.5.1.1.A.1', description: 'Inspect physical and mechanical condition.' },
  { id: '7.5.1.1.A.2', description: 'Inspect anchorage, alignment, grounding, and required clearances.' },
  { id: '7.5.1.1.A.3', description: 'Before cleaning the unit, perform as-found tests if required.' },
  { id: '7.5.1.1.A.4', description: 'Verify the unit is clean.' },
  { id: '7.5.1.1.A.5', description: 'Verify blade alignment, blade penetration, travel stops, and mechanical operation.' },
  { id: '7.5.1.1.A.6', description: 'Verify fuse sizes and types match drawings, short-circuit studies, and coordination study.' },
  { id: '7.5.1.1.A.7.1', description: 'Verify each fuse has adequate mechanical support and contact integrity.' },
  { id: '7.5.1.1.A.9.1', description: 'Inspect bolted electrical connections with a low-resistance ohmmeter. Verify interlock operation and sequencing.' },
  { id: '7.5.1.1.A.10.1', description: 'Verify correct phase barrier installation.' },
  { id: '7.5.1.1.A.11.1', description: 'Verify correct operation of all indicating and control devices.' },
  { id: '7.5.1.1.A.13', description: 'Apply appropriate lubrication on moving current‑carrying parts and sliding surfaces. Perform as-left tests.' }
];

const TEST_VOLTAGE_OPTIONS = ['250V', '500V', '1000V', '2500V', '5000V'];
const VISUAL_INSPECTION_OPTIONS = ['', 'Satisfactory', 'Unsatisfactory', 'Cleaned', 'See Comments', 'Not Applicable'];

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
    humidity: number;
  };
  deviceData: {
    manufacturer: string;
    catalogNumber: string;
    serialNumber: string;
    systemVoltage: string;
    type: string;
    icRating: string;
    ratedVoltage: string;
    phaseConfig: string;
  };
  fuseData: {
    manufacturer: string;
    class: string;
    icRating: string;
    catalogNumber: string;
    ampacity: string;
    voltageRating: string;
  };
  visualMechanicalInspection: { [key: string]: string };
  insulationResistance: {
    testVoltage: string;
    pole1: { poleToPole: string; poleToFrame: string; lineToLoad: string; poleToN1: string };
    pole2: { poleToPole: string; poleToFrame: string; lineToLoad: string; poleToN1: string };
    pole3: { poleToPole: string; poleToFrame: string; lineToLoad: string; poleToN1: string };
  };
  poleResistance: {
    p1AsFound: string; p1AsLeft: string;
    p2AsFound: string; p2AsLeft: string;
    p3AsFound: string; p3AsLeft: string;
    nAsFound: string; nAsLeft: string;
    switchAsFound: string; switchAsLeft: string;
    fuseSwitchAsFound: string; fuseSwitchAsLeft: string;
  };
  poleResistanceDevices: {
    switch: { p1AsFound: string; p1AsLeft: string; p2AsFound: string; p2AsLeft: string; p3AsFound: string; p3AsLeft: string; nAsFound: string; nAsLeft: string };
    fuse: { p1AsFound: string; p1AsLeft: string; p2AsFound: string; p2AsLeft: string; p3AsFound: string; p3AsLeft: string; nAsFound: string; nAsLeft: string };
    switchFuse: { p1AsFound: string; p1AsLeft: string; p2AsFound: string; p2AsLeft: string; p3AsFound: string; p3AsLeft: string; nAsFound: string; nAsLeft: string };
  };
  comments: string;
  status: string;
}

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
  temperature: { fahrenheit: 68, celsius: 20, tcf: 1, humidity: 50 },
  deviceData: {
    manufacturer: '', catalogNumber: '', serialNumber: '', systemVoltage: '',
    type: '', icRating: '', ratedVoltage: '', phaseConfig: ''
  },
  fuseData: {
    manufacturer: '', class: '', icRating: '', catalogNumber: '', ampacity: '', voltageRating: ''
  },
  visualMechanicalInspection: {},
  insulationResistance: {
    testVoltage: '1000V',
    pole1: { poleToPole: '', poleToFrame: '', lineToLoad: '', poleToN1: '' },
    pole2: { poleToPole: '', poleToFrame: '', lineToLoad: '', poleToN1: '' },
    pole3: { poleToPole: '', poleToFrame: '', lineToLoad: '', poleToN1: '' }
  },
  poleResistance: {
    p1AsFound: '', p1AsLeft: '', p2AsFound: '', p2AsLeft: '', p3AsFound: '', p3AsLeft: '',
    nAsFound: '', nAsLeft: '', switchAsFound: '', switchAsLeft: '', fuseSwitchAsFound: '', fuseSwitchAsLeft: ''
  },
  poleResistanceDevices: {
    switch: { p1AsFound: '', p1AsLeft: '', p2AsFound: '', p2AsLeft: '', p3AsFound: '', p3AsLeft: '', nAsFound: '', nAsLeft: '' },
    fuse: { p1AsFound: '', p1AsLeft: '', p2AsFound: '', p2AsLeft: '', p3AsFound: '', p3AsLeft: '', nAsFound: '', nAsLeft: '' },
    switchFuse: { p1AsFound: '', p1AsLeft: '', p2AsFound: '', p2AsLeft: '', p3AsFound: '', p3AsLeft: '', nAsFound: '', nAsLeft: '' }
  },
  comments: '',
  status: 'PASS'
};

const LowVoltageSwitchMaintMTSReport: React.FC<ReportProps> = ({ reportData, onSave, job }) => {
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
    console.log('=== Loading Low Voltage Switch Maint MTS Report ===');
    console.log('Raw data:', data);

    // The web app stores everything in report_info as a flat structure
    // When synced down, it should be flattened from report_info
    const ri = data.report_info || data;
    
    console.log('Parsed report_info:', ri);

    setFormData({
      ...initialFormData,
      customer: ri.customer || '',
      address: ri.address || '',
      user: ri.user || '',
      date: ri.date || initialFormData.date,
      jobNumber: ri.jobNumber || '',
      technicians: ri.technicians || '',
      substation: ri.substation || '',
      eqptLocation: ri.eqptLocation || '',
      identifier: ri.identifier || '',
      temperature: ri.temperature || initialFormData.temperature,
      deviceData: ri.deviceData || initialFormData.deviceData,
      fuseData: ri.fuseData || initialFormData.fuseData,
      visualMechanicalInspection: ri.visualMechanicalInspection || {},
      insulationResistance: ri.insulationResistance || initialFormData.insulationResistance,
      poleResistance: ri.poleResistance || initialFormData.poleResistance,
      poleResistanceDevices: ri.poleResistanceDevices || initialFormData.poleResistanceDevices,
      comments: ri.comments || '',
      status: ri.status || 'PASS'
    });
  };

  const handleSave = () => {
    if (onSave) {
      // Save in the same format as web app - everything in report_info
      onSave({
        report_info: {
          ...formData,
          status: formData.status
        }
      });
    }
  };

  return (
    <div className="report-container">
      {/* Header */}
      <div className="report-header-bar">
        <h1 className="report-title">6-Low Voltage Switch Maintenance Test MTS</h1>
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
      </section>

      {/* Device Data */}
      <section className="report-section">
        <div className="section-divider"></div>
        <h2 className="section-title">Device Data</h2>
        <div className="form-grid-4">
          <div className="form-field">
            <label>Manufacturer</label>
            <input type="text" className="report-input" value={formData.deviceData.manufacturer} onChange={e => setFormData(prev => ({ ...prev, deviceData: { ...prev.deviceData, manufacturer: e.target.value } }))} readOnly={!isEditing} />
          </div>
          <div className="form-field">
            <label>Catalog Number</label>
            <input type="text" className="report-input" value={formData.deviceData.catalogNumber} onChange={e => setFormData(prev => ({ ...prev, deviceData: { ...prev.deviceData, catalogNumber: e.target.value } }))} readOnly={!isEditing} />
          </div>
          <div className="form-field">
            <label>Serial Number</label>
            <input type="text" className="report-input" value={formData.deviceData.serialNumber} onChange={e => setFormData(prev => ({ ...prev, deviceData: { ...prev.deviceData, serialNumber: e.target.value } }))} readOnly={!isEditing} />
          </div>
          <div className="form-field">
            <label>System Voltage</label>
            <input type="text" className="report-input" value={formData.deviceData.systemVoltage} onChange={e => setFormData(prev => ({ ...prev, deviceData: { ...prev.deviceData, systemVoltage: e.target.value } }))} readOnly={!isEditing} />
          </div>
          <div className="form-field">
            <label>Type</label>
            <input type="text" className="report-input" value={formData.deviceData.type} onChange={e => setFormData(prev => ({ ...prev, deviceData: { ...prev.deviceData, type: e.target.value } }))} readOnly={!isEditing} />
          </div>
          <div className="form-field">
            <label>IC Rating</label>
            <input type="text" className="report-input" value={formData.deviceData.icRating} onChange={e => setFormData(prev => ({ ...prev, deviceData: { ...prev.deviceData, icRating: e.target.value } }))} readOnly={!isEditing} />
          </div>
          <div className="form-field">
            <label>Rated Voltage</label>
            <input type="text" className="report-input" value={formData.deviceData.ratedVoltage} onChange={e => setFormData(prev => ({ ...prev, deviceData: { ...prev.deviceData, ratedVoltage: e.target.value } }))} readOnly={!isEditing} />
          </div>
          <div className="form-field">
            <label>Phase Config</label>
            <input type="text" className="report-input" value={formData.deviceData.phaseConfig} onChange={e => setFormData(prev => ({ ...prev, deviceData: { ...prev.deviceData, phaseConfig: e.target.value } }))} readOnly={!isEditing} />
          </div>
        </div>
      </section>

      {/* Fuse Data */}
      <section className="report-section">
        <div className="section-divider"></div>
        <h2 className="section-title">Fuse Data</h2>
        <div className="form-grid-3">
          <div className="form-field">
            <label>Manufacturer</label>
            <input type="text" className="report-input" value={formData.fuseData.manufacturer} onChange={e => setFormData(prev => ({ ...prev, fuseData: { ...prev.fuseData, manufacturer: e.target.value } }))} readOnly={!isEditing} />
          </div>
          <div className="form-field">
            <label>Class</label>
            <input type="text" className="report-input" value={formData.fuseData.class} onChange={e => setFormData(prev => ({ ...prev, fuseData: { ...prev.fuseData, class: e.target.value } }))} readOnly={!isEditing} />
          </div>
          <div className="form-field">
            <label>IC Rating</label>
            <input type="text" className="report-input" value={formData.fuseData.icRating} onChange={e => setFormData(prev => ({ ...prev, fuseData: { ...prev.fuseData, icRating: e.target.value } }))} readOnly={!isEditing} />
          </div>
          <div className="form-field">
            <label>Catalog Number</label>
            <input type="text" className="report-input" value={formData.fuseData.catalogNumber} onChange={e => setFormData(prev => ({ ...prev, fuseData: { ...prev.fuseData, catalogNumber: e.target.value } }))} readOnly={!isEditing} />
          </div>
          <div className="form-field">
            <label>Ampacity</label>
            <input type="text" className="report-input" value={formData.fuseData.ampacity} onChange={e => setFormData(prev => ({ ...prev, fuseData: { ...prev.fuseData, ampacity: e.target.value } }))} readOnly={!isEditing} />
          </div>
          <div className="form-field">
            <label>Voltage Rating</label>
            <input type="text" className="report-input" value={formData.fuseData.voltageRating} onChange={e => setFormData(prev => ({ ...prev, fuseData: { ...prev.fuseData, voltageRating: e.target.value } }))} readOnly={!isEditing} />
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
                <th style={{ width: '120px' }}>Section</th>
                <th>Description</th>
                <th style={{ width: '150px' }}>Result</th>
              </tr>
            </thead>
            <tbody>
              {visualInspectionItems.map(item => (
                <tr key={item.id}>
                  <td style={{ fontWeight: 500, color: '#1e40af' }}>{item.id}</td>
                  <td>{item.description}</td>
                  <td>
                    <select
                      value={formData.visualMechanicalInspection[item.id] || ''}
                      onChange={e => setFormData(prev => ({ 
                        ...prev, 
                        visualMechanicalInspection: { 
                          ...prev.visualMechanicalInspection, 
                          [item.id]: e.target.value 
                        } 
                      }))}
                      disabled={!isEditing}
                    >
                      {VISUAL_INSPECTION_OPTIONS.map(opt => (
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

      {/* Insulation Resistance Tests */}
      <section className="report-section">
        <div className="section-divider"></div>
        <h2 className="section-title">Electrical Tests - Insulation Resistance</h2>
        
        <div className="test-voltage-row">
          <label>Test Voltage:</label>
          <select
            className="report-input"
            style={{ width: '120px' }}
            value={formData.insulationResistance.testVoltage}
            onChange={e => setFormData(prev => ({ 
              ...prev, 
              insulationResistance: { ...prev.insulationResistance, testVoltage: e.target.value } 
            }))}
            disabled={!isEditing}
          >
            {TEST_VOLTAGE_OPTIONS.map(v => <option key={v}>{v}</option>)}
          </select>
        </div>

        <div className="table-container">
          <table className="report-table ir-table">
            <thead>
              <tr>
                <th style={{ width: '100px' }}>Pole</th>
                <th>Pole to Pole (MΩ)</th>
                <th>Pole to Frame (MΩ)</th>
                <th>Line to Load (MΩ)</th>
                <th>Pole to N1 (MΩ)</th>
              </tr>
            </thead>
            <tbody>
              {(['pole1', 'pole2', 'pole3'] as const).map((pole, idx) => (
                <tr key={pole}>
                  <td style={{ fontWeight: 600, backgroundColor: '#f9fafb' }}>Pole {idx + 1}</td>
                  {(['poleToPole', 'poleToFrame', 'lineToLoad', 'poleToN1'] as const).map(field => (
                    <td key={field}>
                      <input
                        type="text"
                        value={formData.insulationResistance[pole][field]}
                        onChange={e => setFormData(prev => ({
                          ...prev,
                          insulationResistance: {
                            ...prev.insulationResistance,
                            [pole]: { ...prev.insulationResistance[pole], [field]: e.target.value }
                          }
                        }))}
                        className="text-center"
                        readOnly={!isEditing}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Pole Resistance */}
      <section className="report-section">
        <div className="section-divider"></div>
        <h2 className="section-title">Electrical Tests - Pole Resistance (μΩ)</h2>
        
        <div className="table-container">
          <table className="report-table contact-table">
            <thead>
              <tr>
                <th style={{ width: '120px' }}>Device</th>
                <th colSpan={2}>P1</th>
                <th colSpan={2}>P2</th>
                <th colSpan={2}>P3</th>
                <th colSpan={2}>N</th>
              </tr>
              <tr className="sub-header">
                <th></th>
                <th>As Found</th>
                <th>As Left</th>
                <th>As Found</th>
                <th>As Left</th>
                <th>As Found</th>
                <th>As Left</th>
                <th>As Found</th>
                <th>As Left</th>
              </tr>
            </thead>
            <tbody>
              {/* Switch row - uses poleResistance (flat structure) */}
              <tr>
                <td style={{ fontWeight: 600, backgroundColor: '#f9fafb' }}>Switch</td>
                {(['p1AsFound', 'p1AsLeft', 'p2AsFound', 'p2AsLeft', 'p3AsFound', 'p3AsLeft', 'nAsFound', 'nAsLeft'] as const).map(field => (
                  <td key={field}>
                    <input
                      type="text"
                      value={formData.poleResistance[field]}
                      onChange={e => setFormData(prev => ({
                        ...prev,
                        poleResistance: { ...prev.poleResistance, [field]: e.target.value }
                      }))}
                      className="text-center"
                      readOnly={!isEditing}
                    />
                  </td>
                ))}
              </tr>
              {/* Fuse row - uses poleResistanceDevices.fuse */}
              <tr>
                <td style={{ fontWeight: 600, backgroundColor: '#f9fafb' }}>Fuse</td>
                {(['p1AsFound', 'p1AsLeft', 'p2AsFound', 'p2AsLeft', 'p3AsFound', 'p3AsLeft', 'nAsFound', 'nAsLeft'] as const).map(field => (
                  <td key={field}>
                    <input
                      type="text"
                      value={formData.poleResistanceDevices.fuse[field]}
                      onChange={e => setFormData(prev => ({
                        ...prev,
                        poleResistanceDevices: {
                          ...prev.poleResistanceDevices,
                          fuse: { ...prev.poleResistanceDevices.fuse, [field]: e.target.value }
                        }
                      }))}
                      className="text-center"
                      readOnly={!isEditing}
                    />
                  </td>
                ))}
              </tr>
              {/* Switch + Fuse row - uses poleResistanceDevices.switchFuse */}
              <tr>
                <td style={{ fontWeight: 600, backgroundColor: '#f9fafb' }}>Switch + Fuse</td>
                {(['p1AsFound', 'p1AsLeft', 'p2AsFound', 'p2AsLeft', 'p3AsFound', 'p3AsLeft', 'nAsFound', 'nAsLeft'] as const).map(field => (
                  <td key={field}>
                    <input
                      type="text"
                      value={formData.poleResistanceDevices.switchFuse[field]}
                      onChange={e => setFormData(prev => ({
                        ...prev,
                        poleResistanceDevices: {
                          ...prev.poleResistanceDevices,
                          switchFuse: { ...prev.poleResistanceDevices.switchFuse, [field]: e.target.value }
                        }
                      }))}
                      className="text-center"
                      readOnly={!isEditing}
                    />
                  </td>
                ))}
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

export default LowVoltageSwitchMaintMTSReport;
