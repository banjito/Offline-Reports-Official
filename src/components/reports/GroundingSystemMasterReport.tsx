/**
 * Grounding System Master Report
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
  useReportState
} from './BaseReport';
import './ReportStyles.css';

interface Props {
  job: Job | null;
  reportData: any;
  onSave: (data: any) => void;
}

interface GroundingRow {
  pointLabel: string;
  location: string;
  from: string;
  to: string;
  measurement: string;
  date: string;
  technicians: string;
  status: 'PASS' | 'FAIL';
  manuf: string;
  ampId: string;
  tempC: string;
  humidity: string;
  c2: string;
  p2: string;
  lastRainfall: string;
  comments: string;
}

const createRow = (index: number): GroundingRow => ({
  pointLabel: `PTP #${index + 1}`,
  location: '',
  from: '',
  to: '',
  measurement: '',
  date: '',
  technicians: '',
  status: 'PASS',
  manuf: '',
  ampId: '',
  tempC: '',
  humidity: '',
  c2: '',
  p2: '',
  lastRainfall: '',
  comments: ''
});

export function GroundingSystemMasterReport({ job, reportData, onSave }: Props) {
  const initialRowCount = reportData?.rows?.length || 50;
  
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
    testEquipment: {
      megohmmeter: reportData?.testEquipment?.megohmmeter || { name: '', serialNumber: '', ampId: '' },
      lowResistance: reportData?.testEquipment?.lowResistance || { name: '', serialNumber: '', ampId: '' }
    },
    comments: reportData?.comments || ''
  };

  const { formData, setFormData, setField, isEditing, setIsEditing } = useReportState(initialData);
  const [status, setStatus] = useState<'PASS' | 'FAIL'>(initialData.status as 'PASS' | 'FAIL');
  const [rowCount, setRowCount] = useState(initialRowCount);
  const [rows, setRows] = useState<GroundingRow[]>(() => {
    if (reportData?.rows && Array.isArray(reportData.rows)) {
      return reportData.rows.map((r: any, i: number) => ({
        pointLabel: r.pointLabel || `PTP #${i + 1}`,
        location: r.location || '',
        from: r.from || '',
        to: r.to || '',
        measurement: r.measurement || '',
        date: r.date || '',
        technicians: r.technicians || '',
        status: r.status === 'FAIL' ? 'FAIL' : 'PASS',
        manuf: r.manuf || '',
        ampId: r.ampId || '',
        tempC: r.tempC || '',
        humidity: r.humidity || '',
        c2: r.c2 || '',
        p2: r.p2 || '',
        lastRainfall: r.lastRainfall || '',
        comments: r.comments || ''
      }));
    }
    return Array.from({ length: rowCount }, (_, i) => createRow(i));
  });

  // Resize rows when rowCount changes
  useEffect(() => {
    setRows(prev => {
      if (rowCount === prev.length) return prev;
      if (rowCount < prev.length) {
        return prev.slice(0, rowCount).map((r, i) => ({ ...r, pointLabel: `PTP #${i + 1}` }));
      }
      const extra = Array.from({ length: rowCount - prev.length }, (_, k) => createRow(prev.length + k));
      return [...prev.map((r, i) => ({ ...r, pointLabel: `PTP #${i + 1}` })), ...extra];
    });
  }, [rowCount]);

  const handleSave = () => {
    const dataToSave = {
      ...formData,
      status,
      rows
    };
    onSave(dataToSave);
    setIsEditing(false);
  };

  const updateRow = (idx: number, field: keyof GroundingRow, value: string) => {
    setRows(prev => prev.map((r, i) => i === idx ? { ...r, [field]: value } : r));
  };

  const addRows = (count: number) => {
    setRowCount((prev: number) => prev + count);
  };

  const removeEmptyRows = () => {
    setRows(prev => {
      const filtered = prev.filter(r => 
        r.location || r.from || r.to || r.measurement || r.date || r.technicians || r.comments
      );
      return filtered.length > 0 ? filtered.map((r, i) => ({ ...r, pointLabel: `PTP #${i + 1}` })) : [createRow(0)];
    });
    setRowCount(rows.filter(r => 
      r.location || r.from || r.to || r.measurement || r.date || r.technicians || r.comments
    ).length || 1);
  };

  return (
    <div className="report-container">
      <ReportHeader
        title="Grounding System MASTER"
        status={status}
        onStatusChange={() => setStatus(s => s === 'PASS' ? 'FAIL' : 'PASS')}
        isEditing={isEditing}
        onEdit={() => setIsEditing(true)}
        onSave={handleSave}
      />

      <JobInfoSection data={formData} onChange={setField} isEditing={isEditing} />

      {/* Row Count Controls */}
      {isEditing && (
        <div className="row-controls">
          <label>Number of Rows: </label>
          <input
            type="number"
            value={rowCount}
            onChange={e => setRowCount(Math.max(1, parseInt(e.target.value) || 1))}
            min={1}
            max={500}
            className="row-count-input"
          />
          <button onClick={() => addRows(10)} className="btn-secondary">+10 Rows</button>
          <button onClick={() => addRows(25)} className="btn-secondary">+25 Rows</button>
          <button onClick={removeEmptyRows} className="btn-secondary">Remove Empty</button>
        </div>
      )}

      {/* Grounding Points Master Table */}
      <ReportSection title="Grounding Point-to-Point Measurements">
        <div className="table-container grounding-table-scroll">
          <table className="report-table grounding-master-table">
            <thead>
              <tr>
                <th style={{ minWidth: '80px' }}>Point Label</th>
                <th style={{ minWidth: '120px' }}>Location</th>
                <th style={{ minWidth: '100px' }}>From</th>
                <th style={{ minWidth: '100px' }}>To</th>
                <th style={{ minWidth: '100px' }}>Measurement (Ω)</th>
                <th style={{ minWidth: '100px' }}>Date</th>
                <th style={{ minWidth: '100px' }}>Technicians</th>
                <th style={{ minWidth: '80px' }}>Status</th>
                <th style={{ minWidth: '100px' }}>Manuf.</th>
                <th style={{ minWidth: '80px' }}>AMP ID</th>
                <th style={{ minWidth: '80px' }}>Temp °C</th>
                <th style={{ minWidth: '80px' }}>Humidity %</th>
                <th style={{ minWidth: '80px' }}>C2</th>
                <th style={{ minWidth: '80px' }}>P2</th>
                <th style={{ minWidth: '100px' }}>Last Rainfall</th>
                <th style={{ minWidth: '150px' }}>Comments</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => (
                <tr key={idx}>
                  <td className="point-label">{row.pointLabel}</td>
                  <td>
                    <ReportInput 
                      value={row.location} 
                      onChange={v => updateRow(idx, 'location', v)} 
                      readOnly={!isEditing} 
                    />
                  </td>
                  <td>
                    <ReportInput 
                      value={row.from} 
                      onChange={v => updateRow(idx, 'from', v)} 
                      readOnly={!isEditing} 
                    />
                  </td>
                  <td>
                    <ReportInput 
                      value={row.to} 
                      onChange={v => updateRow(idx, 'to', v)} 
                      readOnly={!isEditing} 
                    />
                  </td>
                  <td>
                    <ReportInput 
                      value={row.measurement} 
                      onChange={v => updateRow(idx, 'measurement', v)} 
                      readOnly={!isEditing} 
                      type="number"
                    />
                  </td>
                  <td>
                    <ReportInput 
                      value={row.date} 
                      onChange={v => updateRow(idx, 'date', v)} 
                      readOnly={!isEditing} 
                      type="date"
                    />
                  </td>
                  <td>
                    <ReportInput 
                      value={row.technicians} 
                      onChange={v => updateRow(idx, 'technicians', v)} 
                      readOnly={!isEditing} 
                    />
                  </td>
                  <td>
                    <ReportSelect
                      value={row.status}
                      options={['PASS', 'FAIL']}
                      onChange={v => updateRow(idx, 'status', v)}
                      disabled={!isEditing}
                      className={row.status === 'PASS' ? 'status-pass' : 'status-fail'}
                    />
                  </td>
                  <td>
                    <ReportInput 
                      value={row.manuf} 
                      onChange={v => updateRow(idx, 'manuf', v)} 
                      readOnly={!isEditing} 
                    />
                  </td>
                  <td>
                    <ReportInput 
                      value={row.ampId} 
                      onChange={v => updateRow(idx, 'ampId', v)} 
                      readOnly={!isEditing} 
                    />
                  </td>
                  <td>
                    <ReportInput 
                      value={row.tempC} 
                      onChange={v => updateRow(idx, 'tempC', v)} 
                      readOnly={!isEditing} 
                      type="number"
                    />
                  </td>
                  <td>
                    <ReportInput 
                      value={row.humidity} 
                      onChange={v => updateRow(idx, 'humidity', v)} 
                      readOnly={!isEditing} 
                      type="number"
                    />
                  </td>
                  <td>
                    <ReportInput 
                      value={row.c2} 
                      onChange={v => updateRow(idx, 'c2', v)} 
                      readOnly={!isEditing} 
                    />
                  </td>
                  <td>
                    <ReportInput 
                      value={row.p2} 
                      onChange={v => updateRow(idx, 'p2', v)} 
                      readOnly={!isEditing} 
                    />
                  </td>
                  <td>
                    <ReportInput 
                      value={row.lastRainfall} 
                      onChange={v => updateRow(idx, 'lastRainfall', v)} 
                      readOnly={!isEditing} 
                    />
                  </td>
                  <td>
                    <ReportInput 
                      value={row.comments} 
                      onChange={v => updateRow(idx, 'comments', v)} 
                      readOnly={!isEditing} 
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
        showLowResistance={true}
      />

      <CommentsSection
        comments={formData.comments}
        onChange={c => setField('comments', c)}
        isEditing={isEditing}
      />
    </div>
  );
}

export default GroundingSystemMasterReport;

