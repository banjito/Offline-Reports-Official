import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './ReportViewer.css';

interface ReportData {
  id: string;
  job_id: string;
  title: string;
  report_type: string;
  status: string;
  report_data: any;
  created_at: string;
  updated_at: string;
}

export function ReportViewer() {
  const { jobId, reportId } = useParams<{ jobId: string; reportId: string }>();
  const navigate = useNavigate();
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [reportData, setReportData] = useState<any>({});

  useEffect(() => {
    if (reportId) {
      loadReport();
    }
  }, [reportId]);

  const loadReport = async () => {
    try {
      setLoading(true);
      console.log('🔍 Loading report with ID:', reportId);
      
      const result = await window.electronAPI.dbQuery('reports', 'getById', { id: reportId });
      
      if (result.success && result.data) {
        const reportRecord = result.data;
        setReport(reportRecord);
        
        // Parse JSON fields
        const parsedData = typeof reportRecord.report_data === 'string' 
          ? JSON.parse(reportRecord.report_data) 
          : reportRecord.report_data;
        
        setReportData(parsedData);
        console.log('✅ Report loaded successfully:', reportRecord.title);
      } else {
        console.error('❌ Report not found in technical_reports table');
        console.log('💡 This might be a placeholder asset or the report needs to be synced');
        
        // Check if we can get any info from the job's assets
        console.log('🔍 Checking assets table for info...');
        const assetsResult = await window.electronAPI.dbQuery('assets', 'getByJobId', { jobId });
        if (assetsResult.success && assetsResult.data) {
          const matchingAsset = assetsResult.data.find((a: any) => {
            if (!a.file_url) return false;
            const urlParts = a.file_url.split('/');
            const assetReportId = urlParts[urlParts.length - 1];
            return assetReportId === reportId;
          });
          
          if (matchingAsset) {
            console.log('📄 Found matching asset:', matchingAsset.name);
            console.log('   Status:', matchingAsset.status);
            console.log('   URL:', matchingAsset.file_url);
          }
        }
        
        alert(`Report not found in local database.\n\nThis report may need to be synced from the online system.\n\nReport ID: ${reportId}\n\nTry syncing again to download this report's data.`);
      }
    } catch (error) {
      console.error('Error loading report:', error);
      alert(`Error loading report: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!report) return;

    try {
      const updateData = {
        id: report.id,
        report_data: JSON.stringify(reportData),
        updated_at: new Date().toISOString(),
      };

      const result = await window.electronAPI.dbQuery('reports', 'updateReport', updateData);
      
      if (result.success) {
        alert('Report saved successfully!');
        setIsEditMode(false);
        loadReport(); // Reload to get updated data
      } else {
        alert(`Failed to save report: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error saving report:', error);
      alert(`Error saving report: ${error}`);
    }
  };

  const renderField = (key: string, value: any, path: string = ''): React.ReactNode => {
    const fullPath = path ? `${path}.${key}` : key;

    if (value === null || value === undefined) {
      return null;
    }

    if (typeof value === 'object' && !Array.isArray(value)) {
      return (
        <div key={fullPath} className="report-section">
          <h3 className="section-title">{formatKey(key)}</h3>
          <div className="section-content">
            {Object.entries(value).map(([k, v]) => renderField(k, v, fullPath))}
          </div>
        </div>
      );
    }

    if (Array.isArray(value)) {
      return (
        <div key={fullPath} className="report-array">
          <h4 className="array-title">{formatKey(key)}</h4>
          <div className="array-content">
            {value.map((item, index) => (
              <div key={`${fullPath}[${index}]`} className="array-item">
                {typeof item === 'object' ? (
                  Object.entries(item).map(([k, v]) => renderField(k, v, `${fullPath}[${index}]`))
                ) : (
                  <div className="field-row">
                    <span className="field-value">{String(item)}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      );
    }

    // Primitive value
    return (
      <div key={fullPath} className="field-row">
        <label className="field-label">{formatKey(key)}:</label>
        {isEditMode ? (
          <input
            type="text"
            value={String(value)}
            onChange={(e) => updateFieldValue(fullPath, e.target.value)}
            className="field-input"
          />
        ) : (
          <span className="field-value">{String(value)}</span>
        )}
      </div>
    );
  };

  const formatKey = (key: string): string => {
    return key
      .replace(/_/g, ' ')
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  };

  const formatReportType = (reportType: string): string => {
    // Convert table name like "automatic_transfer_switch_ats_reports" to "Automatic Transfer Switch (ATS)"
    return reportType
      .replace(/_reports$/, '') // Remove "_reports" suffix
      .replace(/_ats$/, ' (ATS)') // Replace "_ats" with " (ATS)"
      .replace(/_mts$/, ' (MTS)') // Replace "_mts" with " (MTS)"
      .replace(/_/g, ' ') // Replace remaining underscores with spaces
      .replace(/\b\w/g, char => char.toUpperCase()); // Capitalize each word
  };

  const updateFieldValue = (path: string, value: any) => {
    const keys = path.split('.');
    const newData = { ...reportData };
    let current = newData;

    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!current[key]) {
        current[key] = {};
      }
      current = current[key];
    }

    const lastKey = keys[keys.length - 1];
    current[lastKey] = value;
    setReportData(newData);
  };

  if (loading) {
    return (
      <div className="report-viewer-container">
        <div className="loading">Loading report...</div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="report-viewer-container">
        <div className="error">Report not found</div>
        <button onClick={() => navigate(`/job/${jobId}`)} className="btn-secondary">
          Back to Job
        </button>
      </div>
    );
  }

  return (
    <div className="report-viewer-container">
      <div className="report-header">
        <div className="header-left">
          <button onClick={() => navigate(`/job/${jobId}`)} className="btn-back">
            ← Back to Job
          </button>
          <div className="report-title-section">
            <h1>{report.title}</h1>
            <span className="report-type-badge">{formatReportType(report.report_type)}</span>
            <span className={`status-badge status-${report.status}`}>{report.status}</span>
          </div>
        </div>
        <div className="header-right">
          {isEditMode ? (
            <>
              <button onClick={() => setIsEditMode(false)} className="btn-secondary">
                Cancel
              </button>
              <button onClick={handleSave} className="btn-primary">
                Save Changes
              </button>
            </>
          ) : (
            <button onClick={() => setIsEditMode(true)} className="btn-primary">
              Edit Report
            </button>
          )}
        </div>
      </div>

      <div className="report-content">
        <div className="report-metadata">
          <div className="metadata-item">
            <strong>Created:</strong> {new Date(report.created_at).toLocaleString()}
          </div>
          <div className="metadata-item">
            <strong>Last Updated:</strong> {new Date(report.updated_at).toLocaleString()}
          </div>
        </div>

        <div className="report-data">
          {Object.entries(reportData).map(([key, value]) => renderField(key, value))}
        </div>

        {Object.keys(reportData).length === 0 && (
          <div className="empty-report">
            <p>This report has no data yet</p>
            <button onClick={() => setIsEditMode(true)} className="btn-primary">
              Start Editing
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

