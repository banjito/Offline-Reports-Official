import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { StructuredReportRenderer } from './StructuredReportRenderer';
import { applyReportFormulas, calculateTCF } from '../utils/reportFormulas';
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
      
      const result = await window.electronAPI.dbQuery('technical_reports', 'getById', { id: reportId });
      
      if (result.success && result.data) {
        const reportRecord = result.data;
        setReport(reportRecord);
        
        // Parse JSON fields
        const parsedData = typeof reportRecord.report_data === 'string' 
          ? JSON.parse(reportRecord.report_data) 
          : reportRecord.report_data;
        
        // Apply formulas (TCF corrections, etc.)
        const dataWithFormulas = applyReportFormulas(parsedData);
        
        setReportData(dataWithFormulas);
        console.log('✅ Report loaded successfully:', reportRecord.title);
        console.log('📊 Report data structure:', JSON.stringify(parsedData, null, 2));
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

      const result = await window.electronAPI.dbQuery('technical_reports', 'updateReport', updateData);
      
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

  const handleFieldChange = (path: string, value: any) => {
    updateFieldValue(path, value);
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
    const keys = path.split(/[\.\[\]]+/).filter(k => k); // Handle both dot notation and array indices
    const newData = { ...reportData };
    let current: any = newData;

    // Navigate to the parent of the field we're updating
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!current[key]) {
        // Check if next key is a number (array index)
        const nextKey = keys[i + 1];
        current[key] = /^\d+$/.test(nextKey) ? [] : {};
      }
      current = current[key];
    }

    const lastKey = keys[keys.length - 1];
    current[lastKey] = value;

    // Special handling for temperature conversions
    if (path.includes('fahrenheit') || path.includes('temperature.fahrenheit')) {
      const fahrenheit = parseFloat(value);
      if (!isNaN(fahrenheit)) {
        const celsius = Math.round(((fahrenheit - 32) * 5 / 9) * 10) / 10;
        
        // Find the temperature object in the path
        const tempPath = path.substring(0, path.lastIndexOf('.'));
        const tempKeys = tempPath.split(/[\.\[\]]+/).filter(k => k);
        let tempObj: any = newData;
        for (const k of tempKeys) {
          tempObj = tempObj[k];
        }
        
        if (tempObj) {
          tempObj.celsius = celsius;
          
          // Calculate TCF based on celsius
          const tcf = calculateTCF(celsius);
          tempObj.tcf = tcf;
        }
      }
    }
    
    // Special handling for celsius conversions
    if (path.includes('celsius') || path.includes('temperature.celsius')) {
      const celsius = parseFloat(value);
      if (!isNaN(celsius)) {
        const fahrenheit = Math.round((celsius * 9 / 5 + 32) * 10) / 10;
        
        // Find the temperature object in the path
        const tempPath = path.substring(0, path.lastIndexOf('.'));
        const tempKeys = tempPath.split(/[\.\[\]]+/).filter(k => k);
        let tempObj: any = newData;
        for (const k of tempKeys) {
          tempObj = tempObj[k];
        }
        
        if (tempObj) {
          tempObj.fahrenheit = fahrenheit;
          
          // Calculate TCF based on celsius
          const tcf = calculateTCF(celsius);
          tempObj.tcf = tcf;
        }
      }
    }

    // Apply formulas after updating (TCF corrections, etc.)
    const dataWithFormulas = applyReportFormulas(newData);
    setReportData(dataWithFormulas);
  };

  // Temperature Correction Factor calculation
  const calculateTCF = (celsius: number): number => {
    // TCF table based on NETA standards
    const tcfTable: { [key: number]: number } = {
      0: 0.25, 5: 0.33, 10: 0.45, 15: 0.63, 20: 1.0,
      25: 1.25, 30: 1.66, 35: 2.0, 40: 2.5, 45: 3.0,
      50: 4.0, 55: 5.0, 60: 6.0
    };
    
    // Find exact match or interpolate
    if (tcfTable[celsius]) {
      return tcfTable[celsius];
    }
    
    // Find surrounding values for interpolation
    const temps = Object.keys(tcfTable).map(Number).sort((a, b) => a - b);
    let lower = temps[0];
    let upper = temps[temps.length - 1];
    
    for (let i = 0; i < temps.length - 1; i++) {
      if (celsius >= temps[i] && celsius <= temps[i + 1]) {
        lower = temps[i];
        upper = temps[i + 1];
        break;
      }
    }
    
    // Linear interpolation
    const ratio = (celsius - lower) / (upper - lower);
    const tcf = tcfTable[lower] + ratio * (tcfTable[upper] - tcfTable[lower]);
    return Math.round(tcf * 100) / 100;
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

        {Object.keys(reportData).length === 0 ? (
          <div className="empty-report">
            <p>This report has no data yet</p>
            <button onClick={() => setIsEditMode(true)} className="btn-primary">
              Start Editing
            </button>
          </div>
        ) : (
          <StructuredReportRenderer
            data={reportData}
            isEditMode={isEditMode}
            onFieldChange={handleFieldChange}
          />
        )}
      </div>
    </div>
  );
}

