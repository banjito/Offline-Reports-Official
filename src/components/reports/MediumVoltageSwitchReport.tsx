/**
 * Medium Voltage Switch Report (Oil & SF6)
 * Desktop offline version
 */

import { useState, useEffect } from 'react';
import { Job } from '../../types';
import {
  ReportSection,
  ReportInput,
  ReportSelect,
  JobInfoSection,
  VisualInspectionSection,
  TestEquipmentSection,
  CommentsSection,
  ReportHeader,
  useReportState,
  multiplyByTCF,
  IR_UNITS,
  CONTACT_RESISTANCE_UNITS,
  TEST_VOLTAGE_OPTIONS
} from './BaseReport';
import './ReportStyles.css';

interface Props {
  job: Job | null;
  reportData: any;
  onSave: (data: any) => void;
  variant?: 'oil' | 'sf6';
}

const DIELECTRIC_VOLTAGE_OPTIONS = [
  '1.6 kVAC', '2.2 kVAC', '14 kVAC', '25 kVAC', '27 kVAC', '30 kVAC', '37 kVAC', '45 kVAC', '60 kVAC', '120 kVAC',
  '2.3 kVDC', '3.1 kVDC', '20 kVDC', '30.5 kVDC', '37.5 kVDC'
];

const DIELECTRIC_UNITS = ['μA', 'mA'];

// Visual inspection items for MV Switch
const MV_SWITCH_INSPECTION_ITEMS = [
  { id: '7.5.4.A.1', description: 'Compare equipment nameplate data with drawings.' },
  { id: '7.5.4.A.2', description: 'Inspect physical and mechanical condition.' },
  { id: '7.5.4.A.3', description: 'Inspect anchorage, alignment, grounding, and required clearances.' },
  { id: '7.5.4.A.4', description: 'Verify the unit is clean.' },
  { id: '7.5.4.A.5', description: 'Inspect and service mechanical operator and insulated system in accordance with manufacturer\'s published data.' },
  { id: '7.5.4.A.6', description: 'Verify correct operation of alarms and limit switches, as recommended by the manufacturer.' },
  { id: '7.5.4.A.7', description: 'Measure critical distances as recommended by the manufacturer.' },
  { id: '7.5.4.A.8', description: 'Verify operation and sequencing of interlocking systems.' },
  { id: '7.5.4.A.9', description: 'Verify that each fuse holder has adequate mechanical support and contact integrity.' },
  { id: '7.5.4.A.10', description: 'Verify that fuse sizes and types are in accordance with drawings, short-circuit study, and manufacturer\'s data.' },
  { id: '7.5.4.A.12', description: 'Verify appropriate lubrication on moving, current-carrying parts and on moving and sliding surfaces.' },
  { id: '7.5.4.A.13', description: 'Test for leaks in accordance with manufacturer\'s published data.' },
];

// Default insulation row
const createInsulationRow = (waySection: string) => ({
  waySection,
  ag: '', bg: '', cg: '', ab: '', bc: '', ca: '',
  lineA: '', lineB: '', lineC: '',
  units: 'MΩ'
});

// Default contact row
const createContactRow = (waySection: string) => ({
  waySection,
  aPhase: '', aG: '', bPhase: '', bG: '', cPhase: '', cG: '',
  units: 'μΩ'
});

// Default dielectric row
const createDielectricRow = (waySection: string) => ({
  waySection,
  ag: '', bg: '', cg: '',
  units: 'μA'
});

export function MediumVoltageSwitchReport({ job, reportData, onSave, variant = 'oil' }: Props) {
  const initialData = {
    customer: job?.customer_name || reportData?.customer || '',
    jobNumber: job?.job_number || reportData?.jobNumber || '',
    technicians: reportData?.technicians || '',
    date: reportData?.date || new Date().toISOString().split('T')[0],
    identifier: reportData?.identifier || '',
    substation: reportData?.substation || '',
    eqptLocation: reportData?.eqptLocation || '',
    user: reportData?.user || '',
    temperature: {
      fahrenheit: reportData?.temperature?.fahrenheit ?? 68,
      celsius: reportData?.temperature?.celsius ?? 20,
      tcf: reportData?.temperature?.tcf ?? 1,
      humidity: reportData?.temperature?.humidity ?? ''
    },
    status: reportData?.status || 'PASS',
    // Nameplate
    nameplate: {
      manufacturer: reportData?.nameplate?.manufacturer || '',
      catalogNo: reportData?.nameplate?.catalogNo || '',
      serialNumber: reportData?.nameplate?.serialNumber || '',
      dateOfMfg: reportData?.nameplate?.dateOfMfg || '',
      type: reportData?.nameplate?.type || '',
      systemVoltage: reportData?.nameplate?.systemVoltage || '',
      ratedVoltage: reportData?.nameplate?.ratedVoltage || '',
      ratedCurrent: reportData?.nameplate?.ratedCurrent || '',
      aicRating: reportData?.nameplate?.aicRating || '',
      impulseLevelBIL: reportData?.nameplate?.impulseLevelBIL || '',
      ...(variant === 'sf6' ? { sf6GasMass: reportData?.nameplate?.sf6GasMass || '' } : { oilType: reportData?.nameplate?.oilType || '', oilVolume: reportData?.nameplate?.oilVolume || '' })
    },
    // VFI Data
    vfi: {
      manufacturer: reportData?.vfi?.manufacturer || '',
      catalogNo: reportData?.vfi?.catalogNo || '',
      type: reportData?.vfi?.type || '',
      ratedVoltage: reportData?.vfi?.ratedVoltage || '',
      ratedCurrent: reportData?.vfi?.ratedCurrent || '',
      aicRating: reportData?.vfi?.aicRating || ''
    },
    // Visual inspection
    visualInspection: MV_SWITCH_INSPECTION_ITEMS.map(item => ({
      id: item.id,
      description: item.description,
      result: reportData?.visualInspection?.[item.id] || 'Select One',
      comments: ''
    })),
    // Counter readings
    counterReadings: reportData?.counterReadings || [
      { identifier: 'Source 1', asFound: '', asLeft: '' },
      { identifier: 'Source 2', asFound: '', asLeft: '' },
      { identifier: 'Feeder 1', asFound: '', asLeft: '' },
    ],
    // Insulation resistance measured
    insulationMeasured: {
      testVoltage: reportData?.insulationMeasured?.testVoltage || '5000V',
      rows: reportData?.insulationMeasured?.rows || [
        createInsulationRow('Source 1'),
        createInsulationRow('Source 2'),
        createInsulationRow('Source 3'),
        createInsulationRow('Feeder 1'),
        createInsulationRow('Feeder 2'),
        createInsulationRow('Feeder 3'),
      ]
    },
    // Insulation resistance corrected (calculated)
    insulationCorrected: {
      testVoltage: reportData?.insulationCorrected?.testVoltage || '5000V',
      rows: reportData?.insulationCorrected?.rows || [
        createInsulationRow('Source 1'),
        createInsulationRow('Source 2'),
        createInsulationRow('Source 3'),
        createInsulationRow('Feeder 1'),
        createInsulationRow('Feeder 2'),
        createInsulationRow('Feeder 3'),
      ]
    },
    // Contact resistance
    contactResistance: {
      rows: reportData?.contactResistance?.rows || [
        createContactRow('S1-F1'),
        createContactRow('S2-F1'),
        createContactRow('Source 1'),
        createContactRow('Source 2'),
        createContactRow('Feeder 1'),
        createContactRow('Feeder 2'),
      ]
    },
    // Dielectric withstand
    dielectricWithstand: {
      testVoltage: reportData?.dielectricWithstand?.testVoltage || '10 kVAC',
      rows: reportData?.dielectricWithstand?.rows || [
        createDielectricRow('Source 1'),
        createDielectricRow('Source 2'),
        createDielectricRow('Feeder 1'),
      ]
    },
    // Dielectric VFI
    dielectricVFI: {
      testVoltage: reportData?.dielectricVFI?.testVoltage || '30 kVAC',
      rows: reportData?.dielectricVFI?.rows || [
        { vfiIdentifier: 'Feeder 1', serialNumber: '', a: '', b: '', c: '', units: 'μA' },
        { vfiIdentifier: 'Feeder 2', serialNumber: '', a: '', b: '', c: '', units: 'μA' },
        { vfiIdentifier: 'Feeder 3', serialNumber: '', a: '', b: '', c: '', units: 'μA' },
      ]
    },
    // Test equipment
    testEquipment: {
      megohmmeter: reportData?.testEquipment?.megohmmeter || { name: '', serialNumber: '', ampId: '' },
      lowResistance: reportData?.testEquipment?.lowResistance || { name: '', serialNumber: '', ampId: '' },
      hipot: reportData?.testEquipment?.hipot || { name: '', serialNumber: '', ampId: '' }
    },
    comments: reportData?.comments || ''
  };

  const { formData, setFormData, setField, isEditing, setIsEditing } = useReportState(initialData);
  const [status, setStatus] = useState<'PASS' | 'FAIL'>(initialData.status as 'PASS' | 'FAIL');

  // Auto-calculate corrected insulation resistance when temperature or measured values change
  useEffect(() => {
    const tcf = formData.temperature?.tcf || 1;
    const correctedRows = formData.insulationMeasured.rows.map((row: any) => ({
      ...row,
      ag: multiplyByTCF(row.ag, tcf),
      bg: multiplyByTCF(row.bg, tcf),
      cg: multiplyByTCF(row.cg, tcf),
      ab: multiplyByTCF(row.ab, tcf),
      bc: multiplyByTCF(row.bc, tcf),
      ca: multiplyByTCF(row.ca, tcf),
      lineA: multiplyByTCF(row.lineA, tcf),
      lineB: multiplyByTCF(row.lineB, tcf),
      lineC: multiplyByTCF(row.lineC, tcf),
    }));
    setFormData((prev: any) => ({
      ...prev,
      insulationCorrected: {
        ...prev.insulationCorrected,
        rows: correctedRows
      }
    }));
  }, [formData.temperature?.tcf, formData.insulationMeasured.rows]);

  const handleSave = () => {
    const dataToSave = {
      ...formData,
      status,
      visualInspection: Object.fromEntries(formData.visualInspection.map((item: any) => [item.id, item.result]))
    };
    onSave(dataToSave);
    setIsEditing(false);
  };

  const updateInsulationRow = (section: 'insulationMeasured' | 'insulationCorrected', idx: number, field: string, value: string) => {
    setFormData((prev: any) => ({
      ...prev,
      [section]: {
        ...prev[section],
        rows: prev[section].rows.map((r: any, i: number) => i === idx ? { ...r, [field]: value } : r)
      }
    }));
  };

  const updateContactRow = (idx: number, field: string, value: string) => {
    setFormData((prev: any) => ({
      ...prev,
      contactResistance: {
        ...prev.contactResistance,
        rows: prev.contactResistance.rows.map((r: any, i: number) => i === idx ? { ...r, [field]: value } : r)
      }
    }));
  };

  const updateDielectricRow = (idx: number, field: string, value: string) => {
    setFormData((prev: any) => ({
      ...prev,
      dielectricWithstand: {
        ...prev.dielectricWithstand,
        rows: prev.dielectricWithstand.rows.map((r: any, i: number) => i === idx ? { ...r, [field]: value } : r)
      }
    }));
  };

  const updateDielectricVFIRow = (idx: number, field: string, value: string) => {
    setFormData((prev: any) => ({
      ...prev,
      dielectricVFI: {
        ...prev.dielectricVFI,
        rows: prev.dielectricVFI.rows.map((r: any, i: number) => i === idx ? { ...r, [field]: value } : r)
      }
    }));
  };

  const updateCounterRow = (idx: number, field: string, value: string) => {
    setFormData((prev: any) => ({
      ...prev,
      counterReadings: prev.counterReadings.map((r: any, i: number) => i === idx ? { ...r, [field]: value } : r)
    }));
  };

  const reportTitle = variant === 'sf6' 
    ? 'Medium Voltage Way Switch (SF6) Report ATS 21'
    : '7-Medium Voltage Way Switch (OIL) Report ATS 21';

  return (
    <div className="report-container">
      <ReportHeader
        title={reportTitle}
        status={status}
        onStatusChange={() => setStatus(s => s === 'PASS' ? 'FAIL' : 'PASS')}
        isEditing={isEditing}
        onEdit={() => setIsEditing(true)}
        onSave={handleSave}
      />

      <JobInfoSection data={formData} onChange={setField} isEditing={isEditing} />

      {/* Nameplate Data */}
      <ReportSection title="Nameplate Data">
        <div className="form-grid-4">
          <div className="form-field">
            <label>Manufacturer:</label>
            <ReportInput value={formData.nameplate.manufacturer} onChange={v => setField('nameplate.manufacturer', v)} readOnly={!isEditing} />
          </div>
          <div className="form-field">
            <label>Catalog No:</label>
            <ReportInput value={formData.nameplate.catalogNo} onChange={v => setField('nameplate.catalogNo', v)} readOnly={!isEditing} />
          </div>
          <div className="form-field">
            <label>Serial Number:</label>
            <ReportInput value={formData.nameplate.serialNumber} onChange={v => setField('nameplate.serialNumber', v)} readOnly={!isEditing} />
          </div>
          <div className="form-field">
            <label>Date of Mfg:</label>
            <ReportInput value={formData.nameplate.dateOfMfg} onChange={v => setField('nameplate.dateOfMfg', v)} readOnly={!isEditing} />
          </div>
          <div className="form-field">
            <label>Type:</label>
            <ReportInput value={formData.nameplate.type} onChange={v => setField('nameplate.type', v)} readOnly={!isEditing} />
          </div>
          <div className="form-field">
            <label>System Voltage:</label>
            <ReportInput value={formData.nameplate.systemVoltage} onChange={v => setField('nameplate.systemVoltage', v)} readOnly={!isEditing} />
          </div>
          <div className="form-field">
            <label>Rated Voltage:</label>
            <ReportInput value={formData.nameplate.ratedVoltage} onChange={v => setField('nameplate.ratedVoltage', v)} readOnly={!isEditing} />
          </div>
          <div className="form-field">
            <label>Rated Current:</label>
            <ReportInput value={formData.nameplate.ratedCurrent} onChange={v => setField('nameplate.ratedCurrent', v)} readOnly={!isEditing} />
          </div>
          <div className="form-field">
            <label>AIC Rating:</label>
            <ReportInput value={formData.nameplate.aicRating} onChange={v => setField('nameplate.aicRating', v)} readOnly={!isEditing} />
          </div>
          <div className="form-field">
            <label>Impulse Level (BIL):</label>
            <ReportInput value={formData.nameplate.impulseLevelBIL} onChange={v => setField('nameplate.impulseLevelBIL', v)} readOnly={!isEditing} />
          </div>
          {variant === 'sf6' ? (
            <div className="form-field">
              <label>SF6 Gas Mass:</label>
              <ReportInput value={(formData.nameplate as any).sf6GasMass || ''} onChange={v => setField('nameplate.sf6GasMass', v)} readOnly={!isEditing} />
            </div>
          ) : (
            <>
              <div className="form-field">
                <label>Oil Type:</label>
                <ReportInput value={(formData.nameplate as any).oilType || ''} onChange={v => setField('nameplate.oilType', v)} readOnly={!isEditing} />
              </div>
              <div className="form-field">
                <label>Oil Volume:</label>
                <ReportInput value={(formData.nameplate as any).oilVolume || ''} onChange={v => setField('nameplate.oilVolume', v)} readOnly={!isEditing} />
              </div>
            </>
          )}
        </div>
      </ReportSection>

      {/* VFI Data */}
      <ReportSection title="VFI Data">
        <div className="form-grid-3">
          <div className="form-field">
            <label>Manufacturer:</label>
            <ReportInput value={formData.vfi.manufacturer} onChange={v => setField('vfi.manufacturer', v)} readOnly={!isEditing} />
          </div>
          <div className="form-field">
            <label>Catalog No:</label>
            <ReportInput value={formData.vfi.catalogNo} onChange={v => setField('vfi.catalogNo', v)} readOnly={!isEditing} />
          </div>
          <div className="form-field">
            <label>Type:</label>
            <ReportInput value={formData.vfi.type} onChange={v => setField('vfi.type', v)} readOnly={!isEditing} />
          </div>
          <div className="form-field">
            <label>Rated Voltage:</label>
            <ReportInput value={formData.vfi.ratedVoltage} onChange={v => setField('vfi.ratedVoltage', v)} readOnly={!isEditing} />
          </div>
          <div className="form-field">
            <label>Rated Current:</label>
            <ReportInput value={formData.vfi.ratedCurrent} onChange={v => setField('vfi.ratedCurrent', v)} readOnly={!isEditing} />
          </div>
          <div className="form-field">
            <label>AIC Rating:</label>
            <ReportInput value={formData.vfi.aicRating} onChange={v => setField('vfi.aicRating', v)} readOnly={!isEditing} />
          </div>
        </div>
      </ReportSection>

      {/* Visual Inspection */}
      <VisualInspectionSection
        items={formData.visualInspection}
        onChange={items => setFormData((prev: any) => ({ ...prev, visualInspection: items }))}
        isEditing={isEditing}
        netaSection="7.5.4"
      />

      {/* Counter Readings */}
      <ReportSection title="Counter Readings">
        <div className="table-container">
          <table className="report-table">
            <thead>
              <tr>
                <th>Identifier</th>
                <th>As Found</th>
                <th>As Left</th>
              </tr>
            </thead>
            <tbody>
              {formData.counterReadings.map((row: any, idx: number) => (
                <tr key={idx}>
                  <td>
                    <ReportInput value={row.identifier} onChange={v => updateCounterRow(idx, 'identifier', v)} readOnly={!isEditing} />
                  </td>
                  <td>
                    <ReportInput value={row.asFound} onChange={v => updateCounterRow(idx, 'asFound', v)} readOnly={!isEditing} />
                  </td>
                  <td>
                    <ReportInput value={row.asLeft} onChange={v => updateCounterRow(idx, 'asLeft', v)} readOnly={!isEditing} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ReportSection>

      {/* Insulation Resistance - Measured */}
      <ReportSection title="Electrical Tests - Measured Insulation Resistance Values">
        <div className="test-voltage-row">
          <label>Test Voltage:</label>
          <ReportSelect
            value={formData.insulationMeasured.testVoltage}
            options={TEST_VOLTAGE_OPTIONS}
            onChange={v => setField('insulationMeasured.testVoltage', v)}
            disabled={!isEditing}
          />
        </div>
        <div className="table-container">
          <table className="report-table compact">
            <thead>
              <tr>
                <th>Way Section</th>
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
              {formData.insulationMeasured.rows.map((row: any, idx: number) => (
                <tr key={idx}>
                  <td>{row.waySection}</td>
                  <td><ReportInput value={row.ag} onChange={v => updateInsulationRow('insulationMeasured', idx, 'ag', v)} readOnly={!isEditing} /></td>
                  <td><ReportInput value={row.bg} onChange={v => updateInsulationRow('insulationMeasured', idx, 'bg', v)} readOnly={!isEditing} /></td>
                  <td><ReportInput value={row.cg} onChange={v => updateInsulationRow('insulationMeasured', idx, 'cg', v)} readOnly={!isEditing} /></td>
                  <td><ReportInput value={row.ab} onChange={v => updateInsulationRow('insulationMeasured', idx, 'ab', v)} readOnly={!isEditing} /></td>
                  <td><ReportInput value={row.bc} onChange={v => updateInsulationRow('insulationMeasured', idx, 'bc', v)} readOnly={!isEditing} /></td>
                  <td><ReportInput value={row.ca} onChange={v => updateInsulationRow('insulationMeasured', idx, 'ca', v)} readOnly={!isEditing} /></td>
                  <td><ReportInput value={row.lineA} onChange={v => updateInsulationRow('insulationMeasured', idx, 'lineA', v)} readOnly={!isEditing} /></td>
                  <td><ReportInput value={row.lineB} onChange={v => updateInsulationRow('insulationMeasured', idx, 'lineB', v)} readOnly={!isEditing} /></td>
                  <td><ReportInput value={row.lineC} onChange={v => updateInsulationRow('insulationMeasured', idx, 'lineC', v)} readOnly={!isEditing} /></td>
                  <td>
                    <ReportSelect
                      value={row.units}
                      options={IR_UNITS.map(u => u.symbol)}
                      onChange={v => updateInsulationRow('insulationMeasured', idx, 'units', v)}
                      disabled={!isEditing}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ReportSection>

      {/* Insulation Resistance - Corrected (Read-only) */}
      <ReportSection title="Electrical Tests - Temperature Corrected Insulation Resistance Values">
        <p className="calculated-note">Values automatically calculated using TCF = {(formData.temperature?.tcf || 1).toFixed(3)}</p>
        <div className="table-container">
          <table className="report-table compact">
            <thead>
              <tr>
                <th>Way Section</th>
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
              {formData.insulationCorrected.rows.map((row: any, idx: number) => (
                <tr key={idx}>
                  <td>{row.waySection}</td>
                  <td><ReportInput value={row.ag} readOnly calculated /></td>
                  <td><ReportInput value={row.bg} readOnly calculated /></td>
                  <td><ReportInput value={row.cg} readOnly calculated /></td>
                  <td><ReportInput value={row.ab} readOnly calculated /></td>
                  <td><ReportInput value={row.bc} readOnly calculated /></td>
                  <td><ReportInput value={row.ca} readOnly calculated /></td>
                  <td><ReportInput value={row.lineA} readOnly calculated /></td>
                  <td><ReportInput value={row.lineB} readOnly calculated /></td>
                  <td><ReportInput value={row.lineC} readOnly calculated /></td>
                  <td>{row.units || 'MΩ'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ReportSection>

      {/* Contact Resistance */}
      <ReportSection title="Electrical Tests - Contact Resistance">
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
              {formData.contactResistance.rows.map((row: any, idx: number) => (
                <tr key={idx}>
                  <td>{row.waySection}</td>
                  <td><ReportInput value={row.aPhase} onChange={v => updateContactRow(idx, 'aPhase', v)} readOnly={!isEditing} /></td>
                  <td><ReportInput value={row.aG} onChange={v => updateContactRow(idx, 'aG', v)} readOnly={!isEditing} /></td>
                  <td><ReportInput value={row.bPhase} onChange={v => updateContactRow(idx, 'bPhase', v)} readOnly={!isEditing} /></td>
                  <td><ReportInput value={row.bG} onChange={v => updateContactRow(idx, 'bG', v)} readOnly={!isEditing} /></td>
                  <td><ReportInput value={row.cPhase} onChange={v => updateContactRow(idx, 'cPhase', v)} readOnly={!isEditing} /></td>
                  <td><ReportInput value={row.cG} onChange={v => updateContactRow(idx, 'cG', v)} readOnly={!isEditing} /></td>
                  <td>
                    <ReportSelect
                      value={row.units}
                      options={CONTACT_RESISTANCE_UNITS.map(u => u.symbol)}
                      onChange={v => updateContactRow(idx, 'units', v)}
                      disabled={!isEditing}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ReportSection>

      {/* Dielectric Withstand */}
      <ReportSection title="Dielectric Withstand Tests">
        <div className="test-voltage-row">
          <label>Test Voltage:</label>
          <ReportSelect
            value={formData.dielectricWithstand.testVoltage}
            options={DIELECTRIC_VOLTAGE_OPTIONS}
            onChange={v => setField('dielectricWithstand.testVoltage', v)}
            disabled={!isEditing}
          />
        </div>
        <div className="table-container">
          <table className="report-table compact">
            <thead>
              <tr>
                <th>Way Section</th>
                <th>A-G</th>
                <th>B-G</th>
                <th>C-G</th>
                <th>Units</th>
              </tr>
            </thead>
            <tbody>
              {formData.dielectricWithstand.rows.map((row: any, idx: number) => (
                <tr key={idx}>
                  <td>{row.waySection}</td>
                  <td><ReportInput value={row.ag} onChange={v => updateDielectricRow(idx, 'ag', v)} readOnly={!isEditing} /></td>
                  <td><ReportInput value={row.bg} onChange={v => updateDielectricRow(idx, 'bg', v)} readOnly={!isEditing} /></td>
                  <td><ReportInput value={row.cg} onChange={v => updateDielectricRow(idx, 'cg', v)} readOnly={!isEditing} /></td>
                  <td>
                    <ReportSelect
                      value={row.units}
                      options={DIELECTRIC_UNITS}
                      onChange={v => updateDielectricRow(idx, 'units', v)}
                      disabled={!isEditing}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ReportSection>

      {/* Dielectric VFI Tests */}
      <ReportSection title="Dielectric Withstand - VFI Tests">
        <div className="test-voltage-row">
          <label>Test Voltage:</label>
          <ReportSelect
            value={formData.dielectricVFI.testVoltage}
            options={DIELECTRIC_VOLTAGE_OPTIONS}
            onChange={v => setField('dielectricVFI.testVoltage', v)}
            disabled={!isEditing}
          />
        </div>
        <div className="table-container">
          <table className="report-table compact">
            <thead>
              <tr>
                <th>VFI Identifier</th>
                <th>Serial Number</th>
                <th>A</th>
                <th>B</th>
                <th>C</th>
                <th>Units</th>
              </tr>
            </thead>
            <tbody>
              {formData.dielectricVFI.rows.map((row: any, idx: number) => (
                <tr key={idx}>
                  <td><ReportInput value={row.vfiIdentifier} onChange={v => updateDielectricVFIRow(idx, 'vfiIdentifier', v)} readOnly={!isEditing} /></td>
                  <td><ReportInput value={row.serialNumber} onChange={v => updateDielectricVFIRow(idx, 'serialNumber', v)} readOnly={!isEditing} /></td>
                  <td><ReportInput value={row.a} onChange={v => updateDielectricVFIRow(idx, 'a', v)} readOnly={!isEditing} /></td>
                  <td><ReportInput value={row.b} onChange={v => updateDielectricVFIRow(idx, 'b', v)} readOnly={!isEditing} /></td>
                  <td><ReportInput value={row.c} onChange={v => updateDielectricVFIRow(idx, 'c', v)} readOnly={!isEditing} /></td>
                  <td>
                    <ReportSelect
                      value={row.units}
                      options={DIELECTRIC_UNITS}
                      onChange={v => updateDielectricVFIRow(idx, 'units', v)}
                      disabled={!isEditing}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ReportSection>

      <TestEquipmentSection
        equipment={formData.testEquipment}
        onChange={eq => setFormData((prev: any) => ({ ...prev, testEquipment: eq }))}
        isEditing={isEditing}
        showHipot={true}
      />

      <CommentsSection
        comments={formData.comments}
        onChange={c => setField('comments', c)}
        isEditing={isEditing}
      />
    </div>
  );
}

export default MediumVoltageSwitchReport;

