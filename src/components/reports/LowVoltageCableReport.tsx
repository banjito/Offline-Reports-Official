/**
 * Low Voltage Cable Test Report
 * Desktop offline version
 */

import { useState, useEffect } from 'react';
import { Job } from '../../types';
import {
  ReportSection,
  ReportInput,
  ReportSelect,
  JobInfoSection,
  TestEquipmentSection,
  CommentsSection,
  ReportHeader,
  useReportState,
  multiplyByTCF,
  IR_UNITS,
  TEST_VOLTAGE_OPTIONS
} from './BaseReport';
import './ReportStyles.css';

interface Props {
  job: Job | null;
  reportData: any;
  onSave: (data: any) => void;
  variant?: '12sets' | '20sets' | '3sets';
}

interface CableSet {
  id: string;
  cableId: string;
  from: string;
  to: string;
  conductor: string;
  size: string;
  length: string;
  insulationType: string;
  // Insulation Resistance
  aToGround: string;
  bToGround: string;
  cToGround: string;
  aToB: string;
  bToC: string;
  cToA: string;
  units: string;
  // Corrected values (calculated)
  aToGroundCorrected: string;
  bToGroundCorrected: string;
  cToGroundCorrected: string;
  aToBCorrected: string;
  bToCCorrected: string;
  cToACorrected: string;
}

const createCableSet = (id: string): CableSet => ({
  id,
  cableId: '',
  from: '',
  to: '',
  conductor: 'Copper',
  size: '',
  length: '',
  insulationType: '',
  aToGround: '',
  bToGround: '',
  cToGround: '',
  aToB: '',
  bToC: '',
  cToA: '',
  units: 'MΩ',
  aToGroundCorrected: '',
  bToGroundCorrected: '',
  cToGroundCorrected: '',
  aToBCorrected: '',
  bToCCorrected: '',
  cToACorrected: ''
});

const CONDUCTOR_OPTIONS = ['Copper', 'Aluminum'];
const INSULATION_TYPES = ['XLPE', 'EPR', 'THHN', 'THWN', 'XHHW', 'USE', 'Other'];

export function LowVoltageCableReport({ job, reportData, onSave, variant = '12sets' }: Props) {
  const setCount = variant === '20sets' ? 20 : variant === '3sets' ? 3 : 12;
  
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
    testVoltage: reportData?.testVoltage || '1000V',
    testEquipment: {
      megohmmeter: reportData?.testEquipment?.megohmmeter || { name: '', serialNumber: '', ampId: '' }
    },
    comments: reportData?.comments || ''
  };

  const { formData, setFormData, setField, isEditing, setIsEditing } = useReportState(initialData);
  const [status, setStatus] = useState<'PASS' | 'FAIL'>(initialData.status as 'PASS' | 'FAIL');
  
  const [cableSets, setCableSets] = useState<CableSet[]>(() => {
    if (reportData?.cableSets && Array.isArray(reportData.cableSets)) {
      return reportData.cableSets.map((set: any, i: number) => ({
        ...createCableSet(`Set ${i + 1}`),
        ...set,
        id: `Set ${i + 1}`
      }));
    }
    return Array.from({ length: setCount }, (_, i) => createCableSet(`Set ${i + 1}`));
  });

  // Auto-calculate corrected values when temperature or measured values change
  useEffect(() => {
    const tcf = formData.temperature?.tcf || 1;
    setCableSets(prev => prev.map(set => ({
      ...set,
      aToGroundCorrected: multiplyByTCF(set.aToGround, tcf),
      bToGroundCorrected: multiplyByTCF(set.bToGround, tcf),
      cToGroundCorrected: multiplyByTCF(set.cToGround, tcf),
      aToBCorrected: multiplyByTCF(set.aToB, tcf),
      bToCCorrected: multiplyByTCF(set.bToC, tcf),
      cToACorrected: multiplyByTCF(set.cToA, tcf)
    })));
  }, [formData.temperature?.tcf]);

  const handleSave = () => {
    const dataToSave = {
      ...formData,
      status,
      cableSets
    };
    onSave(dataToSave);
    setIsEditing(false);
  };

  const updateCableSet = (idx: number, field: keyof CableSet, value: string) => {
    setCableSets(prev => {
      const updated = prev.map((set, i) => i === idx ? { ...set, [field]: value } : set);
      // Recalculate corrected values if a measured value changed
      if (['aToGround', 'bToGround', 'cToGround', 'aToB', 'bToC', 'cToA'].includes(field)) {
        const tcf = formData.temperature?.tcf || 1;
        const set = updated[idx];
        updated[idx] = {
          ...set,
          aToGroundCorrected: multiplyByTCF(set.aToGround, tcf),
          bToGroundCorrected: multiplyByTCF(set.bToGround, tcf),
          cToGroundCorrected: multiplyByTCF(set.cToGround, tcf),
          aToBCorrected: multiplyByTCF(set.aToB, tcf),
          bToCCorrected: multiplyByTCF(set.bToC, tcf),
          cToACorrected: multiplyByTCF(set.cToA, tcf)
        };
      }
      return updated;
    });
  };

  const reportTitle = variant === '20sets' 
    ? '3-Low Voltage Cable Test ATS 20 Sets'
    : variant === '3sets'
    ? '3-Low Voltage Cable MTS'
    : '3-Low Voltage Cable Test ATS';

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

      {/* Test Voltage */}
      <ReportSection title="Test Parameters">
        <div className="form-grid-2">
          <div className="form-field">
            <label>Test Voltage:</label>
            <ReportSelect
              value={formData.testVoltage}
              options={TEST_VOLTAGE_OPTIONS}
              onChange={v => setField('testVoltage', v)}
              disabled={!isEditing}
            />
          </div>
        </div>
      </ReportSection>

      {/* Cable Sets */}
      {cableSets.map((set, idx) => (
        <ReportSection key={set.id} title={`Cable Set ${idx + 1}`}>
          {/* Cable Info */}
          <div className="form-grid-4">
            <div className="form-field">
              <label>Cable ID:</label>
              <ReportInput value={set.cableId} onChange={v => updateCableSet(idx, 'cableId', v)} readOnly={!isEditing} />
            </div>
            <div className="form-field">
              <label>From:</label>
              <ReportInput value={set.from} onChange={v => updateCableSet(idx, 'from', v)} readOnly={!isEditing} />
            </div>
            <div className="form-field">
              <label>To:</label>
              <ReportInput value={set.to} onChange={v => updateCableSet(idx, 'to', v)} readOnly={!isEditing} />
            </div>
            <div className="form-field">
              <label>Conductor:</label>
              <ReportSelect
                value={set.conductor}
                options={CONDUCTOR_OPTIONS}
                onChange={v => updateCableSet(idx, 'conductor', v)}
                disabled={!isEditing}
              />
            </div>
            <div className="form-field">
              <label>Size:</label>
              <ReportInput value={set.size} onChange={v => updateCableSet(idx, 'size', v)} readOnly={!isEditing} />
            </div>
            <div className="form-field">
              <label>Length (ft):</label>
              <ReportInput value={set.length} onChange={v => updateCableSet(idx, 'length', v)} readOnly={!isEditing} />
            </div>
            <div className="form-field">
              <label>Insulation Type:</label>
              <ReportSelect
                value={set.insulationType}
                options={['', ...INSULATION_TYPES]}
                onChange={v => updateCableSet(idx, 'insulationType', v)}
                disabled={!isEditing}
              />
            </div>
            <div className="form-field">
              <label>Units:</label>
              <ReportSelect
                value={set.units}
                options={IR_UNITS.map(u => u.symbol)}
                onChange={v => updateCableSet(idx, 'units', v)}
                disabled={!isEditing}
              />
            </div>
          </div>

          {/* Insulation Resistance Table */}
          <div className="table-container">
            <table className="report-table compact">
              <thead>
                <tr>
                  <th></th>
                  <th>A-G</th>
                  <th>B-G</th>
                  <th>C-G</th>
                  <th>A-B</th>
                  <th>B-C</th>
                  <th>C-A</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Measured</strong></td>
                  <td><ReportInput value={set.aToGround} onChange={v => updateCableSet(idx, 'aToGround', v)} readOnly={!isEditing} /></td>
                  <td><ReportInput value={set.bToGround} onChange={v => updateCableSet(idx, 'bToGround', v)} readOnly={!isEditing} /></td>
                  <td><ReportInput value={set.cToGround} onChange={v => updateCableSet(idx, 'cToGround', v)} readOnly={!isEditing} /></td>
                  <td><ReportInput value={set.aToB} onChange={v => updateCableSet(idx, 'aToB', v)} readOnly={!isEditing} /></td>
                  <td><ReportInput value={set.bToC} onChange={v => updateCableSet(idx, 'bToC', v)} readOnly={!isEditing} /></td>
                  <td><ReportInput value={set.cToA} onChange={v => updateCableSet(idx, 'cToA', v)} readOnly={!isEditing} /></td>
                </tr>
                <tr className="corrected-row">
                  <td><strong>Corrected</strong></td>
                  <td><ReportInput value={set.aToGroundCorrected} readOnly calculated /></td>
                  <td><ReportInput value={set.bToGroundCorrected} readOnly calculated /></td>
                  <td><ReportInput value={set.cToGroundCorrected} readOnly calculated /></td>
                  <td><ReportInput value={set.aToBCorrected} readOnly calculated /></td>
                  <td><ReportInput value={set.bToCCorrected} readOnly calculated /></td>
                  <td><ReportInput value={set.cToACorrected} readOnly calculated /></td>
                </tr>
              </tbody>
            </table>
          </div>
        </ReportSection>
      ))}

      <TestEquipmentSection
        equipment={formData.testEquipment}
        onChange={eq => setFormData((prev: any) => ({ ...prev, testEquipment: eq }))}
        isEditing={isEditing}
        showLowResistance={false}
      />

      <CommentsSection
        comments={formData.comments}
        onChange={c => setField('comments', c)}
        isEditing={isEditing}
      />
    </div>
  );
}

export default LowVoltageCableReport;



