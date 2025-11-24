/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Job } from '../types';
import './ReportViewer.css';

interface ReportViewerProps {
  jobId?: string;
  reportId?: string;
}

export function ReportViewer({ jobId: propJobId, reportId: propReportId }: ReportViewerProps) {
  const { jobId: paramJobId, reportId: paramReportId } = useParams<{ jobId: string; reportId: string }>();
  const navigate = useNavigate();

  const jobId = propJobId || paramJobId;
  const reportId = propReportId || paramReportId;

  const [job, setJob] = useState<Job | null>(null);
  const [report, setReport] = useState<any>(null);
  const [reportType, setReportType] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (jobId && reportId) {
      loadJobAndReport();
    }
  }, [jobId, reportId]);

  const loadJobAndReport = async () => {
    try {
      setLoading(true);

      // Load job details
      const jobResult = await window.electronAPI.dbQuery('jobs', 'getAll', {});
      if (jobResult.success && jobResult.data) {
        const currentJob = jobResult.data.find((j: Job) => j.id === jobId);
        if (currentJob) {
          setJob(currentJob);
        }
      }

      // Load report
      const reportResult = await window.electronAPI.dbQuery('reports', 'getById', { id: reportId });
      if (reportResult.success && reportResult.data) {
        const reportData = reportResult.data;
        setReport(reportData);

        // Determine report type from report_data
        if (typeof reportData.report_data === 'string') {
          try {
            const parsed = JSON.parse(reportData.report_data);
            setReportType(reportData.report_type || 'unknown');
            setReport({ ...reportData, parsedData: parsed });
          } catch (e) {
            console.error('Failed to parse report_data:', e);
            setError('Failed to parse report data');
          }
        } else {
          setReportType(reportData.report_type || 'unknown');
        }
      } else {
        setError('Report not found');
      }
    } catch (err: any) {
      console.error('Failed to load report:', err);
      setError(err.message || 'Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  const renderReportComponent = () => {
    if (!report || !reportType) return null;

    const reportData = report.parsedData || (typeof report.report_data === 'string' ? JSON.parse(report.report_data) : report.report_data);

    // For now, use the generic editor for all reports
    // This preserves ALL the data structure and allows editing
    return <GenericReportEditor job={job} reportData={reportData} onSave={handleSave} />;
  };

  const handleSave = async (updatedData: any) => {
    try {
      // Update the report in local database
      const updatedReport = {
        ...report,
        report_data: JSON.stringify(updatedData),
        updated_at: new Date().toISOString(),
        is_dirty: 1
      };

      const result = await window.electronAPI.dbQuery('reports', 'updateReport', updatedReport);

      if (result.success) {
        setReport(updatedReport);
        // TODO: Add to sync queue for upload to Supabase
        console.log('Report saved locally');
      } else {
        throw new Error(result.error || 'Failed to save report');
      }
    } catch (err: any) {
      console.error('Failed to save report:', err);
      alert(`Failed to save report: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="report-viewer">
        <div className="loading">Loading report...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="report-viewer">
        <div className="error">
          <h2>Report Error</h2>
          <p>{error}</p>
          <button onClick={() => navigate('/')} className="btn-secondary">
            Back to Jobs
          </button>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="report-viewer">
        <div className="error">
          <h2>Report Not Found</h2>
          <button onClick={() => navigate('/')} className="btn-secondary">
            Back to Jobs
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="report-viewer">
      <div className="report-header">
        <button onClick={() => navigate('/')} className="back-button">
          ← Back to Jobs
        </button>
        <div className="report-info">
          <h1>{report.title || `Report ${reportId?.substring(0, 8)}`}</h1>
          <span className="report-type">{reportType.replace(/-/g, ' ').toUpperCase()}</span>
        </div>
      </div>

      <div className="report-content">
        {renderReportComponent()}
      </div>
    </div>
  );
}

// List of calculated/formula fields that should be read-only
const CALCULATED_FIELDS = [
  'celsius', 'tcf', 'correctionFactor', 'correctionfactor',
  'corrected', 'dielectricAbsorption', 'polarizationIndex', 'polarizationindex',
  'ratio', 'calculated', 'formula', 'dielectric_absorption',
  'temp_corrected', 'temperature_corrected'
];

// Helper to check if a field is calculated
const isCalculatedField = (key: string, path: string[]): boolean => {
  const fullKey = [...path, key].join('.');
  const fieldName = key.toLowerCase();

  // Check if field name indicates it's calculated
  if (CALCULATED_FIELDS.some(calc => fieldName.includes(calc))) {
    return true;
  }

  // Check specific path patterns for calculated fields
  if (fullKey.includes('temperature.celsius') ||
      fullKey.includes('temperature.tcf') ||
      fullKey.includes('temperature.correctionFactor')) {
    return true;
  }

  if (fullKey.includes('corrected') ||
      fullKey.includes('dielectricAbsorption') ||
      fullKey.includes('polarizationIndex') ||
      fullKey.includes('dielectric_absorption') ||
      fullKey.includes('polarization_index')) {
    return true;
  }

  // Check for temperature corrected values in insulation tests
  if (fullKey.includes('insulation_resistance') && fullKey.includes('corrected')) {
    return true;
  }

  return false;
};

// Generic report editor that works with any report data structure
function GenericReportEditor({ job, reportData, onSave }: { job: Job | null; reportData: any; onSave: (data: any) => void }) {
  const [editedData, setEditedData] = useState<any>(reportData);
  const [isEditing, setIsEditing] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  // Debug complex reports
  useEffect(() => {
    if (reportData) {
      const dataSize = JSON.stringify(reportData).length;
      const hasComplexArrays = Object.values(reportData).some((val: any) =>
        Array.isArray(val) && val.length > 5 && typeof val[0] === 'object' && val[0] !== null
      );
      const arrayCount = Object.values(reportData).filter((val: any) => Array.isArray(val)).length;

      console.log('📊 ReportViewer data analysis:', {
        dataSize: `${(dataSize / 1024).toFixed(2)}KB`,
        totalKeys: Object.keys(reportData).length,
        arrayCount,
        hasComplexArrays,
        largestArray: Math.max(...Object.values(reportData).filter((val: any) => Array.isArray(val)).map((arr: any) => arr.length), 0)
      });

      if (hasComplexArrays) {
        console.log('🔍 Complex arrays found:', Object.entries(reportData).filter(([key, val]) => Array.isArray(val) && val.length > 5));
      }
    }
  }, [reportData]);

  const handleFieldChange = (path: string[], value: any) => {
    const newData = { ...editedData };
    let current = newData;
    for (let i = 0; i < path.length - 1; i++) {
      if (!current[path[i]]) current[path[i]] = {};
      current = current[path[i]];
    }
    current[path[path.length - 1]] = value;
    setEditedData(newData);
  };

  const renderField = (key: string, value: any, path: string[] = []) => {
    const fullPath = [...path, key];
    const pathString = fullPath.join('.');

    if (value === null || value === undefined) {
      return (
        <div key={pathString} className="field-row">
          <label>{key}:</label>
          <input
            type="text"
            value=""
            placeholder="null"
            onChange={(e) => handleFieldChange(fullPath, e.target.value || null)}
          />
        </div>
      );
    }

    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      const isCalculated = isCalculatedField(key, path);

      return (
        <div key={pathString} className={`field-row ${isCalculated ? 'calculated-field' : ''}`}>
          <label>{key}:{isCalculated && <span className="formula-indicator"> (Formula will fill when synced)</span>}</label>
          <input
            type={typeof value === 'number' ? 'number' : 'text'}
            value={String(value ?? '')}
            onChange={(e) => !isCalculated && handleFieldChange(fullPath, typeof value === 'number' ? Number(e.target.value) : e.target.value)}
            readOnly={isCalculated}
            className={isCalculated ? 'calculated-input' : ''}
          />
        </div>
      );
    }

    if (Array.isArray(value)) {
      const maxArrayItems = expandedSections.has(pathString) ? 100 : 10; // Show more when expanded
      const isExpanded = expandedSections.has(pathString);

      return (
        <div key={pathString} className="field-group">
          <h4 onClick={() => toggleSection(pathString)} style={{cursor: 'pointer'}}>
            {key} ({value.length} items) {value.length > 10 && (isExpanded ? '▼' : '▶')}
          </h4>
          {value.slice(0, maxArrayItems).map((item, index) => (
            <div key={`${pathString}[${index}]`} className="array-item">
              <h5>Item {index}</h5>
              {renderObjectFields(item as any, [...fullPath, index.toString()], undefined, expandedSections.has(pathString))}
            </div>
          ))}
          {value.length > maxArrayItems && (
            <div className="field-row">
              <label>⚠️ Array truncated:</label>
              <span>{value.length - maxArrayItems} more items - click header to expand</span>
            </div>
          )}
        </div>
      );
    }

    if (typeof value === 'object') {
      const objectKeys = Object.keys(value);
      const maxObjectFields = expandedSections.has(pathString) ? 200 : 30; // Show more when expanded
      const isExpanded = expandedSections.has(pathString);
      const shouldTruncate = objectKeys.length > maxObjectFields;

      return (
        <div key={pathString} className="field-group">
          <h4 onClick={() => shouldTruncate && toggleSection(pathString)} style={{cursor: shouldTruncate ? 'pointer' : 'default'}}>
            {key} ({objectKeys.length} fields) {shouldTruncate && (isExpanded ? '▼' : '▶')}
          </h4>
          {renderObjectFields(value as any, fullPath, maxObjectFields, isExpanded)}
        </div>
      );
    }

    return null;
  };

  const renderObjectFields = (obj: any, path: string[] = [], maxFields?: number, isExpanded?: boolean) => {
    if (!obj || typeof obj !== 'object') return null;

    const entries = Object.entries(obj);
    const limit = maxFields || 50; // Default limit

    if (entries.length > limit && !isExpanded) {
      console.warn(`⚠️ Large object detected (${entries.length} fields), limiting display to ${limit} fields`);
      return (
        <>
          {entries.slice(0, limit).map(([key, value]) => renderField(key, value, path))}
          <div className="field-row">
            <label>⚠️ Object truncated:</label>
            <span>{entries.length - limit} more fields - expand section to see all</span>
          </div>
        </>
      );
    }

    return entries.map(([key, value]) => renderField(key, value, path));
  };

  const handleSave = () => {
    onSave(editedData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedData(reportData);
    setIsEditing(false);
  };

  const toggleSection = (sectionKey: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionKey)) {
      newExpanded.delete(sectionKey);
    } else {
      newExpanded.add(sectionKey);
    }
    setExpandedSections(newExpanded);
  };

    return (
      <div className="generic-report-editor">
        <div className="editor-header">
          <h3>Report Editor</h3>
          <div className="editor-controls">
            {!isEditing ? (
              <button onClick={() => setIsEditing(true)} className="btn-primary">
                Edit Report
              </button>
            ) : (
              <>
                <button onClick={handleSave} className="btn-primary">
                  Save Changes
                </button>
                <button onClick={handleCancel} className="btn-secondary">
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>

      <div className="editor-content">
        {renderObjectFields(editedData, [], 100, true)}
      </div>

      {!isEditing && (
        <div className="raw-data-view">
          <h4>Raw Data (Read-only)</h4>
          <pre className="report-json">
            {JSON.stringify(editedData, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}