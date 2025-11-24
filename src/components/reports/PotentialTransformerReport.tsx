/**
 * Potential (Voltage) Transformer Test Report
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
  TEST_VOLTAGE_OPTIONS
} from './BaseReport';
import './ReportStyles.css';

interface Props {
  job: Job | null;
  reportData: any;
  onSave: (data: any) => void;
  variant?: 'ats' | 'mts';
}

// Visual inspection items for PT
const PT_INSPECTION_ITEMS = [
  { id: '7.10.2.A.1', description: 'Compare equipment nameplate data with drawings and specifications.' },
  { id: '7.10.2.A.2', description: 'Inspect physical and mechanical condition.' },
  { id: '7.10.2.A.3', description: 'Verify that adequate clearances exist between primary and secondary circuit wiring.' },
  { id: '7.10.2.A.4', description: 'Verify the unit is clean.' },
  { id: '7.10.2.A.5', description: 'Verify tightness of accessible bolted electrical connections.' },
  { id: '7.10.2.A.6', description: 'Verify that all required grounding connections provide contact integrity.' },
];

interface PTData {
  ptId: string;
  manufacturer: string;
  type: string;
  ratio: string;
  class: string;
  burden: string;
  // Insulation Resistance
  primaryToSecondary: string;
  primaryToGround: string;
  secondaryToGround: string;
  // Corrected values
  primaryToSecondaryCorrected: string;
  primaryToGroundCorrected: string;
  secondaryToGroundCorrected: string;
  // Ratio Test
  ratioMeasured: string;
  ratioError: string;
  // Polarity
  polarityResult: string;
  // Burden Test
  burdenMeasured: string;
}

const createPTData = (id: string): PTData => ({
  ptId: id,
  manufacturer: '',
  type: '',
  ratio: '',
  class: '',
  burden: '',
  primaryToSecondary: '',
  primaryToGround: '',
  secondaryToGround: '',
  primaryToSecondaryCorrected: '',
  primaryToGroundCorrected: '',
  secondaryToGroundCorrected: '',
  ratioMeasured: '',
  ratioError: '',
  polarityResult: 'PASS',
  burdenMeasured: ''
});

export function PotentialTransformerReport({ job, reportData, onSave, variant = 'ats' }: Props) {
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
    irUnits: reportData?.irUnits || 'MΩ',
    visualInspection: PT_INSPECTION_ITEMS.map(item => ({
      id: item.id,
      description: item.description,
      result: reportData?.visualInspection?.[item.id] || 'Select One',
      comments: ''
    })),
    testEquipment: {
      megohmmeter: reportData?.testEquipment?.megohmmeter || { name: '', serialNumber: '', ampId: '' },
      ptAnalyzer: reportData?.testEquipment?.ptAnalyzer || { name: '', serialNumber: '', ampId: '' }
    },
    comments: reportData?.comments || ''
  };

  const { formData, setFormData, setField, isEditing, setIsEditing } = useReportState(initialData);
  const [status, setStatus] = useState<'PASS' | 'FAIL'>(initialData.status as 'PASS' | 'FAIL');
  
  const [ptData, setPTData] = useState<PTData[]>(() => {
    if (reportData?.ptData && Array.isArray(reportData.ptData)) {
      return reportData.ptData.map((pt: any, i: number) => ({
        ...createPTData(`PT ${i + 1}`),
        ...pt
      }));
    }
    // Default to 6 PTs
    return Array.from({ length: 6 }, (_, i) => createPTData(`PT ${i + 1}`));
  });

  // Auto-calculate corrected values when temperature or measured values change
  useEffect(() => {
    const tcf = formData.temperature?.tcf || 1;
    setPTData(prev => prev.map(pt => ({
      ...pt,
      primaryToSecondaryCorrected: multiplyByTCF(pt.primaryToSecondary, tcf),
      primaryToGroundCorrected: multiplyByTCF(pt.primaryToGround, tcf),
      secondaryToGroundCorrected: multiplyByTCF(pt.secondaryToGround, tcf)
    })));
  }, [formData.temperature?.tcf]);

  const handleSave = () => {
    const dataToSave = {
      ...formData,
      status,
      ptData,
      visualInspection: Object.fromEntries(formData.visualInspection.map((item: any) => [item.id, item.result]))
    };
    onSave(dataToSave);
    setIsEditing(false);
  };

  const updatePT = (idx: number, field: keyof PTData, value: string) => {
    setPTData(prev => {
      const updated = prev.map((pt, i) => i === idx ? { ...pt, [field]: value } : pt);
      // Recalculate corrected values if a measured value changed
      if (['primaryToSecondary', 'primaryToGround', 'secondaryToGround'].includes(field)) {
        const tcf = formData.temperature?.tcf || 1;
        const pt = updated[idx];
        updated[idx] = {
          ...pt,
          primaryToSecondaryCorrected: multiplyByTCF(pt.primaryToSecondary, tcf),
          primaryToGroundCorrected: multiplyByTCF(pt.primaryToGround, tcf),
          secondaryToGroundCorrected: multiplyByTCF(pt.secondaryToGround, tcf)
        };
      }
      return updated;
    });
  };

  const reportTitle = variant === 'mts' 
    ? '13-Voltage Potential Transformer Test MTS'
    : 'Potential Transformer ATS';

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

      <VisualInspectionSection
        items={formData.visualInspection}
        onChange={items => setFormData((prev: any) => ({ ...prev, visualInspection: items }))}
        isEditing={isEditing}
        netaSection="7.10.2"
      />

      {/* Test Parameters */}
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
          <div className="form-field">
            <label>IR Units:</label>
            <ReportSelect
              value={formData.irUnits}
              options={IR_UNITS.map(u => u.symbol)}
              onChange={v => setField('irUnits', v)}
              disabled={!isEditing}
            />
          </div>
        </div>
      </ReportSection>

      {/* PT Nameplate Data */}
      <ReportSection title="Potential Transformer Nameplate Data">
        <div className="table-container">
          <table className="report-table compact">
            <thead>
              <tr>
                <th>PT ID</th>
                <th>Manufacturer</th>
                <th>Type</th>
                <th>Ratio</th>
                <th>Class</th>
                <th>Burden (VA)</th>
              </tr>
            </thead>
            <tbody>
              {ptData.map((pt, idx) => (
                <tr key={idx}>
                  <td>{pt.ptId}</td>
                  <td><ReportInput value={pt.manufacturer} onChange={v => updatePT(idx, 'manufacturer', v)} readOnly={!isEditing} /></td>
                  <td><ReportInput value={pt.type} onChange={v => updatePT(idx, 'type', v)} readOnly={!isEditing} /></td>
                  <td><ReportInput value={pt.ratio} onChange={v => updatePT(idx, 'ratio', v)} readOnly={!isEditing} /></td>
                  <td><ReportInput value={pt.class} onChange={v => updatePT(idx, 'class', v)} readOnly={!isEditing} /></td>
                  <td><ReportInput value={pt.burden} onChange={v => updatePT(idx, 'burden', v)} readOnly={!isEditing} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ReportSection>

      {/* Insulation Resistance */}
      <ReportSection title="Insulation Resistance Tests">
        <p className="calculated-note">Corrected values calculated using TCF = {(formData.temperature?.tcf || 1).toFixed(3)}</p>
        <div className="table-container">
          <table className="report-table compact">
            <thead>
              <tr>
                <th rowSpan={2}>PT ID</th>
                <th colSpan={3}>Measured ({formData.irUnits})</th>
                <th colSpan={3}>Corrected ({formData.irUnits})</th>
              </tr>
              <tr>
                <th>Pri-Sec</th>
                <th>Pri-Gnd</th>
                <th>Sec-Gnd</th>
                <th>Pri-Sec</th>
                <th>Pri-Gnd</th>
                <th>Sec-Gnd</th>
              </tr>
            </thead>
            <tbody>
              {ptData.map((pt, idx) => (
                <tr key={idx}>
                  <td>{pt.ptId}</td>
                  <td><ReportInput value={pt.primaryToSecondary} onChange={v => updatePT(idx, 'primaryToSecondary', v)} readOnly={!isEditing} /></td>
                  <td><ReportInput value={pt.primaryToGround} onChange={v => updatePT(idx, 'primaryToGround', v)} readOnly={!isEditing} /></td>
                  <td><ReportInput value={pt.secondaryToGround} onChange={v => updatePT(idx, 'secondaryToGround', v)} readOnly={!isEditing} /></td>
                  <td><ReportInput value={pt.primaryToSecondaryCorrected} readOnly calculated /></td>
                  <td><ReportInput value={pt.primaryToGroundCorrected} readOnly calculated /></td>
                  <td><ReportInput value={pt.secondaryToGroundCorrected} readOnly calculated /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ReportSection>

      {/* Ratio and Polarity Tests */}
      <ReportSection title="Ratio and Polarity Tests">
        <div className="table-container">
          <table className="report-table compact">
            <thead>
              <tr>
                <th>PT ID</th>
                <th>Nameplate Ratio</th>
                <th>Measured Ratio</th>
                <th>% Error</th>
                <th>Polarity</th>
                <th>Burden Measured</th>
              </tr>
            </thead>
            <tbody>
              {ptData.map((pt, idx) => (
                <tr key={idx}>
                  <td>{pt.ptId}</td>
                  <td>{pt.ratio}</td>
                  <td><ReportInput value={pt.ratioMeasured} onChange={v => updatePT(idx, 'ratioMeasured', v)} readOnly={!isEditing} /></td>
                  <td><ReportInput value={pt.ratioError} onChange={v => updatePT(idx, 'ratioError', v)} readOnly={!isEditing} /></td>
                  <td>
                    <ReportSelect
                      value={pt.polarityResult}
                      options={['PASS', 'FAIL', 'N/A']}
                      onChange={v => updatePT(idx, 'polarityResult', v)}
                      disabled={!isEditing}
                      className={pt.polarityResult === 'PASS' ? 'status-pass' : pt.polarityResult === 'FAIL' ? 'status-fail' : ''}
                    />
                  </td>
                  <td><ReportInput value={pt.burdenMeasured} onChange={v => updatePT(idx, 'burdenMeasured', v)} readOnly={!isEditing} /></td>
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

export default PotentialTransformerReport;

