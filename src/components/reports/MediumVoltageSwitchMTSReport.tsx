/**
 * 23-Medium Voltage Switch MTS Report
 * Desktop offline version - matches web app data structure
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ReportSection, ReportHeader, VISUAL_INSPECTION_OPTIONS } from './BaseReport';
import './ReportStyles.css';

type PassFail = 'PASS' | 'FAIL';

interface VisualRow {
  neta: string;
  description: string;
  result: string;
}

interface NameplateData {
  manufacturer: string;
  catalogNumber: string;
  serialNumber: string;
  type: string;
  mfgDate: string;
  icRatingKa: string;
  ratedVoltageKv: string;
  operatingVoltageKv: string;
  ampacity: string;
  impulseBil: string;
}

interface FuseData {
  manufacturer: string;
  catalogNumber: string;
  className: string;
  ratedVoltageKv: string;
  ampacityA: string;
  icRatingKa: string;
}

type ThreePhase = { p1: string; p2: string; p3: string };

interface FormData {
  customer: string;
  address: string;
  user: string;
  date: string;
  identifier: string;
  jobNumber: string;
  technicians: string;
  substation: string;
  eqptLocation: string;
  temperature: { fahrenheit: number | ''; celsius: number | ''; tcf: number; humidity: number | '' };
  nameplate: NameplateData;
  visual: VisualRow[];
  fuseData: FuseData;
  contactAsFound: { switch: ThreePhase; fuse: ThreePhase; switchFuse: ThreePhase; units: string };
  contactAsLeft: { switch: ThreePhase; fuse: ThreePhase; switchFuse: ThreePhase; units: string };
  insulation: {
    testVoltage: string;
    rows: Array<{ label: string; position: string; readings: ThreePhase }>;
  };
  insulationCorrected: {
    rows: Array<{ label: string; readings: ThreePhase }>;
  };
  dielectric: {
    testVoltage: string;
    duration: string;
    units: string;
    p1: string; p2: string; p3: string;
  };
  equipmentUsed: {
    megohmmeter: { name: string; serialNumber: string; ampId: string };
    lowResistanceOhmmeter: { name: string; serialNumber: string; ampId: string };
    hipot: { name: string; serialNumber: string; ampId: string };
  };
  comments: string;
  status: PassFail;
}

const initialVisualRows: VisualRow[] = [
  { neta: '7.5.1.2.A.1', description: 'Inspect physical and mechanical condition.', result: '' },
  { neta: '7.5.1.2.A.2', description: 'Inspect anchorage, alignment, and grounding.', result: '' },
  { neta: '7.5.1.2.A.4', description: 'Clean the unit.', result: '' },
  { neta: '7.5.1.2.A.5', description: 'Verify correct blade alignment, blade penetration, travel stops, arc interrupter operation, and mechanical operation.', result: '' },
  { neta: '7.5.1.2.A.6', description: 'Verify that fuse sizes and types are in accordance with drawings, short-circuit studies, and', result: '' },
  { neta: '7.5.1.2.A.7', description: 'Verify that expulsion-limiting devices are in place on all fuses having expulsion-type elements.', result: '' },
  { neta: '7.5.1.2.A.8', description: 'Verify that each fuseholder has adequate mechanical support and contact integrity.', result: '' },
  { neta: '7.5.1.2.A.9.1', description: 'Use of a low-resistance ohmmeter in accordance with Section 7.5.1.2.B.1.', result: '' },
  { neta: '7.5.1.2.A.10', description: 'Verify operation and sequencing of interlocking systems.', result: '' },
  { neta: '7.5.1.2.A.11', description: 'Verify that phase-barrier mounting is intact.', result: '' },
  { neta: '7.5.1.2.A.12', description: 'Verify correct operation of all indicating and control devices.', result: '' },
  { neta: '7.5.1.2.A.13', description: 'Use appropriate lubrication on moving current-carrying parts and on moving and sliding surfaces.', result: '' }
];

const makeEmpty3 = (): ThreePhase => ({ p1: '', p2: '', p3: '' });
const testVoltageOptions = ['250V', '500V', '1000V', '2500V', '5000V'];

// TCF lookup
const tcfData: Array<{ celsius: number; multiplier: number }> = [
  { celsius: 20, multiplier: 1 },
  { celsius: 21, multiplier: 1.05 }, { celsius: 22, multiplier: 1.1 }, { celsius: 23, multiplier: 1.15 }, { celsius: 24, multiplier: 1.2 }, { celsius: 25, multiplier: 1.25 },
  { celsius: 26, multiplier: 1.316 }, { celsius: 27, multiplier: 1.382 }, { celsius: 28, multiplier: 1.448 }, { celsius: 29, multiplier: 1.514 }, { celsius: 30, multiplier: 1.58 },
  { celsius: 15, multiplier: 0.81 }, { celsius: 16, multiplier: 0.848 }, { celsius: 17, multiplier: 0.886 }, { celsius: 18, multiplier: 0.924 }, { celsius: 19, multiplier: 0.962 },
  { celsius: 10, multiplier: 0.63 },
];

const getTCF = (celsius: number): number => {
  const exactMatch = tcfData.find(data => data.celsius === celsius);
  if (exactMatch) return exactMatch.multiplier;
  return 1.0;
};

const multiplyByTCF = (val: string, tcf: number): string => {
  const num = parseFloat(val);
  if (isNaN(num) || !val.trim()) return '';
  return (num * tcf).toFixed(2);
};

const fahrenheitToCelsius = (f: number): number => Math.round((f - 32) * 5 / 9);

interface Props {
  reportData: any;
  job?: any;
  onSave: (data: any) => void;
}

export default function MediumVoltageSwitchMTSReport({ reportData, job, onSave }: Props) {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [status, setStatus] = useState<PassFail>('PASS');

  const [form, setForm] = useState<FormData>({
    customer: '',
    address: '',
    user: '',
    date: new Date().toISOString().split('T')[0],
    identifier: '',
    jobNumber: '',
    technicians: '',
    substation: '',
    eqptLocation: '',
    temperature: { fahrenheit: 68, celsius: 20, tcf: 1, humidity: 50 },
    nameplate: {
      manufacturer: '', catalogNumber: '', serialNumber: '', type: '', mfgDate: '',
      icRatingKa: '', ratedVoltageKv: '', operatingVoltageKv: '', ampacity: '', impulseBil: ''
    },
    visual: initialVisualRows.map(v => ({ ...v })),
    fuseData: { manufacturer: '', catalogNumber: '', className: '', ratedVoltageKv: '', ampacityA: '', icRatingKa: '' },
    contactAsFound: { switch: makeEmpty3(), fuse: makeEmpty3(), switchFuse: makeEmpty3(), units: 'µΩ' },
    contactAsLeft: { switch: makeEmpty3(), fuse: makeEmpty3(), switchFuse: makeEmpty3(), units: 'µΩ' },
    insulation: {
      testVoltage: '2500V',
      rows: [
        { label: 'Pole to Pole', position: 'Closed', readings: makeEmpty3() },
        { label: 'Pole to Frame', position: 'Closed', readings: makeEmpty3() },
        { label: 'Line to Load', position: 'Open', readings: makeEmpty3() }
      ]
    },
    insulationCorrected: {
      rows: [
        { label: 'Pole to Pole', readings: makeEmpty3() },
        { label: 'Pole to Frame', readings: makeEmpty3() },
        { label: 'Line to Load', readings: makeEmpty3() }
      ]
    },
    dielectric: { testVoltage: '16.1', duration: '1 Min.', units: 'mA', p1: '', p2: '', p3: '' },
    equipmentUsed: {
      megohmmeter: { name: '', serialNumber: '', ampId: '' },
      lowResistanceOhmmeter: { name: '', serialNumber: '', ampId: '' },
      hipot: { name: '', serialNumber: '', ampId: '' }
    },
    comments: '',
    status: 'PASS'
  });

  // Parse incoming report data
  useEffect(() => {
    if (!reportData) return;
    const fullData = reportData.data || reportData.report_data || reportData;
    const merged = { ...fullData };
    
    if (job) {
      merged.customer = merged.customer || job.customer_name || '';
      merged.address = merged.address || job.site_address || '';
      merged.jobNumber = merged.jobNumber || job.job_number || '';
    }

    setForm(prev => ({
      ...prev,
      customer: merged.customer || prev.customer,
      address: merged.address || prev.address,
      user: merged.user || prev.user,
      date: merged.date || prev.date,
      identifier: merged.identifier || prev.identifier,
      jobNumber: merged.jobNumber || merged.job_number || prev.jobNumber,
      technicians: merged.technicians || prev.technicians,
      substation: merged.substation || prev.substation,
      eqptLocation: merged.eqptLocation || merged.eqpt_location || prev.eqptLocation,
      temperature: merged.temperature || prev.temperature,
      nameplate: merged.nameplate || prev.nameplate,
      visual: merged.visual || prev.visual,
      fuseData: merged.fuseData || merged.fuse_data || prev.fuseData,
      contactAsFound: merged.contactAsFound || merged.contact_as_found || prev.contactAsFound,
      contactAsLeft: merged.contactAsLeft || merged.contact_as_left || prev.contactAsLeft,
      insulation: merged.insulation || prev.insulation,
      insulationCorrected: merged.insulationCorrected || merged.insulation_corrected || prev.insulationCorrected,
      dielectric: merged.dielectric || prev.dielectric,
      equipmentUsed: merged.equipmentUsed || merged.equipment_used || prev.equipmentUsed,
      comments: merged.comments || prev.comments,
      status: merged.status || prev.status
    }));
    setStatus(merged.status || 'PASS');
  }, [reportData, job]);

  // Update TCF when temperature changes
  useEffect(() => {
    const celsius = typeof form.temperature.celsius === 'number' ? form.temperature.celsius : 20;
    const tcf = getTCF(celsius);
    if (tcf !== form.temperature.tcf) {
      setForm(prev => ({ ...prev, temperature: { ...prev.temperature, tcf } }));
    }
  }, [form.temperature.celsius]);

  // Recalculate corrected insulation values
  useEffect(() => {
    setForm(prev => {
      const tcf = prev.temperature.tcf || 1;
      const corrected = prev.insulation.rows.map(r => ({
        label: r.label,
        readings: {
          p1: multiplyByTCF(r.readings.p1, tcf),
          p2: multiplyByTCF(r.readings.p2, tcf),
          p3: multiplyByTCF(r.readings.p3, tcf)
        }
      }));
      return { ...prev, insulationCorrected: { rows: corrected } };
    });
  }, [form.insulation.rows, form.temperature.tcf]);

  const handleSave = () => {
    const saveData = { ...form, status };
    onSave(saveData);
    setIsEditing(false);
  };

  const ContactTable = ({ title, dataKey }: { title: string; dataKey: 'contactAsFound' | 'contactAsLeft' }) => {
    const data = form[dataKey];
    return (
      <div style={{ flex: 1 }}>
        <h4 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: 8 }}>{title}</h4>
        <table className="report-table compact">
          <thead>
            <tr>
              <th></th>
              <th>P1</th>
              <th>P2</th>
              <th>P3</th>
              <th>Units</th>
            </tr>
          </thead>
          <tbody>
            {(['switch', 'fuse', 'switchFuse'] as const).map(row => (
              <tr key={row}>
                <td style={{ fontWeight: 500 }}>{row === 'switchFuse' ? 'Switch + Fuse' : row.charAt(0).toUpperCase() + row.slice(1)}</td>
                {(['p1', 'p2', 'p3'] as const).map(ph => (
                  <td key={ph}>
                    <input
                      className="report-input"
                      value={data[row][ph]}
                      onChange={e => setForm(p => ({ ...p, [dataKey]: { ...p[dataKey], [row]: { ...p[dataKey][row], [ph]: e.target.value } } }))}
                      readOnly={!isEditing}
                      style={{ textAlign: 'center' }}
                    />
                  </td>
                ))}
                <td>
                  <select
                    className="report-input"
                    value={data.units}
                    onChange={e => setForm(p => ({ ...p, [dataKey]: { ...p[dataKey], units: e.target.value } }))}
                    disabled={!isEditing}
                  >
                    <option value="µΩ">µΩ</option>
                    <option value="mΩ">mΩ</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="report-container">
      {/* Header */}
      <ReportHeader
        title="23-Medium Voltage Switch MTS"
        status={status}
        onStatusChange={() => setStatus(s => s === 'PASS' ? 'FAIL' : 'PASS')}
        isEditing={isEditing}
        onEdit={() => setIsEditing(true)}
        onSave={handleSave}
      />

      {/* Job Details */}
      <ReportSection title="Job Details">
        <div className="form-grid-6">
          <div className="form-field col-span-2">
            <label>Customer</label>
            <input className="report-input" value={form.customer} onChange={e => setForm(p => ({ ...p, customer: e.target.value }))} readOnly={!isEditing} />
          </div>
          <div className="form-field col-span-2">
            <label>Site Address</label>
            <input className="report-input" value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} readOnly={!isEditing} />
          </div>
          <div className="form-field">
            <label>Job #</label>
            <input className="report-input" value={form.jobNumber} onChange={e => setForm(p => ({ ...p, jobNumber: e.target.value }))} readOnly={!isEditing} />
          </div>
          <div className="form-field">
            <label>Date</label>
            <input type="date" className="report-input" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} readOnly={!isEditing} />
          </div>
          <div className="form-field">
            <label>User</label>
            <input className="report-input" value={form.user} onChange={e => setForm(p => ({ ...p, user: e.target.value }))} readOnly={!isEditing} />
          </div>
          <div className="form-field">
            <label>Technicians</label>
            <input className="report-input" value={form.technicians} onChange={e => setForm(p => ({ ...p, technicians: e.target.value }))} readOnly={!isEditing} />
          </div>
          <div className="form-field">
            <label>Identifier</label>
            <input className="report-input" value={form.identifier} onChange={e => setForm(p => ({ ...p, identifier: e.target.value }))} readOnly={!isEditing} />
          </div>
          <div className="form-field">
            <label>Substation</label>
            <input className="report-input" value={form.substation} onChange={e => setForm(p => ({ ...p, substation: e.target.value }))} readOnly={!isEditing} />
          </div>
          <div className="form-field">
            <label>Eqpt. Location</label>
            <input className="report-input" value={form.eqptLocation} onChange={e => setForm(p => ({ ...p, eqptLocation: e.target.value }))} readOnly={!isEditing} />
          </div>
          <div className="form-field temp-field">
            <label>Temp.</label>
            <div className="temp-inputs">
              <input
                type="number"
                className="report-input"
                style={{ width: 60 }}
                value={form.temperature.fahrenheit}
                onChange={e => {
                  const f = Number(e.target.value);
                  const c = fahrenheitToCelsius(f);
                  setForm(p => ({ ...p, temperature: { ...p.temperature, fahrenheit: f, celsius: c } }));
                }}
                readOnly={!isEditing}
              />
              <span>°F</span>
              <span className="temp-celsius">{form.temperature.celsius}°C</span>
              <span className="temp-label">TCF</span>
              <span className="temp-value">{(form.temperature.tcf || 1).toFixed(3)}</span>
            </div>
          </div>
          <div className="form-field">
            <label>Humidity</label>
            <div className="humidity-input">
              <input type="number" className="report-input" value={form.temperature.humidity} onChange={e => setForm(p => ({ ...p, temperature: { ...p.temperature, humidity: Number(e.target.value) } }))} readOnly={!isEditing} />
              <span>%</span>
            </div>
          </div>
        </div>
      </ReportSection>

      {/* Nameplate Data */}
      <ReportSection title="Nameplate Data">
        <div className="form-grid-4">
          <div className="form-field">
            <label>Manufacturer</label>
            <input className="report-input" value={form.nameplate.manufacturer} onChange={e => setForm(p => ({ ...p, nameplate: { ...p.nameplate, manufacturer: e.target.value } }))} readOnly={!isEditing} />
          </div>
          <div className="form-field">
            <label>I.C. Rating (kA)</label>
            <input className="report-input" value={form.nameplate.icRatingKa} onChange={e => setForm(p => ({ ...p, nameplate: { ...p.nameplate, icRatingKa: e.target.value } }))} readOnly={!isEditing} />
          </div>
          <div className="form-field">
            <label>Catalog Number</label>
            <input className="report-input" value={form.nameplate.catalogNumber} onChange={e => setForm(p => ({ ...p, nameplate: { ...p.nameplate, catalogNumber: e.target.value } }))} readOnly={!isEditing} />
          </div>
          <div className="form-field">
            <label>Rated Voltage (kV)</label>
            <input className="report-input" value={form.nameplate.ratedVoltageKv} onChange={e => setForm(p => ({ ...p, nameplate: { ...p.nameplate, ratedVoltageKv: e.target.value } }))} readOnly={!isEditing} />
          </div>
          <div className="form-field">
            <label>Serial Number</label>
            <input className="report-input" value={form.nameplate.serialNumber} onChange={e => setForm(p => ({ ...p, nameplate: { ...p.nameplate, serialNumber: e.target.value } }))} readOnly={!isEditing} />
          </div>
          <div className="form-field">
            <label>Operating Voltage (kV)</label>
            <input className="report-input" value={form.nameplate.operatingVoltageKv} onChange={e => setForm(p => ({ ...p, nameplate: { ...p.nameplate, operatingVoltageKv: e.target.value } }))} readOnly={!isEditing} />
          </div>
          <div className="form-field">
            <label>Type</label>
            <input className="report-input" value={form.nameplate.type} onChange={e => setForm(p => ({ ...p, nameplate: { ...p.nameplate, type: e.target.value } }))} readOnly={!isEditing} />
          </div>
          <div className="form-field">
            <label>Ampacity</label>
            <input className="report-input" value={form.nameplate.ampacity} onChange={e => setForm(p => ({ ...p, nameplate: { ...p.nameplate, ampacity: e.target.value } }))} readOnly={!isEditing} />
          </div>
          <div className="form-field">
            <label>Manufacturing Date</label>
            <input className="report-input" value={form.nameplate.mfgDate} onChange={e => setForm(p => ({ ...p, nameplate: { ...p.nameplate, mfgDate: e.target.value } }))} readOnly={!isEditing} />
          </div>
          <div className="form-field">
            <label>Impulse Rating (BIL)</label>
            <input className="report-input" value={form.nameplate.impulseBil} onChange={e => setForm(p => ({ ...p, nameplate: { ...p.nameplate, impulseBil: e.target.value } }))} readOnly={!isEditing} />
          </div>
        </div>
      </ReportSection>

      {/* Visual and Mechanical Inspection */}
      <ReportSection title="Visual and Mechanical Inspection" subtitle="NETA Section 7.5.1.2">
        <table className="report-table neta-table">
          <thead>
            <tr>
              <th style={{ width: 120 }}>NETA Section</th>
              <th>Description</th>
              <th style={{ width: 150 }}>Results</th>
            </tr>
          </thead>
          <tbody>
            {form.visual.map((row, idx) => (
              <tr key={row.neta}>
                <td>{row.neta}</td>
                <td>{row.description}</td>
                <td>
                  <select
                    className="report-input"
                    value={row.result}
                    onChange={e => {
                      if (!isEditing) return;
                      setForm(prev => ({
                        ...prev,
                        visual: prev.visual.map((r, i) => i === idx ? { ...r, result: e.target.value } : r)
                      }));
                    }}
                    disabled={!isEditing}
                  >
                    {VISUAL_INSPECTION_OPTIONS.map(opt => (
                      <option key={opt} value={opt === 'Select One' ? '' : opt}>{opt}</option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </ReportSection>

      {/* Fuse Data */}
      <ReportSection title="Fuse Data">
        <div className="form-grid-3">
          <div className="form-field">
            <label>Manufacturer</label>
            <input className="report-input" value={form.fuseData.manufacturer} onChange={e => setForm(p => ({ ...p, fuseData: { ...p.fuseData, manufacturer: e.target.value } }))} readOnly={!isEditing} />
          </div>
          <div className="form-field">
            <label>Catalog No.</label>
            <input className="report-input" value={form.fuseData.catalogNumber} onChange={e => setForm(p => ({ ...p, fuseData: { ...p.fuseData, catalogNumber: e.target.value } }))} readOnly={!isEditing} />
          </div>
          <div className="form-field">
            <label>Class</label>
            <input className="report-input" value={form.fuseData.className} onChange={e => setForm(p => ({ ...p, fuseData: { ...p.fuseData, className: e.target.value } }))} readOnly={!isEditing} />
          </div>
          <div className="form-field">
            <label>Rated Voltage (kV)</label>
            <input className="report-input" value={form.fuseData.ratedVoltageKv} onChange={e => setForm(p => ({ ...p, fuseData: { ...p.fuseData, ratedVoltageKv: e.target.value } }))} readOnly={!isEditing} />
          </div>
          <div className="form-field">
            <label>Ampacity (A)</label>
            <input className="report-input" value={form.fuseData.ampacityA} onChange={e => setForm(p => ({ ...p, fuseData: { ...p.fuseData, ampacityA: e.target.value } }))} readOnly={!isEditing} />
          </div>
          <div className="form-field">
            <label>I.C. Rating (kA)</label>
            <input className="report-input" value={form.fuseData.icRatingKa} onChange={e => setForm(p => ({ ...p, fuseData: { ...p.fuseData, icRatingKa: e.target.value } }))} readOnly={!isEditing} />
          </div>
        </div>
      </ReportSection>

      {/* Electrical Tests */}
      <ReportSection title="Electrical Tests">
        {/* Contact Resistance */}
        <div style={{ display: 'flex', gap: 24, marginBottom: 24 }}>
          <ContactTable title="Contact Resistance (As Found)" dataKey="contactAsFound" />
          <ContactTable title="Contact Resistance (As Left)" dataKey="contactAsLeft" />
        </div>

        {/* Insulation Resistance */}
        <div style={{ display: 'flex', gap: 24, marginBottom: 24 }}>
          <div style={{ flex: 1 }}>
            <div className="test-voltage-row">
              <label>Insulation Resistance - Test Voltage:</label>
              <select
                className="report-input"
                style={{ width: 120 }}
                value={form.insulation.testVoltage}
                onChange={e => setForm(p => ({ ...p, insulation: { ...p.insulation, testVoltage: e.target.value } }))}
                disabled={!isEditing}
              >
                {testVoltageOptions.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
            <table className="report-table compact">
              <thead>
                <tr>
                  <th></th>
                  <th>P1 MΩ</th>
                  <th>P2 MΩ</th>
                  <th>P3 MΩ</th>
                </tr>
              </thead>
              <tbody>
                {form.insulation.rows.map((r, idx) => (
                  <tr key={r.label}>
                    <td style={{ fontWeight: 500 }}>{r.label} <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>({r.position})</span></td>
                    {(['p1', 'p2', 'p3'] as const).map(ph => (
                      <td key={ph}>
                        <input
                          className="report-input"
                          value={r.readings[ph]}
                          onChange={e => setForm(p => ({
                            ...p,
                            insulation: {
                              ...p.insulation,
                              rows: p.insulation.rows.map((rr, i) => i === idx ? { ...rr, readings: { ...rr.readings, [ph]: e.target.value } } : rr)
                            }
                          }))}
                          readOnly={!isEditing}
                          style={{ textAlign: 'center' }}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ flex: 1 }}>
            <h4 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: 8, marginTop: 48 }}>Temperature Corrected</h4>
            <table className="report-table compact">
              <thead>
                <tr>
                  <th>P1 MΩ</th>
                  <th>P2 MΩ</th>
                  <th>P3 MΩ</th>
                </tr>
              </thead>
              <tbody>
                {form.insulationCorrected.rows.map(r => (
                  <tr key={r.label} className="corrected-row">
                    <td><input className="report-input calculated" value={r.readings.p1} readOnly style={{ textAlign: 'center' }} /></td>
                    <td><input className="report-input calculated" value={r.readings.p2} readOnly style={{ textAlign: 'center' }} /></td>
                    <td><input className="report-input calculated" value={r.readings.p3} readOnly style={{ textAlign: 'center' }} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Dielectric Withstand */}
        <h4 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: 8 }}>Dielectric Withstand Phase to Ground</h4>
        <table className="report-table compact">
          <thead>
            <tr>
              <th>Test Voltage</th>
              <th>Test Duration</th>
              <th>P1</th>
              <th>P2</th>
              <th>P3</th>
              <th>Units</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <input className="report-input" value={form.dielectric.testVoltage} onChange={e => setForm(p => ({ ...p, dielectric: { ...p.dielectric, testVoltage: e.target.value } }))} readOnly={!isEditing} style={{ textAlign: 'center' }} />
              </td>
              <td>
                <input className="report-input" value={form.dielectric.duration} onChange={e => setForm(p => ({ ...p, dielectric: { ...p.dielectric, duration: e.target.value } }))} readOnly={!isEditing} style={{ textAlign: 'center' }} />
              </td>
              <td>
                <input className="report-input" value={form.dielectric.p1} onChange={e => setForm(p => ({ ...p, dielectric: { ...p.dielectric, p1: e.target.value } }))} readOnly={!isEditing} style={{ textAlign: 'center' }} />
              </td>
              <td>
                <input className="report-input" value={form.dielectric.p2} onChange={e => setForm(p => ({ ...p, dielectric: { ...p.dielectric, p2: e.target.value } }))} readOnly={!isEditing} style={{ textAlign: 'center' }} />
              </td>
              <td>
                <input className="report-input" value={form.dielectric.p3} onChange={e => setForm(p => ({ ...p, dielectric: { ...p.dielectric, p3: e.target.value } }))} readOnly={!isEditing} style={{ textAlign: 'center' }} />
              </td>
              <td>
                <select className="report-input" value={form.dielectric.units} onChange={e => setForm(p => ({ ...p, dielectric: { ...p.dielectric, units: e.target.value } }))} disabled={!isEditing}>
                  <option value="mA">mA</option>
                  <option value="µA">µA</option>
                </select>
              </td>
            </tr>
          </tbody>
        </table>
      </ReportSection>

      {/* Test Equipment Used */}
      <ReportSection title="Test Equipment Used">
        <div className="equipment-grid">
          {[
            ['megohmmeter', 'Megohmmeter'],
            ['lowResistanceOhmmeter', 'Low-Resistance Ohmmeter'],
            ['hipot', 'Hipot']
          ].map(([key, label]) => (
            <div key={key} className="equipment-row">
              <label>{label}:</label>
              <input className="report-input" value={(form.equipmentUsed as any)[key]?.name || ''} onChange={e => setForm(p => ({ ...p, equipmentUsed: { ...p.equipmentUsed, [key]: { ...(p.equipmentUsed as any)[key], name: e.target.value } } }))} readOnly={!isEditing} />
              <label>Serial Number:</label>
              <input className="report-input" value={(form.equipmentUsed as any)[key]?.serialNumber || ''} onChange={e => setForm(p => ({ ...p, equipmentUsed: { ...p.equipmentUsed, [key]: { ...(p.equipmentUsed as any)[key], serialNumber: e.target.value } } }))} readOnly={!isEditing} />
              <label>AMP ID:</label>
              <input className="report-input" value={(form.equipmentUsed as any)[key]?.ampId || ''} onChange={e => setForm(p => ({ ...p, equipmentUsed: { ...p.equipmentUsed, [key]: { ...(p.equipmentUsed as any)[key], ampId: e.target.value } } }))} readOnly={!isEditing} />
            </div>
          ))}
        </div>
      </ReportSection>

      {/* Comments */}
      <ReportSection title="Comments">
        <textarea
          className="report-textarea"
          rows={4}
          value={form.comments}
          onChange={e => setForm(p => ({ ...p, comments: e.target.value }))}
          readOnly={!isEditing}
        />
      </ReportSection>

      {/* Back button */}
      <div style={{ marginTop: 24 }}>
        <button className="btn-secondary" onClick={() => navigate('/')}>
          ← Back to Jobs
        </button>
      </div>
    </div>
  );
}
