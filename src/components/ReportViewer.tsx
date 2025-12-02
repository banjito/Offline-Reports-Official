/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Job } from '../types';
import './ReportViewer.css';

// Import all report components
import {
  LowVoltageSwitchMultiDeviceReport,
  PanelboardReport,
  SwitchgearReport,
  DryTypeTransformerReport,
  LowVoltageCircuitBreakerReport,
  MediumVoltageCircuitBreakerReport,
  AutomaticTransferSwitchReport,
  MediumVoltageSwitchReport,
  MediumVoltageSwitchMTSReport,
  MediumVoltageMotorStarterMTSReport,
  MetalEnclosedBuswayReport,
  MediumVoltageVLFReport,
  GroundingSystemMasterReport,
  LowVoltageCableReport,
  CurrentTransformerReport,
  PotentialTransformerReport,
  VoltagePotentialTransformerMTSReport,
  LiquidFilledTransformerReport,
  // New VLF Report Components
  TanDeltaChartReport,
  TanDeltaChartMTSReport,
  MediumVoltageVLFATSReport,
  MediumVoltageVLFMTSReportNew,
  MediumVoltageCableVLFTestReport,
  getCircuitBreakerVariant,
  getMVSwitchVariant,
  getCableVariant,
  getTransformerTestVariant
} from './reports';
import LiquidFilledXfmrATS25Report from './reports/LiquidFilledXfmrATS25Report';
import SmallLVDryTypeTransformerATS25Report from './reports/SmallLVDryTypeTransformerATS25Report';
import LargeDryTypeTransformerMTSReport from './reports/LargeDryTypeTransformerMTSReport';
import LiquidXfmrVisualMTSReport from './reports/LiquidXfmrVisualMTSReport';
import SwitchgearSwitchboardATS25Report from './reports/SwitchgearSwitchboardATS25Report';
import PanelboardAssembliesATS25Report from './reports/PanelboardAssembliesATS25Report';
import SwitchgearPanelboardMTSReport from './reports/SwitchgearPanelboardMTSReport';
import TwoSmallDryTypeXfmrATSReport from './reports/TwoSmallDryTypeXfmrATSReport';
import TwoSmallDryTypeXfmrMTSReport from './reports/TwoSmallDryTypeXfmrMTSReport';
import OilInspectionReport from './reports/OilInspectionReport';
import LowVoltageSwitchMaintMTSReport from './reports/LowVoltageSwitchMaintMTSReport';
import LowVoltagePanelboardSmallBreakerReport from './reports/LowVoltagePanelboardSmallBreakerReport';

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

    // Route to specific report renderers based on report type
    switch (reportType) {
      // Low Voltage Switch Reports
      case 'low-voltage-switch-multi-device-test':
      case 'low-voltage-switch-report':
        return (
          <LowVoltageSwitchMultiDeviceReport
            job={job}
            reportData={reportData}
            onSave={handleSave}
          />
        );

      case '6-low-voltage-switch-maint-mts-report':
        return (
          <LowVoltageSwitchMaintMTSReport
            job={job}
            reportData={reportData}
            onSave={handleSave}
          />
        );
      
      // Panelboard Reports
      case 'panelboard-report':
      case 'panelboard-assemblies-ats25':
        return (
          <PanelboardAssembliesATS25Report
            job={job}
            reportData={reportData}
            onSave={handleSave}
          />
        );
      
      // Switchgear Reports
      case 'switchgear-report':
      case 'switchgear-switchboard-assemblies-ats25':
        return (
          <SwitchgearSwitchboardATS25Report
            job={job}
            reportData={reportData}
            onSave={handleSave}
          />
        );
      case 'switchgear-panelboard-mts-report':
        return (
          <SwitchgearPanelboardMTSReport
            job={job}
            reportData={reportData}
            onSave={handleSave}
          />
        );
      
      // Dry Type Transformer Reports
      case 'dry-type-transformer':
      case 'large-dry-type-transformer-report':
      case 'large-dry-type-transformer':
      case 'small-lv-dry-type-transformer-ats25':
        return (
          <SmallLVDryTypeTransformerATS25Report
            job={job}
            reportData={reportData}
            onSave={handleSave}
          />
        );

      case 'large-dry-type-transformer-mts-report':
      case 'large-dry-type-xfmr-mts-report':
        return (
          <LargeDryTypeTransformerMTSReport
            job={job}
            reportData={reportData}
            onSave={handleSave}
          />
        );
      
      case 'two-small-dry-typer-xfmr-mts-report':
        return (
          <TwoSmallDryTypeXfmrMTSReport
            job={job}
            reportData={reportData}
            onSave={handleSave}
          />
        );
      
      case 'two-small-dry-typer-xfmr-ats-report':
        return (
          <TwoSmallDryTypeXfmrATSReport
            job={job}
            reportData={reportData}
            onSave={handleSave}
          />
        );
      
      // Liquid Filled Transformer Reports
      case 'liquid-filled-transformer':
        return (
          <LiquidFilledTransformerReport
            job={job}
            reportData={reportData}
            onSave={handleSave}
            variant={reportType.includes('mts') ? 'mts' : 'ats'}
          />
        );

      case 'oil-inspection':
        return (
          <OilInspectionReport
            job={job}
            reportData={reportData}
            onSave={handleSave}
          />
        );

      case 'liquid-xfmr-visual-mts-report':
        return (
          <LiquidXfmrVisualMTSReport
            job={job}
            reportData={reportData}
            onSave={handleSave}
          />
        );
      
      // Liquid Filled Transformer ATS 25 Report
      case 'liquid-filled-xfmr-ats25':
        return (
          <LiquidFilledXfmrATS25Report
            job={job}
            reportData={reportData}
            onSave={handleSave}
            isEditing={true}
          />
        );
      
      // Low Voltage Circuit Breaker Reports
      case 'low-voltage-circuit-breaker-electronic-trip-ats-report':
      case 'low-voltage-circuit-breaker-electronic-trip-ats-primary-injection':
      case '8-low-voltage-circuit-breaker-electronic-trip-unit-ats-primary-injection':
      case 'low-voltage-circuit-breaker-electronic-trip-ats-secondary-injection-report':
      case 'low-voltage-circuit-breaker-thermal-magnetic-ats-report':
      case 'low-voltage-circuit-breaker-electronic-trip-mts-report':
      case 'low-voltage-circuit-breaker-thermal-magnetic-mts-report':
        return (
          <LowVoltageCircuitBreakerReport
            job={job}
            reportData={reportData}
            onSave={handleSave}
            variant={getCircuitBreakerVariant(reportType)}
          />
        );
      
      // Low Voltage Panelboard Small Breaker Report
      case 'low-voltage-panelboard-small-breaker-report':
        return (
          <LowVoltagePanelboardSmallBreakerReport
            job={job}
            reportData={reportData}
            onSave={handleSave}
          />
        );
      
      // Medium Voltage Circuit Breaker Reports
      case 'medium-voltage-circuit-breaker-report':
      case 'medium-voltage-circuit-breaker-mts-report':
        return (
          <MediumVoltageCircuitBreakerReport
            job={job}
            reportData={reportData}
            onSave={handleSave}
          />
        );
      
      // Automatic Transfer Switch Reports
      case 'automatic-transfer-switch-ats-report':
        return (
          <AutomaticTransferSwitchReport
            job={job}
            reportData={reportData}
            onSave={handleSave}
          />
        );
      
      // Medium Voltage Switch Reports (Oil & SF6)
      case 'medium-voltage-switch-oil-report':
      case 'medium-voltage-switch-sf6-report':
        return (
          <MediumVoltageSwitchReport
            job={job}
            reportData={reportData}
            onSave={handleSave}
            variant={getMVSwitchVariant(reportType)}
          />
        );
      
      // 23-Medium Voltage Switch MTS Report (different structure from Oil/SF6)
      case '23-medium-voltage-switch-mts-report':
        return (
          <MediumVoltageSwitchMTSReport
            job={job}
            reportData={reportData}
            onSave={handleSave}
          />
        );
      
      // Grounding Reports
      case 'grounding-system-master':
      case 'grounding-fall-of-potential-slope-method-test':
        return (
          <GroundingSystemMasterReport
            job={job}
            reportData={reportData}
            onSave={handleSave}
          />
        );

      // Low Voltage Cable Reports
      case 'low-voltage-cable-test-12sets':
      case 'low-voltage-cable-test-20sets':
      case 'low-voltage-cable-test-3sets':
      case '3-low-voltage-cable-ats':
      case '3-low-voltage-cable-mts':
        return (
          <LowVoltageCableReport
            job={job}
            reportData={reportData}
            onSave={handleSave}
            variant={getCableVariant(reportType)}
          />
        );
      
      // Current Transformer Reports
      case 'current-transformer-test-ats-report':
      case '12-current-transformer-test-ats-report':
      case '12-current-transformer-test-mts-report':
        return (
          <CurrentTransformerReport
            job={job}
            reportData={reportData}
            onSave={handleSave}
            variant={getTransformerTestVariant(reportType)}
          />
        );
        
      // Potential Transformer Reports
      case 'potential-transformer-ats-report':
        return (
          <PotentialTransformerReport
            job={job}
            reportData={reportData}
            onSave={handleSave}
            variant={getTransformerTestVariant(reportType)}
          />
        );
      
      case '13-voltage-potential-transformer-test-mts-report':
        return (
          <VoltagePotentialTransformerMTSReport
            job={job}
            reportData={reportData}
            onSave={handleSave}
          />
        );
          
      // Medium Voltage VLF - Tan Delta Chart ATS
      case 'medium-voltage-vlf-tan-delta':
        return (
          <TanDeltaChartReport
            job={job}
            reportData={reportData}
            isEditing={true}
            onSave={handleSave}
          />
        );
        
      // Medium Voltage VLF - Tan Delta Chart MTS
      case 'medium-voltage-vlf-tan-delta-mts':
      case 'electrical-tan-delta-test-mts-form':
        return (
          <TanDeltaChartMTSReport
            job={job}
            reportData={reportData}
            isEditing={true}
            onSave={handleSave}
          />
        );
        
      // Medium Voltage VLF - Full VLF Test ATS
      case 'medium-voltage-vlf':
        return (
          <MediumVoltageVLFATSReport
            job={job}
            reportData={reportData}
            isEditing={true}
            onSave={handleSave}
          />
        );
        
      // Medium Voltage VLF - Full VLF Test MTS
      case 'medium-voltage-vlf-mts-report':
        return (
          <MediumVoltageVLFMTSReportNew
            job={job}
            reportData={reportData}
            isEditing={true}
            onSave={handleSave}
          />
        );
        
      // Medium Voltage VLF - Combined VLF + Tan Delta ATS
      case 'medium-voltage-cable-vlf-test':
        return (
          <MediumVoltageCableVLFTestReport
            job={job}
            reportData={reportData}
            isEditing={true}
            onSave={handleSave}
            isMTS={false}
          />
        );
        
      // Medium Voltage VLF - Combined VLF + Tan Delta MTS
      case 'medium-voltage-cable-vlf-test-mts':
        return (
          <MediumVoltageCableVLFTestReport
            job={job}
            reportData={reportData}
            isEditing={true}
            onSave={handleSave}
            isMTS={true}
          />
        );
        
      // Metal Enclosed Busway
      case 'metal-enclosed-busway':
        return (
          <MetalEnclosedBuswayReport
            reportData={reportData}
            isEditing={true}
            onSave={handleSave}
          />
        );
        
      // Motor Starter
      case '23-medium-voltage-motor-starter-mts-report':
        return (
          <MediumVoltageMotorStarterMTSReport
            reportData={reportData}
            isEditing={true}
            onSave={handleSave}
          />
        );
          
      // Relay Test (using MV Circuit Breaker as similar structure)
      case 'relay-test-report':
        return (
          <MediumVoltageCircuitBreakerReport
            job={job}
            reportData={reportData}
            onSave={handleSave}
          />
        );
      
      // Oil Analysis (using Liquid Filled Transformer as similar structure)
      case 'oil-analysis':
        return (
          <LiquidFilledTransformerReport
            job={job}
            reportData={reportData}
            onSave={handleSave}
            variant="ats"
          />
        );
      
      default:
        // Fall back to generic editor for unknown report types
        return <GenericReportEditor reportData={reportData} onSave={handleSave} />;
    }
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
function GenericReportEditor({ reportData, onSave }: { reportData: any; onSave: (data: any) => void }) {
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
        console.log('🔍 Complex arrays found:', Object.entries(reportData).filter(([, val]) => Array.isArray(val) && (val as any[]).length > 5));
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
