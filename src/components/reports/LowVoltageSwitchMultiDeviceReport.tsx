import { useState, useEffect } from 'react';
import './ReportStyles.css';

// TCF table for temperature correction
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
  '36': 2.1, '37': 2.2, '38': 2.3, '39': 2.4, '40': 2.5,
};

const getTCF = (celsius: number): number => {
  const rounded = Math.round(celsius);
  const key = String(rounded);
  return tcfTable[key] !== undefined ? tcfTable[key] : 1;
};

// Interfaces matching the web app
interface SwitchRow {
  position: string;
  manufacturer: string;
  catalogNo: string;
  serialNo: string;
  type: string;
  ratedAmperage: string;
  ratedVoltage: string;
}

interface FuseRow {
  position: string;
  manufacturer: string;
  catalogNo: string;
  fuseClass: string;
  amperage: string;
  aic: string;
  voltage: string;
}

interface IRRow {
  position: string;
  p1p2: string;
  p2p3: string;
  p3p1: string;
  p1_frame: string;
  p2_frame: string;
  p3_frame: string;
  p1_line: string;
  p2_line: string;
  p3_line: string;
}

interface ContactRow {
  position: string;
  sw_p1: string;
  sw_p2: string;
  sw_p3: string;
  fu_p1: string;
  fu_p2: string;
  fu_p3: string;
  sf_p1: string;
  sf_p2: string;
  sf_p3: string;
  units: string;
}

interface VisualInspectionItem {
  identifier: string;
  values: Record<string, string>;
}

interface FormData {
  customer: string;
  jobNumber: string;
  technicians: string;
  date: string;
  identifier: string;
  substation: string;
  eqptLocation: string;
  user: string;
  temperature: { fahrenheit: number; celsius: number; tcf: number; humidity: number | string };
  status: 'PASS' | 'FAIL';
  enclosure: {
    manufacturer: string;
    systemVoltage: string;
    catalogNo: string;
    ratedVoltage: string;
    serialNumber: string;
    ratedCurrent: string;
    series: string;
    aicRating: string;
    type: string;
    phaseConfiguration: string;
  };
  switches: SwitchRow[];
  fuses: FuseRow[];
  irMeasured: IRRow[];
  irCorrected: IRRow[];
  contact: ContactRow[];
  visualInspection: { items: VisualInspectionItem[] };
  irTestVoltage: string;
  irUnits: string;
  equipment: {
    megger: string;
    meggerSerial: string;
    meggerAmpId: string;
    lowRes: string;
    lowResSerial: string;
    lowResAmpId: string;
  };
  comments: string;
}

// Default empty row creators
const makeEmptySwitch = (): SwitchRow => ({
  position: '', manufacturer: '', catalogNo: '', serialNo: '', type: '', ratedAmperage: '', ratedVoltage: ''
});

const makeEmptyFuse = (): FuseRow => ({
  position: '', manufacturer: '', catalogNo: '', fuseClass: '', amperage: '', aic: '', voltage: ''
});

const makeEmptyIR = (): IRRow => ({
  position: '', p1p2: '', p2p3: '', p3p1: '', p1_frame: '', p2_frame: '', p3_frame: '', p1_line: '', p2_line: '', p3_line: ''
});

const makeEmptyContact = (): ContactRow => ({
  position: '', sw_p1: '', sw_p2: '', sw_p3: '', fu_p1: '', fu_p2: '', fu_p3: '', sf_p1: '', sf_p2: '', sf_p3: '', units: 'µΩ'
});

const makeEmptyVisualItem = (): VisualInspectionItem => ({ identifier: '', values: {} });

// Visual inspection fields from NETA ATS Section 7.5.1.1
const VISUAL_INSPECTION_FIELDS = [
  { key: '1', label: '1' },
  { key: '2', label: '2' },
  { key: '3', label: '3' },
  { key: '4', label: '4' },
  { key: '5', label: '5' },
  { key: '6', label: '6' },
  { key: '7', label: '7' },
  { key: '8.1', label: '8.1' },
  { key: '9', label: '9' },
  { key: '10', label: '10' },
  { key: '11', label: '11' },
  { key: '12', label: '12' },
];

interface Props {
  job?: any;
  reportData: any;
  onSave: (data: any) => void;
}

export function LowVoltageSwitchMultiDeviceReport({ job, reportData, onSave }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  // Parse and normalize the report data
  const parseReportData = (data: any): FormData => {
    // The data might be nested in different ways depending on how it was saved
    const d = data?.data || data?.report_info || data || {};
    const jobInfo = d.jobInfo || d.report_info?.jobInfo || {};
    
    // Extract arrays - they might be in different locations
    const switches = d.switches || d.switchData?.rows || jobInfo.switches || [];
    const fuses = d.fuses || d.fuseData?.rows || jobInfo.fuses || [];
    const irMeasured = d.irMeasured || d.insulationResistance?.measured?.rows || d.insulationResistance?.rows || [];
    const irCorrected = d.irCorrected || d.insulationResistance?.corrected?.rows || [];
    const contact = d.contact || d.contactResistance?.rows || [];
    const visualItems = d.visualInspection?.items || d.visualInspection || [];
    
    // Ensure we have at least 6 rows for each array
    const ensureRows = <T,>(arr: T[], defaultFn: () => T, count: number = 6): T[] => {
      const result = [...arr];
      while (result.length < count) {
        result.push(defaultFn());
      }
      return result;
    };

    return {
      customer: jobInfo.customer || d.customer || job?.customer_name || '',
      jobNumber: jobInfo.jobNumber || d.jobNumber || job?.job_number || '',
      technicians: jobInfo.technicians || d.technicians || '',
      date: jobInfo.date || d.date || new Date().toISOString().split('T')[0],
      identifier: jobInfo.identifier || d.identifier || '',
      substation: jobInfo.substation || d.substation || '',
      eqptLocation: jobInfo.eqptLocation || d.eqptLocation || '',
      user: jobInfo.user || d.user || '',
      temperature: {
        fahrenheit: jobInfo.temperature?.fahrenheit || d.temperature?.fahrenheit || 68,
        celsius: jobInfo.temperature?.celsius || d.temperature?.celsius || 20,
        tcf: jobInfo.temperature?.tcf || d.temperature?.tcf || 1,
        humidity: jobInfo.temperature?.humidity || d.temperature?.humidity || 0,
      },
      status: d.status || 'PASS',
      enclosure: {
        manufacturer: d.enclosure?.manufacturer || d.enclosureData?.manufacturer || '',
        systemVoltage: d.enclosure?.systemVoltage || d.enclosureData?.systemVoltage || '',
        catalogNo: d.enclosure?.catalogNo || d.enclosureData?.catalogNo || '',
        ratedVoltage: d.enclosure?.ratedVoltage || d.enclosureData?.ratedVoltage || '',
        serialNumber: d.enclosure?.serialNumber || d.enclosureData?.serialNumber || '',
        ratedCurrent: d.enclosure?.ratedCurrent || d.enclosureData?.ratedCurrent || '',
        series: d.enclosure?.series || d.enclosureData?.series || '',
        aicRating: d.enclosure?.aicRating || d.enclosureData?.aicRating || '',
        type: d.enclosure?.type || d.enclosureData?.type || '',
        phaseConfiguration: d.enclosure?.phaseConfiguration || d.enclosureData?.phaseConfiguration || '',
      },
      switches: ensureRows(switches, makeEmptySwitch),
      fuses: ensureRows(fuses, makeEmptyFuse),
      irMeasured: ensureRows(irMeasured, makeEmptyIR),
      irCorrected: ensureRows(irCorrected, makeEmptyIR),
      contact: ensureRows(contact, makeEmptyContact),
      visualInspection: { items: ensureRows(visualItems, makeEmptyVisualItem, 5) },
      irTestVoltage: d.irTestVoltage || d.insulationResistance?.testVoltage || '1000V',
      irUnits: d.irUnits || d.insulationResistance?.units || 'MΩ',
      equipment: {
        megger: d.equipment?.megger || '',
        meggerSerial: d.equipment?.meggerSerial || '',
        meggerAmpId: d.equipment?.meggerAmpId || '',
        lowRes: d.equipment?.lowRes || '',
        lowResSerial: d.equipment?.lowResSerial || '',
        lowResAmpId: d.equipment?.lowResAmpId || '',
      },
      comments: d.comments || '',
    };
  };

  const [formData, setFormData] = useState<FormData>(() => parseReportData(reportData));

  // Update TCF when temperature changes
  useEffect(() => {
    const celsius = Math.round((formData.temperature.fahrenheit - 32) * 5 / 9);
    const tcf = getTCF(celsius);
    if (celsius !== formData.temperature.celsius || tcf !== formData.temperature.tcf) {
      setFormData(prev => ({
        ...prev,
        temperature: { ...prev.temperature, celsius, tcf }
      }));
    }
  }, [formData.temperature.fahrenheit]);

  // Auto-calculate corrected IR values
  useEffect(() => {
    const tcf = formData.temperature.tcf || 1;
    const multiply = (val: string): string => {
      const num = parseFloat(String(val).replace(/[^0-9.\-]/g, ''));
      if (Number.isNaN(num)) return val || '';
      return String(Math.round((num * tcf + Number.EPSILON) * 100) / 100);
    };

    const nextCorrected = formData.irMeasured.map(row => ({
      position: row.position,
      p1p2: multiply(row.p1p2),
      p2p3: multiply(row.p2p3),
      p3p1: multiply(row.p3p1),
      p1_frame: multiply(row.p1_frame),
      p2_frame: multiply(row.p2_frame),
      p3_frame: multiply(row.p3_frame),
      p1_line: multiply(row.p1_line),
      p2_line: multiply(row.p2_line),
      p3_line: multiply(row.p3_line),
    }));

    if (JSON.stringify(nextCorrected) !== JSON.stringify(formData.irCorrected)) {
      setFormData(prev => ({ ...prev, irCorrected: nextCorrected }));
    }
  }, [formData.irMeasured, formData.temperature.tcf]);

  const setField = (path: string, value: any) => {
    setFormData(prev => {
      const clone: any = { ...prev };
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

  const handleSave = () => {
    onSave(formData);
  };

  const inputClass = (readonly: boolean = !isEditing) =>
    `report-input ${readonly ? 'readonly' : ''}`;

  return (
    <div className="report-container">
      {/* Header */}
      <div className="report-header-bar">
        <h1 className="report-title">6-Low Voltage Switch - Multi-Device TEST</h1>
        <div className="report-actions">
          <button
            onClick={() => setFormData(prev => ({
              ...prev,
              status: prev.status === 'PASS' ? 'FAIL' : 'PASS'
            }))}
            disabled={!isEditing}
            className={`status-btn ${formData.status === 'PASS' ? 'pass' : 'fail'}`}
          >
            {formData.status}
          </button>
          {!isEditing ? (
            <button onClick={() => setIsEditing(true)} className="btn-primary">
              Edit Report
            </button>
          ) : (
            <button onClick={handleSave} className="btn-save">
              Save Report
            </button>
          )}
        </div>
      </div>

      {/* Job Information */}
      <section className="report-section">
        <div className="section-divider"></div>
        <h2 className="section-title">Job Information</h2>
        <div className="form-grid-6">
          <div className="form-field">
            <label>Customer:</label>
            <input className={inputClass()} value={formData.customer} onChange={e => setField('customer', e.target.value)} readOnly={!isEditing} />
          </div>
          <div className="form-field">
            <label>Job #:</label>
            <input className={inputClass()} value={formData.jobNumber} onChange={e => setField('jobNumber', e.target.value)} readOnly={!isEditing} />
          </div>
          <div className="form-field">
            <label>Technicians:</label>
            <input className={inputClass()} value={formData.technicians} onChange={e => setField('technicians', e.target.value)} readOnly={!isEditing} />
          </div>
          <div className="form-field">
            <label>Date:</label>
            <input type="date" className={inputClass()} value={formData.date} onChange={e => setField('date', e.target.value)} readOnly={!isEditing} />
          </div>
          <div className="form-field">
            <label>Identifier:</label>
            <input className={inputClass()} value={formData.identifier} onChange={e => setField('identifier', e.target.value)} readOnly={!isEditing} />
          </div>
          <div className="form-field temp-field">
            <label>Temp:</label>
            <div className="temp-inputs">
              <input type="number" className={inputClass()} value={formData.temperature.fahrenheit} onChange={e => setField('temperature.fahrenheit', Number(e.target.value))} readOnly={!isEditing} style={{width: '60px'}} />
              <span>°F</span>
              <span className="temp-celsius">{formData.temperature.celsius}</span>
              <span>°C</span>
              <span className="temp-label">TCF</span>
              <span className="temp-value">{formData.temperature.tcf.toFixed(3)}</span>
            </div>
          </div>
          <div className="form-field">
            <label>Humidity:</label>
            <div className="humidity-input">
              <input className={inputClass()} value={formData.temperature.humidity} onChange={e => setField('temperature.humidity', e.target.value)} readOnly={!isEditing} style={{width: '60px'}} />
              <span>%</span>
            </div>
          </div>
          <div className="form-field">
            <label>Substation:</label>
            <input className={inputClass()} value={formData.substation} onChange={e => setField('substation', e.target.value)} readOnly={!isEditing} />
          </div>
          <div className="form-field">
            <label>Eqpt. Location:</label>
            <input className={inputClass()} value={formData.eqptLocation} onChange={e => setField('eqptLocation', e.target.value)} readOnly={!isEditing} />
          </div>
          <div className="form-field col-span-2">
            <label>User:</label>
            <input className={inputClass()} value={formData.user} onChange={e => setField('user', e.target.value)} readOnly={!isEditing} />
          </div>
        </div>
      </section>

      {/* Visual and Mechanical Inspection */}
      <section className="report-section">
        <div className="section-divider"></div>
        <h2 className="section-title">Visual and Mechanical Inspection</h2>
        <p className="section-subtitle">Visual and Mechanical Tests for NETA ATS Section 7.5.1.1.A</p>
        <div className="table-container">
          <table className="report-table">
            <thead>
              <tr>
                <th>Position / Identifier</th>
                {VISUAL_INSPECTION_FIELDS.map(f => (
                  <th key={f.key}>{f.label}</th>
                ))}
                <th colSpan={3}>Satisfactory?</th>
              </tr>
              <tr>
                <th></th>
                {VISUAL_INSPECTION_FIELDS.map(f => (
                  <th key={f.key}></th>
                ))}
                <th>Yes = Y</th>
                <th>No = N</th>
                <th>Not = N/A</th>
              </tr>
            </thead>
            <tbody>
              {formData.visualInspection.items.map((item, idx) => (
                <tr key={idx}>
                  <td>
                    <input
                      className={inputClass()}
                      value={item.identifier}
                      onChange={e => {
                        const items = [...formData.visualInspection.items];
                        items[idx] = { ...items[idx], identifier: e.target.value };
                        setField('visualInspection.items', items);
                      }}
                      readOnly={!isEditing}
                    />
                  </td>
                  {VISUAL_INSPECTION_FIELDS.map(f => (
                    <td key={f.key}>
                      <select
                        className={inputClass()}
                        value={item.values[f.key] || ''}
                        onChange={e => {
                          const items = [...formData.visualInspection.items];
                          items[idx] = {
                            ...items[idx],
                            values: { ...items[idx].values, [f.key]: e.target.value }
                          };
                          setField('visualInspection.items', items);
                        }}
                        disabled={!isEditing}
                      >
                        <option value="">-</option>
                        <option value="✓">✓</option>
                        <option value="✗">✗</option>
                        <option value="N/A">N/A</option>
                      </select>
                    </td>
                  ))}
                  <td colSpan={3}></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Enclosure Data */}
      <section className="report-section">
        <div className="section-divider"></div>
        <h2 className="section-title">Enclosure Data</h2>
        <div className="enclosure-grid">
          <div className="enclosure-row">
            <div className="enclosure-cell">
              <strong>Manufacturer:</strong>
              <input className={inputClass()} value={formData.enclosure.manufacturer} onChange={e => setField('enclosure.manufacturer', e.target.value)} readOnly={!isEditing} />
            </div>
            <div className="enclosure-cell">
              <strong>System Voltage (V):</strong>
              <input className={inputClass()} value={formData.enclosure.systemVoltage} onChange={e => setField('enclosure.systemVoltage', e.target.value)} readOnly={!isEditing} />
            </div>
            <div className="enclosure-cell">
              <strong>Catalog No.:</strong>
              <input className={inputClass()} value={formData.enclosure.catalogNo} onChange={e => setField('enclosure.catalogNo', e.target.value)} readOnly={!isEditing} />
            </div>
            <div className="enclosure-cell">
              <strong>Rated Voltage (V):</strong>
              <input className={inputClass()} value={formData.enclosure.ratedVoltage} onChange={e => setField('enclosure.ratedVoltage', e.target.value)} readOnly={!isEditing} />
            </div>
          </div>
          <div className="enclosure-row">
            <div className="enclosure-cell">
              <strong>Serial Number:</strong>
              <input className={inputClass()} value={formData.enclosure.serialNumber} onChange={e => setField('enclosure.serialNumber', e.target.value)} readOnly={!isEditing} />
            </div>
            <div className="enclosure-cell">
              <strong>Rated Current (A):</strong>
              <input className={inputClass()} value={formData.enclosure.ratedCurrent} onChange={e => setField('enclosure.ratedCurrent', e.target.value)} readOnly={!isEditing} />
            </div>
            <div className="enclosure-cell">
              <strong>Series:</strong>
              <input className={inputClass()} value={formData.enclosure.series} onChange={e => setField('enclosure.series', e.target.value)} readOnly={!isEditing} />
            </div>
            <div className="enclosure-cell">
              <strong>AIC Rating (kA):</strong>
              <input className={inputClass()} value={formData.enclosure.aicRating} onChange={e => setField('enclosure.aicRating', e.target.value)} readOnly={!isEditing} />
            </div>
          </div>
          <div className="enclosure-row">
            <div className="enclosure-cell">
              <strong>Type:</strong>
              <input className={inputClass()} value={formData.enclosure.type} onChange={e => setField('enclosure.type', e.target.value)} readOnly={!isEditing} />
            </div>
            <div className="enclosure-cell col-span-3">
              <strong>Phase Configuration:</strong>
              <input className={inputClass()} value={formData.enclosure.phaseConfiguration} onChange={e => setField('enclosure.phaseConfiguration', e.target.value)} readOnly={!isEditing} />
            </div>
          </div>
        </div>
      </section>

      {/* Switch Data */}
      <section className="report-section">
        <div className="section-divider"></div>
        <h2 className="section-title">Switch Data</h2>
        <div className="table-container">
          <table className="report-table">
            <thead>
              <tr>
                <th>Position / Identifier</th>
                <th>Manufacturer</th>
                <th>Catalog No.</th>
                <th>Serial No.</th>
                <th>Type</th>
                <th colSpan={2}>
                  <div>Rated</div>
                  <div className="sub-headers">
                    <span>Amperage</span>
                    <span>Voltage</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {formData.switches.map((row, idx) => (
                <tr key={idx}>
                  <td><input className={inputClass()} value={row.position} onChange={e => { const next = [...formData.switches]; next[idx].position = e.target.value; setField('switches', next); }} readOnly={!isEditing} /></td>
                  <td><input className={inputClass()} value={row.manufacturer} onChange={e => { const next = [...formData.switches]; next[idx].manufacturer = e.target.value; setField('switches', next); }} readOnly={!isEditing} /></td>
                  <td><input className={inputClass()} value={row.catalogNo} onChange={e => { const next = [...formData.switches]; next[idx].catalogNo = e.target.value; setField('switches', next); }} readOnly={!isEditing} /></td>
                  <td><input className={inputClass()} value={row.serialNo} onChange={e => { const next = [...formData.switches]; next[idx].serialNo = e.target.value; setField('switches', next); }} readOnly={!isEditing} /></td>
                  <td><input className={inputClass()} value={row.type} onChange={e => { const next = [...formData.switches]; next[idx].type = e.target.value; setField('switches', next); }} readOnly={!isEditing} /></td>
                  <td><input className={inputClass()} value={row.ratedAmperage} onChange={e => { const next = [...formData.switches]; next[idx].ratedAmperage = e.target.value; setField('switches', next); }} readOnly={!isEditing} /></td>
                  <td><input className={inputClass()} value={row.ratedVoltage} onChange={e => { const next = [...formData.switches]; next[idx].ratedVoltage = e.target.value; setField('switches', next); }} readOnly={!isEditing} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Fuse Data */}
      <section className="report-section">
        <div className="section-divider"></div>
        <h2 className="section-title">Fuse Data</h2>
        <div className="table-container">
          <table className="report-table">
            <thead>
              <tr>
                <th>Position / Identifier</th>
                <th>Manufacturer</th>
                <th>Catalog No.</th>
                <th>Class</th>
                <th colSpan={3}>
                  <div>Rated</div>
                  <div className="sub-headers-3">
                    <span>Amperage</span>
                    <span>AIC</span>
                    <span>Voltage</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {formData.fuses.map((row, idx) => (
                <tr key={idx}>
                  <td><input className={inputClass()} value={row.position} onChange={e => { const next = [...formData.fuses]; next[idx].position = e.target.value; setField('fuses', next); }} readOnly={!isEditing} /></td>
                  <td><input className={inputClass()} value={row.manufacturer} onChange={e => { const next = [...formData.fuses]; next[idx].manufacturer = e.target.value; setField('fuses', next); }} readOnly={!isEditing} /></td>
                  <td><input className={inputClass()} value={row.catalogNo} onChange={e => { const next = [...formData.fuses]; next[idx].catalogNo = e.target.value; setField('fuses', next); }} readOnly={!isEditing} /></td>
                  <td><input className={inputClass()} value={row.fuseClass} onChange={e => { const next = [...formData.fuses]; next[idx].fuseClass = e.target.value; setField('fuses', next); }} readOnly={!isEditing} /></td>
                  <td><input className={inputClass()} value={row.amperage} onChange={e => { const next = [...formData.fuses]; next[idx].amperage = e.target.value; setField('fuses', next); }} readOnly={!isEditing} /></td>
                  <td><input className={inputClass()} value={row.aic} onChange={e => { const next = [...formData.fuses]; next[idx].aic = e.target.value; setField('fuses', next); }} readOnly={!isEditing} /></td>
                  <td><input className={inputClass()} value={row.voltage} onChange={e => { const next = [...formData.fuses]; next[idx].voltage = e.target.value; setField('fuses', next); }} readOnly={!isEditing} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Electrical Tests - Measured Insulation Resistance */}
      <section className="report-section">
        <div className="section-divider"></div>
        <div className="section-header-with-control">
          <h2 className="section-title">Electrical Tests - Measured Insulation Resistance Values</h2>
          <div className="voltage-select">
            <label>Test Voltage:</label>
            <select className={inputClass()} value={formData.irTestVoltage} onChange={e => setField('irTestVoltage', e.target.value)} disabled={!isEditing}>
              {['250V', '500V', '1000V', '2500V', '5000V', '10000V'].map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
        </div>
        <div className="table-container">
          <table className="report-table ir-table">
            <thead>
              <tr>
                <th rowSpan={2}>Position / Identifier</th>
                <th colSpan={9}>Insulation Resistance</th>
                <th rowSpan={2}>Units</th>
              </tr>
              <tr>
                <th colSpan={3}>Pole to Pole (switch open)</th>
                <th colSpan={3}>Pole to Frame (switch closed)</th>
                <th colSpan={3}>Line to Load (switch closed)</th>
              </tr>
              <tr className="sub-header">
                <th></th>
                <th>P1-P2</th>
                <th>P2-P3</th>
                <th>P3-P1</th>
                <th>P1</th>
                <th>P2</th>
                <th>P3</th>
                <th>P1</th>
                <th>P2</th>
                <th>P3</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {formData.irMeasured.map((row, idx) => (
                <tr key={idx}>
                  <td><input className={inputClass()} value={row.position} onChange={e => { const next = [...formData.irMeasured]; next[idx].position = e.target.value; setField('irMeasured', next); }} readOnly={!isEditing} /></td>
                  <td><input className={inputClass()} value={row.p1p2} onChange={e => { const next = [...formData.irMeasured]; next[idx].p1p2 = e.target.value; setField('irMeasured', next); }} readOnly={!isEditing} /></td>
                  <td><input className={inputClass()} value={row.p2p3} onChange={e => { const next = [...formData.irMeasured]; next[idx].p2p3 = e.target.value; setField('irMeasured', next); }} readOnly={!isEditing} /></td>
                  <td><input className={inputClass()} value={row.p3p1} onChange={e => { const next = [...formData.irMeasured]; next[idx].p3p1 = e.target.value; setField('irMeasured', next); }} readOnly={!isEditing} /></td>
                  <td><input className={inputClass()} value={row.p1_frame} onChange={e => { const next = [...formData.irMeasured]; next[idx].p1_frame = e.target.value; setField('irMeasured', next); }} readOnly={!isEditing} /></td>
                  <td><input className={inputClass()} value={row.p2_frame} onChange={e => { const next = [...formData.irMeasured]; next[idx].p2_frame = e.target.value; setField('irMeasured', next); }} readOnly={!isEditing} /></td>
                  <td><input className={inputClass()} value={row.p3_frame} onChange={e => { const next = [...formData.irMeasured]; next[idx].p3_frame = e.target.value; setField('irMeasured', next); }} readOnly={!isEditing} /></td>
                  <td><input className={inputClass()} value={row.p1_line} onChange={e => { const next = [...formData.irMeasured]; next[idx].p1_line = e.target.value; setField('irMeasured', next); }} readOnly={!isEditing} /></td>
                  <td><input className={inputClass()} value={row.p2_line} onChange={e => { const next = [...formData.irMeasured]; next[idx].p2_line = e.target.value; setField('irMeasured', next); }} readOnly={!isEditing} /></td>
                  <td><input className={inputClass()} value={row.p3_line} onChange={e => { const next = [...formData.irMeasured]; next[idx].p3_line = e.target.value; setField('irMeasured', next); }} readOnly={!isEditing} /></td>
                  <td>{formData.irUnits}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Electrical Tests - Temperature Corrected Insulation Resistance */}
      <section className="report-section">
        <div className="section-divider"></div>
        <h2 className="section-title">Electrical Tests - Temperature Corrected Insulation Resistance Values</h2>
        <p className="formula-note">Corrected values are auto-calculated as Measured × TCF</p>
        <div className="table-container">
          <table className="report-table ir-table">
            <thead>
              <tr>
                <th rowSpan={2}>Position / Identifier</th>
                <th colSpan={9}>Insulation Resistance</th>
                <th rowSpan={2}>Units</th>
              </tr>
              <tr>
                <th colSpan={3}>Pole to Pole</th>
                <th colSpan={3}>Pole to Frame</th>
                <th colSpan={3}>Line to Load</th>
              </tr>
              <tr className="sub-header">
                <th></th>
                <th>P1-P2</th>
                <th>P2-P3</th>
                <th>P3-P1</th>
                <th>P1-Frame</th>
                <th>P2-Frame</th>
                <th>P3-Frame</th>
                <th>P1</th>
                <th>P2</th>
                <th>P3</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {formData.irCorrected.map((row, idx) => (
                <tr key={idx}>
                  <td><input className="report-input readonly calculated" value={row.position} readOnly /></td>
                  <td><input className="report-input readonly calculated" value={row.p1p2} readOnly /></td>
                  <td><input className="report-input readonly calculated" value={row.p2p3} readOnly /></td>
                  <td><input className="report-input readonly calculated" value={row.p3p1} readOnly /></td>
                  <td><input className="report-input readonly calculated" value={row.p1_frame} readOnly /></td>
                  <td><input className="report-input readonly calculated" value={row.p2_frame} readOnly /></td>
                  <td><input className="report-input readonly calculated" value={row.p3_frame} readOnly /></td>
                  <td><input className="report-input readonly calculated" value={row.p1_line} readOnly /></td>
                  <td><input className="report-input readonly calculated" value={row.p2_line} readOnly /></td>
                  <td><input className="report-input readonly calculated" value={row.p3_line} readOnly /></td>
                  <td>{formData.irUnits}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Electrical Tests - Contact Resistance */}
      <section className="report-section">
        <div className="section-divider"></div>
        <h2 className="section-title">Electrical Tests - Contact Resistance</h2>
        <div className="table-container">
          <table className="report-table contact-table">
            <thead>
              <tr>
                <th rowSpan={2}>Position / Identifier</th>
                <th colSpan={3}>Switch</th>
                <th colSpan={3}>Fuse</th>
                <th colSpan={3}>Switch + Fuse</th>
                <th rowSpan={2}>Units</th>
              </tr>
              <tr>
                <th>P1</th>
                <th>P2</th>
                <th>P3</th>
                <th>P1</th>
                <th>P2</th>
                <th>P3</th>
                <th>P1</th>
                <th>P2</th>
                <th>P3</th>
              </tr>
            </thead>
            <tbody>
              {formData.contact.map((row, idx) => (
                <tr key={idx}>
                  <td><input className={inputClass()} value={row.position} onChange={e => { const next = [...formData.contact]; next[idx].position = e.target.value; setField('contact', next); }} readOnly={!isEditing} /></td>
                  <td><input className={inputClass()} value={row.sw_p1} onChange={e => { const next = [...formData.contact]; next[idx].sw_p1 = e.target.value; setField('contact', next); }} readOnly={!isEditing} /></td>
                  <td><input className={inputClass()} value={row.sw_p2} onChange={e => { const next = [...formData.contact]; next[idx].sw_p2 = e.target.value; setField('contact', next); }} readOnly={!isEditing} /></td>
                  <td><input className={inputClass()} value={row.sw_p3} onChange={e => { const next = [...formData.contact]; next[idx].sw_p3 = e.target.value; setField('contact', next); }} readOnly={!isEditing} /></td>
                  <td><input className={inputClass()} value={row.fu_p1} onChange={e => { const next = [...formData.contact]; next[idx].fu_p1 = e.target.value; setField('contact', next); }} readOnly={!isEditing} /></td>
                  <td><input className={inputClass()} value={row.fu_p2} onChange={e => { const next = [...formData.contact]; next[idx].fu_p2 = e.target.value; setField('contact', next); }} readOnly={!isEditing} /></td>
                  <td><input className={inputClass()} value={row.fu_p3} onChange={e => { const next = [...formData.contact]; next[idx].fu_p3 = e.target.value; setField('contact', next); }} readOnly={!isEditing} /></td>
                  <td><input className={inputClass()} value={row.sf_p1} onChange={e => { const next = [...formData.contact]; next[idx].sf_p1 = e.target.value; setField('contact', next); }} readOnly={!isEditing} /></td>
                  <td><input className={inputClass()} value={row.sf_p2} onChange={e => { const next = [...formData.contact]; next[idx].sf_p2 = e.target.value; setField('contact', next); }} readOnly={!isEditing} /></td>
                  <td><input className={inputClass()} value={row.sf_p3} onChange={e => { const next = [...formData.contact]; next[idx].sf_p3 = e.target.value; setField('contact', next); }} readOnly={!isEditing} /></td>
                  <td>
                    <select className={inputClass()} value={row.units} onChange={e => { const next = [...formData.contact]; next[idx].units = e.target.value; setField('contact', next); }} disabled={!isEditing}>
                      <option value="µΩ">µΩ</option>
                      <option value="mΩ">mΩ</option>
                      <option value="Ω">Ω</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* NETA Reference */}
      <section className="report-section">
        <div className="section-divider"></div>
        <h2 className="section-title">NETA Reference</h2>
        <div className="neta-reference">
          <table className="neta-table">
            <thead>
              <tr>
                <th>Section</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>7.5.1.1.A.1</td><td>Compare equipment data with drawings & specifications</td></tr>
              <tr><td>7.5.1.1.A.2</td><td>Inspect physical & mechanical condition</td></tr>
              <tr><td>7.5.1.1.A.4</td><td>Verify the unit is clean</td></tr>
              <tr><td>7.5.1.1.A.5</td><td>Verify correct blade alignment, blade penetration, blade stops, & mechanical operation</td></tr>
              <tr><td>7.5.1.1.A.6</td><td>Verify fusing class & types are in accordance with drawings, short circuit, & coordination study</td></tr>
              <tr><td>7.5.1.1.A.7</td><td>Verify each fuse has adequate mechanical support & contact integrity</td></tr>
              <tr><td>7.5.1.1.A.8.1</td><td>Inspect bolted electrical connections for resistance utilizing a low resistance ohmmeter</td></tr>
              <tr><td>7.5.1.1.A.9</td><td>Verify operation & sequencing of interlocking systems</td></tr>
              <tr><td>7.5.1.1.A.10</td><td>Verify correct operation of all indicating & control devices</td></tr>
              <tr><td>7.5.1.1.A.11</td><td>Verify appropriate lubrication on moving current-carrying parts & on moving & sliding surfaces</td></tr>
              <tr><td>7.5.1.1.A.12</td><td>Verify appropriate lubrication on moving current-carrying parts & on moving & sliding surfaces</td></tr>
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
            <label>Megohmeter:</label>
            <input className={inputClass()} value={formData.equipment.megger} onChange={e => setField('equipment.megger', e.target.value)} readOnly={!isEditing} />
            <label>Serial Number:</label>
            <input className={inputClass()} value={formData.equipment.meggerSerial} onChange={e => setField('equipment.meggerSerial', e.target.value)} readOnly={!isEditing} />
            <label>AMP ID:</label>
            <input className={inputClass()} value={formData.equipment.meggerAmpId} onChange={e => setField('equipment.meggerAmpId', e.target.value)} readOnly={!isEditing} />
          </div>
          <div className="equipment-row">
            <label>Low Resistance:</label>
            <input className={inputClass()} value={formData.equipment.lowRes} onChange={e => setField('equipment.lowRes', e.target.value)} readOnly={!isEditing} />
            <label>Serial Number:</label>
            <input className={inputClass()} value={formData.equipment.lowResSerial} onChange={e => setField('equipment.lowResSerial', e.target.value)} readOnly={!isEditing} />
            <label>AMP ID:</label>
            <input className={inputClass()} value={formData.equipment.lowResAmpId} onChange={e => setField('equipment.lowResAmpId', e.target.value)} readOnly={!isEditing} />
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
          onChange={e => setField('comments', e.target.value)}
          readOnly={!isEditing}
          rows={4}
        />
      </section>
    </div>
  );
}

export default LowVoltageSwitchMultiDeviceReport;

