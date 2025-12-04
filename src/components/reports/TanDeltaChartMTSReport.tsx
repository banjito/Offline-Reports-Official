// TanDeltaChartMTSReport.tsx - Medium Voltage VLF Tan Delta Test MTS Report
// Matches: medium-voltage-vlf-tan-delta-mts (4-Medium Voltage Cable VLF Tan Delta Test MTS)
// Also handles: electrical-tan-delta-test-mts-form
// Database table: tandelta_mts_reports

import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import './ReportStyles.css';

interface TanDeltaDataPoint {
  voltageLabel: string;
  kV: number;
  phaseA: number;
  phaseAStdDev: number | null;
  phaseB: number;
  phaseBStdDev: number | null;
  phaseC: number;
  phaseCStdDev: number | null;
}

interface TestEquipment {
  megohmeterSerial: string;
  megohmmeterAmpId: string;
  vlfHipotSerial: string;
  vlfHipotAmpId: string;
}

interface FormData {
  customerName: string;
  siteAddress: string;
  jobNumber: string;
  testDate: string;
  cableType: string;
  systemVoltage: string;
  status: 'PASS' | 'FAIL';
  data: TanDeltaDataPoint[];
  equipment: TestEquipment;
  comments: string;
}

const initialData: TanDeltaDataPoint[] = [
  { voltageLabel: '0.5 Uo', kV: 7.200, phaseA: 0, phaseAStdDev: null, phaseB: 0, phaseBStdDev: null, phaseC: 0, phaseCStdDev: null },
  { voltageLabel: '1.0 Uo', kV: 14.400, phaseA: 0, phaseAStdDev: null, phaseB: 0, phaseBStdDev: null, phaseC: 0, phaseCStdDev: null },
  { voltageLabel: '1.5 Uo', kV: 21.600, phaseA: 0, phaseAStdDev: null, phaseB: 0, phaseBStdDev: null, phaseC: 0, phaseCStdDev: null },
  { voltageLabel: '2.0 Uo', kV: 28.800, phaseA: 0, phaseAStdDev: null, phaseB: 0, phaseBStdDev: null, phaseC: 0, phaseCStdDev: null },
];

const initialFormData: FormData = {
  customerName: '',
  siteAddress: '',
  jobNumber: '',
  testDate: '',
  cableType: '',
  systemVoltage: '14.400',
  status: 'PASS',
  data: JSON.parse(JSON.stringify(initialData)),
  equipment: {
    megohmeterSerial: '',
    megohmmeterAmpId: '',
    vlfHipotSerial: '',
    vlfHipotAmpId: ''
  },
  comments: ''
};

interface TanDeltaChartMTSReportProps {
  reportId?: string;
  jobId?: string;
  job?: any;
  isEditing?: boolean;
  onSave?: (data: any) => void;
  reportData?: any;
}

const TanDeltaChartMTSReport: React.FC<TanDeltaChartMTSReportProps> = ({
  job,
  isEditing = false,
  onSave,
  reportData: initialReportData
}) => {
  const [formData, setFormData] = useState<FormData>(JSON.parse(JSON.stringify(initialFormData)));
  const [loading, setLoading] = useState(true);
  const [editingData, setEditingData] = useState(false);

  useEffect(() => {
    setLoading(true);
    try {
      if (initialReportData) {
        loadFromProps(initialReportData);
      }
      if (job) {
        setFormData(prev => ({
          ...prev,
          customerName: job.customer_name || job.customerName || prev.customerName,
          siteAddress: job.site_address || job.siteAddress || prev.siteAddress,
          jobNumber: job.job_number || job.jobNumber || prev.jobNumber
        }));
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, [initialReportData, job]);

  const loadFromProps = (data: any) => {
    const reportInfo = data.report_info || data.reportInfo || {};
    const testData = data.test_data || data.testData || {};
    
    setFormData(prev => ({
      ...prev,
      testDate: reportInfo.date || data.testDate || data.test_date || prev.testDate,
      cableType: reportInfo.cableType || data.cableType || data.cable_type || prev.cableType,
      systemVoltage: reportInfo.systemVoltage || data.systemVoltage || data.system_voltage || prev.systemVoltage,
      status: reportInfo.status || data.status || 'PASS',
      data: testData.points || data.data || prev.data,
      equipment: reportInfo.testEquipment || data.equipment || prev.equipment,
      comments: data.comments || reportInfo.comments || prev.comments,
      customerName: data.customerName || data.customer_name || prev.customerName,
      siteAddress: data.siteAddress || data.site_address || prev.siteAddress,
      jobNumber: data.jobNumber || data.job_number || prev.jobNumber
    }));
  };

  const handleDataChange = (index: number, field: keyof TanDeltaDataPoint, value: string) => {
    const newData = [...formData.data];
    if (field === 'voltageLabel') {
      newData[index][field] = value;
    } else if (field === 'phaseAStdDev' || field === 'phaseBStdDev' || field === 'phaseCStdDev') {
      newData[index][field] = value === '' ? null : parseFloat(value) || 0;
    } else {
      (newData[index] as any)[field] = parseFloat(value) || 0;
    }
    setFormData(prev => ({ ...prev, data: newData }));
  };

  const handleEquipmentChange = (field: keyof TestEquipment, value: string) => {
    setFormData(prev => ({
      ...prev,
      equipment: { ...prev.equipment, [field]: value }
    }));
  };

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return <div className="report-container"><p>Loading report...</p></div>;
  }

  return (
    <div className="report-container">
      {/* Print Header */}
      <div className="print-header">
        <img 
          src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/AMP%20Logo-FdmXGeXuGBlr2AcoAFFlM8AqzmoyM1.png" 
          alt="AMP Logo" 
          className="print-logo"
        />
        <div className="print-title">
          <h1>4-Medium Voltage Cable VLF Tan Delta Test MTS</h1>
          <p className="neta-ref">NETA - MTS</p>
        </div>
        <div className={`status-badge ${formData.status === 'PASS' ? 'status-pass' : 'status-fail'}`}>
          {formData.status}
        </div>
      </div>

      {/* Job Information */}
      <div className="report-section">
        <div className="section-divider"></div>
        <h2 className="section-title">Job Information</h2>
        <table className="data-table">
          <tbody>
            <tr>
              <td className="label-cell">Customer Name:</td>
              <td><input type="text" value={formData.customerName} onChange={(e) => handleInputChange('customerName', e.target.value)} readOnly={!isEditing} className="table-input" /></td>
              <td className="label-cell">Job Number:</td>
              <td><input type="text" value={formData.jobNumber} onChange={(e) => handleInputChange('jobNumber', e.target.value)} readOnly={!isEditing} className="table-input" /></td>
            </tr>
            <tr>
              <td className="label-cell">Site Address:</td>
              <td colSpan={3}><input type="text" value={formData.siteAddress} onChange={(e) => handleInputChange('siteAddress', e.target.value)} readOnly={!isEditing} className="table-input" /></td>
            </tr>
          </tbody>
        </table>
          </div>

      {/* Test Parameters */}
      <div className="report-section">
        <div className="section-divider"></div>
        <h2 className="section-title">Test Parameters</h2>
        <table className="data-table">
          <tbody>
            <tr>
              <td className="label-cell">Test Date:</td>
              <td><input type="date" value={formData.testDate} onChange={(e) => handleInputChange('testDate', e.target.value)} readOnly={!isEditing} className="table-input" /></td>
              <td className="label-cell">Cable Type:</td>
              <td><input type="text" value={formData.cableType} onChange={(e) => handleInputChange('cableType', e.target.value)} readOnly={!isEditing} className="table-input" /></td>
            </tr>
            <tr>
              <td className="label-cell">System Voltage (kV):</td>
              <td><input type="text" value={formData.systemVoltage} onChange={(e) => handleInputChange('systemVoltage', e.target.value)} readOnly={!isEditing} className="table-input" /></td>
              <td className="label-cell">Status:</td>
              <td>
                {isEditing ? (
                  <select value={formData.status} onChange={(e) => handleInputChange('status', e.target.value)} className="table-input">
              <option value="PASS">PASS</option>
              <option value="FAIL">FAIL</option>
            </select>
                ) : (
                  <span className={formData.status === 'PASS' ? 'status-pass-text' : 'status-fail-text'}>{formData.status}</span>
                )}
              </td>
            </tr>
          </tbody>
        </table>
          </div>

      {/* Tan Delta Test Data Table */}
      <div className="report-section">
        <div className="section-divider"></div>
        <h2 className="section-title">Tan Delta Test Data</h2>
        {isEditing && (
          <button onClick={() => setEditingData(!editingData)} className="btn-secondary" style={{ marginBottom: '10px' }}>
            {editingData ? 'Lock Data' : 'Edit Data'}
          </button>
        )}
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th rowSpan={2}>Voltage Steps</th>
                <th rowSpan={2}>kV</th>
                <th colSpan={2}>A Phase</th>
                <th colSpan={2}>B Phase</th>
                <th colSpan={2}>C Phase</th>
              </tr>
              <tr>
                <th>TD [E-3]</th>
                <th>Std. Dev</th>
                <th>TD [E-3]</th>
                <th>Std. Dev</th>
                <th>TD [E-3]</th>
                <th>Std. Dev</th>
              </tr>
            </thead>
            <tbody>
              {formData.data.map((row, index) => (
                <tr key={index}>
                  <td>{editingData ? <input type="text" value={row.voltageLabel} onChange={(e) => handleDataChange(index, 'voltageLabel', e.target.value)} className="table-input" /> : row.voltageLabel}</td>
                  <td>{editingData ? <input type="number" step="0.001" value={row.kV} onChange={(e) => handleDataChange(index, 'kV', e.target.value)} className="table-input" /> : row.kV.toFixed(3)}</td>
                  <td>{editingData ? <input type="number" step="0.1" value={row.phaseA} onChange={(e) => handleDataChange(index, 'phaseA', e.target.value)} className="table-input" /> : row.phaseA}</td>
                  <td>{editingData ? <input type="number" step="0.01" value={row.phaseAStdDev ?? ''} onChange={(e) => handleDataChange(index, 'phaseAStdDev', e.target.value)} className="table-input" /> : (row.phaseAStdDev ?? '')}</td>
                  <td>{editingData ? <input type="number" step="0.1" value={row.phaseB} onChange={(e) => handleDataChange(index, 'phaseB', e.target.value)} className="table-input" /> : row.phaseB}</td>
                  <td>{editingData ? <input type="number" step="0.01" value={row.phaseBStdDev ?? ''} onChange={(e) => handleDataChange(index, 'phaseBStdDev', e.target.value)} className="table-input" /> : (row.phaseBStdDev ?? '')}</td>
                  <td>{editingData ? <input type="number" step="0.1" value={row.phaseC} onChange={(e) => handleDataChange(index, 'phaseC', e.target.value)} className="table-input" /> : row.phaseC}</td>
                  <td>{editingData ? <input type="number" step="0.01" value={row.phaseCStdDev ?? ''} onChange={(e) => handleDataChange(index, 'phaseCStdDev', e.target.value)} className="table-input" /> : (row.phaseCStdDev ?? '')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tan Delta Chart */}
      <div className="report-section">
        <div className="section-divider"></div>
        <h2 className="section-title">Tan Delta Chart</h2>
        <div className="chart-container" style={{ width: '100%', height: 400 }}>
          <ResponsiveContainer>
            <LineChart data={formData.data} margin={{ top: 30, right: 40, left: 30, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="kV" 
                label={{ value: 'Test Voltage (kV)', position: 'bottom', offset: 10 }} 
                padding={{ left: 20, right: 20 }}
              />
              <YAxis
                label={{ value: 'Tan Delta (E-3)', angle: -90, position: 'insideLeft', offset: -10 }}
                domain={[0, 'auto']}
                padding={{ top: 20 }}
              />
              <Tooltip formatter={(value) => [`${value}`, 'Tan Delta (E-3)']} />
              <Legend layout="horizontal" verticalAlign="top" align="center" wrapperStyle={{ paddingBottom: '20px' }} />
              <Line type="monotone" dataKey="phaseA" name="A Phase" stroke="#8884d8" activeDot={{ r: 8 }} strokeWidth={2} dot={{ strokeWidth: 2, r: 5 }} />
              <Line type="monotone" dataKey="phaseB" name="B Phase" stroke="#82ca9d" activeDot={{ r: 8 }} strokeWidth={2} dot={{ strokeWidth: 2, r: 5 }} />
              <Line type="monotone" dataKey="phaseC" name="C Phase" stroke="#ff7300" activeDot={{ r: 8 }} strokeWidth={2} dot={{ strokeWidth: 2, r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        </div>

      {/* Test Equipment Used */}
      <div className="report-section">
        <div className="section-divider"></div>
        <h2 className="section-title">Test Equipment Used</h2>
        <table className="data-table">
              <thead>
                <tr>
              <th>Equipment</th>
              <th>Serial Number</th>
              <th>AMP ID</th>
                </tr>
              </thead>
              <tbody>
            <tr>
              <td className="label-cell">Megohmmeter</td>
              <td><input type="text" value={formData.equipment.megohmeterSerial} onChange={(e) => handleEquipmentChange('megohmeterSerial', e.target.value)} readOnly={!isEditing} className="table-input" /></td>
              <td><input type="text" value={formData.equipment.megohmmeterAmpId} onChange={(e) => handleEquipmentChange('megohmmeterAmpId', e.target.value)} readOnly={!isEditing} className="table-input" /></td>
            </tr>
            <tr>
              <td className="label-cell">VLF Hipot</td>
              <td><input type="text" value={formData.equipment.vlfHipotSerial} onChange={(e) => handleEquipmentChange('vlfHipotSerial', e.target.value)} readOnly={!isEditing} className="table-input" /></td>
              <td><input type="text" value={formData.equipment.vlfHipotAmpId} onChange={(e) => handleEquipmentChange('vlfHipotAmpId', e.target.value)} readOnly={!isEditing} className="table-input" /></td>
                  </tr>
              </tbody>
            </table>
          </div>

      {/* Comments */}
      <div className="report-section">
        <div className="section-divider"></div>
        <h2 className="section-title">Comments</h2>
        <textarea value={formData.comments} onChange={(e) => handleInputChange('comments', e.target.value)} readOnly={!isEditing} rows={6} className="comments-textarea" placeholder="Enter any additional comments..." />
      </div>
    </div>
  );
};

export default TanDeltaChartMTSReport;
