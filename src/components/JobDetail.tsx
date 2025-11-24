import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Job } from '../types';
import './JobDetail.css';

interface LinkedReport {
  id: string;
  title: string;
  status: string;
  report_type: string;
  created_at: string;
  updated_at: string;
}

interface ReportTemplate {
  id: string;
  name: string;
  route: string;
  template_type: 'ATS' | 'MTS';
}

// All available report templates from the web app
const REPORT_TEMPLATES: ReportTemplate[] = [
  {
    id: 'switchgear-panelboard-mts',
    name: '1-Switchgear, Switchboard, Panelboard Inspection & Test Report MTS',
    route: 'switchgear-panelboard-mts-report',
    template_type: 'MTS'
  },
  {
    id: 'switchgear-switchboard-assemblies-ats25',
    name: '7.1.1 Switchgear & Switchboard Assemblies Test Sheet ATS 25',
    route: 'switchgear-switchboard-assemblies-ats25',
    template_type: 'ATS'
  },
  {
    id: 'panelboard-assemblies-ats25',
    name: '7.1.2 Panelboard Assemblies Test Sheet ATS 25',
    route: 'panelboard-assemblies-ats25',
    template_type: 'ATS'
  },
  {
    id: 'grounding-system-master',
    name: 'Grounding System MASTER',
    route: 'grounding-system-master',
    template_type: 'ATS'
  },
  {
    id: 'grounding-fall-of-potential-slope-method-test',
    name: 'Grounding Fall of Potential Slope Method Test',
    route: 'grounding-fall-of-potential-slope-method-test',
    template_type: 'ATS'
  },
  {
    id: 'large-dry-type-transformer-mts-report',
    name: '2-Large Dry Type Xfmr. Inspection and Test MTS 23',
    route: 'large-dry-type-transformer-mts-report',
    template_type: 'MTS'
  },
  {
    id: 'large-dry-type-xfmr-mts-report',
    name: '2-Large Dry Type Xfmr. Visual, Mechanical, Insulation Resistance Test MTS',
    route: 'large-dry-type-xfmr-mts-report',
    template_type: 'MTS'
  },
  {
    id: 'liquid-xfmr-visual-mts-report',
    name: '2-Liquid Filled Xfmr. Visual, Mechanical, Insulation Resistance Test MTS',
    route: 'liquid-xfmr-visual-mts-report',
    template_type: 'MTS'
  },
  {
    id: 'low-voltage-cable-test-3sets-mts',
    name: '3-Low Voltage Cable MTS',
    route: 'low-voltage-cable-test-3sets',
    template_type: 'MTS'
  },
  {
    id: 'electrical-tan-delta-test-mts-form',
    name: '4-Medium Voltage Cable VLF Tan Delta MTS',
    route: 'electrical-tan-delta-test-mts-form',
    template_type: 'MTS'
  },
  {
    id: 'switchgear-inspection-report',
    name: '1-Switchgear, Switchboard, Panelboard Inspection & Test Report ATS 21',
    route: 'switchgear-report',
    template_type: 'ATS'
  },
  {
    id: 'panelboard-inspection-report',
    name: '1-Panelboard Inspection & Test Report ATS 21',
    route: 'panelboard-report',
    template_type: 'ATS'
  },
  {
    id: 'dry-type-transformer-test',
    name: '2-Dry Type Xfmr. Visual, Mechanical, Insulation Resistance Test ATS 21',
    route: 'dry-type-transformer',
    template_type: 'ATS'
  },
  {
    id: 'large-dry-type-transformer-test',
    name: '2-Large Dry Type Xfmr. Visual, Mechanical, Insulation Resistance Test ATS 21',
    route: 'large-dry-type-transformer-report',
    template_type: 'ATS'
  },
  {
    id: 'liquid-filled-transformer-test',
    name: '2-Liquid Filled Xfmr. Visual, Mechanical, Insulation Resistance Test ATS 21',
    route: 'liquid-filled-transformer',
    template_type: 'ATS'
  },
  {
    id: 'two-small-dry-typer-xfmr-ats-report',
    name: '2-Small Dry Typer Xfmr. Inspection and Test ATS',
    route: 'two-small-dry-typer-xfmr-ats-report',
    template_type: 'ATS'
  },
  {
    id: 'low-voltage-cable-test-12sets',
    name: '3-Low Voltage Cable Test ATS',
    route: 'low-voltage-cable-test-12sets',
    template_type: 'ATS'
  },
  {
    id: 'medium-voltage-vlf-tan-delta',
    name: '4-Medium Voltage Cable VLF Tan Delta Test ATS',
    route: 'medium-voltage-vlf-tan-delta',
    template_type: 'ATS'
  },
  {
    id: 'medium-voltage-vlf',
    name: '4-Medium Voltage Cable VLF Test ATS',
    route: 'medium-voltage-vlf',
    template_type: 'ATS'
  },
  {
    id: 'medium-voltage-cable-vlf-test',
    name: '4-Medium Voltage Cable VLF Test With Tan Delta ATS',
    route: 'medium-voltage-cable-vlf-test',
    template_type: 'ATS'
  },
  {
    id: 'metal-enclosed-busway',
    name: '5-Metal Enclosed Busway ATS',
    route: 'metal-enclosed-busway',
    template_type: 'ATS'
  },
  {
    id: 'low-voltage-switch-multi-device-test',
    name: '6-Low Voltage Switch - Multi-Device TEST',
    route: 'low-voltage-switch-multi-device-test',
    template_type: 'ATS'
  },
  {
    id: 'low-voltage-switch-report',
    name: '6-Low Voltage Switch ATS',
    route: 'low-voltage-switch-report',
    template_type: 'ATS'
  },
  {
    id: 'mv-switch-oil-report',
    name: '7-Medium Voltage Way Switch (OIL) Report ATS 21',
    route: 'medium-voltage-switch-oil-report',
    template_type: 'ATS'
  },
  {
    id: 'medium-voltage-switch-sf6-report',
    name: 'Medium Voltage Way Switch (SF6)',
    route: 'medium-voltage-switch-sf6-report',
    template_type: 'ATS'
  },
  {
    id: 'potential-transformer-ats-report',
    name: 'Potential Transformer ATS',
    route: 'potential-transformer-ats-report',
    template_type: 'ATS'
  },
  {
    id: 'low-voltage-circuit-breaker-electronic-trip-unit-ats',
    name: '8-Low Voltage Circuit Breaker Electronic Trip Unit ATS - Secondary Injection',
    route: 'low-voltage-circuit-breaker-electronic-trip-ats-secondary-injection-report',
    template_type: 'ATS'
  },
  {
    id: 'low-voltage-circuit-breaker-electronic-trip-ats-primary-injection',
    name: '8-Low Voltage Circuit Breaker Electronic Trip Unit ATS - Primary Injection',
    route: 'low-voltage-circuit-breaker-electronic-trip-ats-report',
    template_type: 'ATS'
  },
  {
    id: 'low-voltage-circuit-breaker-thermal-magnetic-ats',
    name: '8-Low Voltage Circuit Breaker Thermal-Magnetic ATS',
    route: 'low-voltage-circuit-breaker-thermal-magnetic-ats-report',
    template_type: 'ATS'
  },
  {
    id: 'low-voltage-panelboard-small-breaker-report',
    name: '8-Low Voltage Panelboard Small Breaker Test ATS (up to 60 individual breakers)',
    route: 'low-voltage-panelboard-small-breaker-report',
    template_type: 'ATS'
  },
  {
    id: 'medium-voltage-circuit-breaker-report',
    name: '9-Medium Voltage Circuit Breaker Test Report ATS',
    route: 'medium-voltage-circuit-breaker-report',
    template_type: 'ATS'
  },
  {
    id: 'current-transformer-test-ats-report',
    name: '12-Current Transformer Test ATS (partial, single CT)',
    route: 'current-transformer-test-ats-report',
    template_type: 'ATS'
  },
  {
    id: 'new-current-transformer-test-ats-report',
    name: '12-Current Transformer Test ATS',
    route: '12-current-transformer-test-ats-report',
    template_type: 'ATS'
  },
  {
    id: 'automatic-transfer-switch-ats-report',
    name: '35-Automatic Transfer Switch ATS',
    route: 'automatic-transfer-switch-ats-report',
    template_type: 'ATS'
  },
  {
    id: 'medium-voltage-vlf-mts-report',
    name: '4-Medium Voltage Cable VLF Test Report MTS',
    route: 'medium-voltage-vlf-mts-report',
    template_type: 'MTS'
  },
  {
    id: 'medium-voltage-cable-vlf-test-mts',
    name: '4-Medium Voltage Cable VLF Test With Tan Delta MTS',
    route: 'medium-voltage-cable-vlf-test-mts',
    template_type: 'MTS'
  },
  {
    id: '6-low-voltage-switch-maint-mts-report',
    name: '6-Low Voltage Switch Maint. MTS',
    route: '6-low-voltage-switch-maint-mts-report',
    template_type: 'MTS'
  },
  {
    id: 'low-voltage-circuit-breaker-electronic-trip-mts-report',
    name: '8-Low Voltage Circuit Breaker Electronic Trip Unit MTS - Primary Injection',
    route: 'low-voltage-circuit-breaker-electronic-trip-mts-report',
    template_type: 'MTS'
  },
  {
    id: 'low-voltage-circuit-breaker-thermal-magnetic-mts-report',
    name: '8-Low Voltage Circuit Breaker Thermal-Magnetic MTS',
    route: 'low-voltage-circuit-breaker-thermal-magnetic-mts-report',
    template_type: 'MTS'
  },
  {
    id: 'medium-voltage-circuit-breaker-mts-report',
    name: '9-Medium Voltage Circuit Breaker Test Report MTS',
    route: 'medium-voltage-circuit-breaker-mts-report',
    template_type: 'MTS'
  },
  {
    id: '12-current-transformer-test-mts-report',
    name: '12-Current Transformer Test MTS',
    route: '12-current-transformer-test-mts-report',
    template_type: 'MTS'
  },
  {
    id: '13-voltage-potential-transformer-test-mts-report',
    name: '13-Voltage Potential Transformer Test MTS',
    route: '13-voltage-potential-transformer-test-mts-report',
    template_type: 'MTS'
  },
  {
    id: '23-medium-voltage-motor-starter-mts-report',
    name: '23-Medium Voltage Motor Starter MTS Report',
    route: '23-medium-voltage-motor-starter-mts-report',
    template_type: 'MTS'
  },
  {
    id: '23-medium-voltage-switch-mts-report',
    name: '23-Medium Voltage Switch MTS',
    route: '23-medium-voltage-switch-mts-report',
    template_type: 'MTS'
  },
  {
    id: 'two-small-dry-typer-xfmr-mts-report',
    name: '2-Small Dry Typer Xfmr. Inspection and Test MTS',
    route: 'two-small-dry-typer-xfmr-mts-report',
    template_type: 'MTS'
  }
];

export function JobDetail() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();

  const [job, setJob] = useState<Job | null>(null);
  const [reports, setReports] = useState<LinkedReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTemplateMenu, setShowTemplateMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadJobAndReports();

    // Listen for sync events to refresh the job detail
    const handleSyncComplete = () => {
      console.log('🔄 Sync completed, refreshing job detail...');
      loadJobAndReports();
    };

    window.addEventListener('jobs-synced', handleSyncComplete);

    return () => {
      window.removeEventListener('jobs-synced', handleSyncComplete);
    };
  }, [jobId]);

  const loadJobAndReports = async () => {
    if (!jobId) return;

    try {
      setLoading(true);

      // Load job details
      const jobResult = await window.electronAPI.dbQuery<Job[]>('jobs', 'getAll', {});
      if (jobResult.success && jobResult.data) {
        const currentJob = jobResult.data.find(j => j.id === jobId);
        if (currentJob) {
          setJob(currentJob);
        }
      }

      // Load linked assets (which represent "reports" in the UI)
      console.log('📋 Fetching assets for job ID:', jobId);
      const assetsResult = await window.electronAPI.dbQuery<any[]>('assets', 'getByJobId', { jobId });
      console.log('📋 Assets query result:', assetsResult);

      if (assetsResult.success && assetsResult.data) {
        console.log(`✅ Found ${assetsResult.data.length} assets/reports for this job`);

        // Log status breakdown
        if (assetsResult.data.length > 0) {
          const statusCounts: Record<string, number> = {};
          assetsResult.data.forEach((asset: any) => {
            const status = asset.status || 'not started';
            statusCounts[status] = (statusCounts[status] || 0) + 1;
          });
          console.log('📊 Asset status breakdown:', statusCounts);

          // Log first few asset names
          console.log('📄 Sample assets:', assetsResult.data.slice(0, 5).map((a: any) => ({
            name: a.name,
            status: a.status,
            id: a.id.substring(0, 8)
          })));
        }

        // Filter and map only report assets (those with file_url starting with "report:")
        const reportAssets = assetsResult.data.filter((asset: any) =>
          asset.file_url && asset.file_url.startsWith('report:') && asset.status !== 'draft'
        );

        console.log(`📋 Filtered to ${reportAssets.length} report assets (from ${assetsResult.data.length} total assets)`);

        const mappedReports: LinkedReport[] = reportAssets.map((asset: any) => {
          // Extract report ID from file_url: "report:/jobs/{jobId}/{slug}/{reportId}"
          let reportId = asset.id; // Default to asset ID
          if (asset.file_url) {
            const urlParts = asset.file_url.split('/');
            reportId = urlParts[urlParts.length - 1] || asset.id;
          }

          return {
            id: reportId, // Use the extracted report ID
            title: asset.name,
            report_type: 'asset',
            status: asset.status || 'not started',
            created_at: asset.created_at,
            updated_at: asset.created_at,
            file_url: asset.file_url,
            approved_at: asset.approved_at,
            sent_at: asset.sent_at,
          };
        });

        console.log('📄 Mapped reports with IDs:', mappedReports.slice(0, 3).map(r => ({ title: r.title.substring(0, 30), id: r.id.substring(0, 8) })));

        setReports(mappedReports);
      } else {
        console.error('❌ Failed to load assets:', assetsResult.error);
        setReports([]);
      }
    } catch (error) {
      console.error('Failed to load job details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddReport = async (template: ReportTemplate) => {
    console.log('Creating new report from template:', template);
    setShowTemplateMenu(false);

    try {
      // Create a new blank report with the template structure
      const newReportId = crypto.randomUUID();

      // Use the template system to get proper report structure
      const { getReportTemplate } = await import('../data/reportTemplates');
      const initialData = getReportTemplate(template.route, job);

      const reportPayload = {
        id: newReportId,
        job_id: jobId,
        title: template.name,
        report_type: template.route,
        status: 'draft',
        report_data: JSON.stringify(initialData),
        submitted_by: null,
        submitted_at: null,
        reviewed_by: null,
        reviewed_at: null,
        revision_history: '[]',
        current_version: 1,
        review_comments: null,
        approved_at: null,
        issued_at: null,
        sent_at: null,
        is_dirty: 1,
        last_sync_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      console.log('💾 Creating new report in database...');
      const result = await window.electronAPI.dbQuery('technical_reports', 'upsertReport', reportPayload);

      if (result.success) {
        console.log('✅ Report created successfully!');

        // ALSO create an asset record so it shows up in the list (which reads from assets table)
        const assetId = crypto.randomUUID();
        const assetPayload = {
          id: assetId,
          name: template.name,
          file_url: `report:/jobs/${jobId}/${template.route}/${newReportId}`,
          status: 'not started',
          approved_at: null,
          sent_at: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_dirty: 1
        };

        console.log('💾 Creating asset record...');
        await window.electronAPI.dbQuery('assets', 'upsertAsset', assetPayload);

        // Link asset to job
        const jobAssetId = crypto.randomUUID();
        const jobAssetPayload = {
          id: jobAssetId,
          job_id: jobId,
          asset_id: assetId,
          user_id: null,
          created_at: new Date().toISOString(),
          is_dirty: 1
        };

        console.log('🔗 Linking asset to job...');
        await window.electronAPI.dbQuery('job_assets', 'upsertJobAsset', jobAssetPayload);

        // Refresh the reports list
        await loadJobAndReports();
        // Navigate to the new report for editing
        navigate(`/jobs/${jobId}/reports/${newReportId}`);
      } else {
        console.error('❌ Failed to create report:', result.error);
        alert(`Failed to create report: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('❌ Error creating report:', error);
      alert(`Error creating report: ${error}`);
    }
  };

  const handleOpenReport = (report: LinkedReport) => {
    console.log('Opening report:', report);
    navigate(`/jobs/${jobId}/reports/${report.id}`);
  };

  const filteredTemplates = REPORT_TEMPLATES.filter(template =>
    template.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const atsTemplates = filteredTemplates.filter(t => t.template_type === 'ATS');
  const mtsTemplates = filteredTemplates.filter(t => t.template_type === 'MTS');

  if (loading) {
    return (
      <div className="job-detail-container">
        <div className="loading">Loading job details...</div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="job-detail-container">
        <div className="error">Job not found</div>
        <button onClick={() => navigate('/')} className="btn-secondary">
          Back to Jobs
        </button>
      </div>
    );
  }

  return (
    <div className="job-detail-container">
      {/* Header */}
      <div className="job-detail-header">
        <button onClick={() => navigate('/')} className="back-button">
          ← Back to Jobs
        </button>
        <div className="job-header-info">
          <h1>{job.title}</h1>
          <span className="job-number">#{job.job_number}</span>
        </div>
      </div>

      {/* Job Info Card */}
      <div className="job-info-card">
        <div className="info-row">
          <span className="info-label">Customer:</span>
          <span className="info-value">{job.customer_name || job.customer_company || 'N/A'}</span>
        </div>
        <div className="info-row">
          <span className="info-label">Location:</span>
          <span className="info-value">{job.location || 'N/A'}</span>
        </div>
        <div className="info-row">
          <span className="info-label">Status:</span>
          <span className={`status-badge status-${job.status}`}>{job.status}</span>
        </div>
        {job.due_date && (
          <div className="info-row">
            <span className="info-label">Due Date:</span>
            <span className="info-value">{new Date(job.due_date).toLocaleDateString()}</span>
          </div>
        )}
        {job.description && (
          <div className="info-row">
            <span className="info-label">Description:</span>
            <span className="info-value">{job.description}</span>
          </div>
        )}
      </div>

      {/* Linked Reports Section */}
      <div className="linked-reports-section">
        <div className="section-header">
          <h2>Linked Reports ({reports.length})</h2>
          <button
            className="add-asset-button"
            onClick={() => setShowTemplateMenu(!showTemplateMenu)}
          >
            + Add Asset
          </button>
        </div>

        {/* Add Asset Template Menu */}
        {showTemplateMenu && (
          <div className="template-menu">
            <div className="template-menu-header">
              <input
                type="text"
                placeholder="Search reports..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="template-search"
              />
              <button
                onClick={() => setShowTemplateMenu(false)}
                className="close-menu-button"
              >
                ✕
              </button>
            </div>

            <div className="template-sections">
              {/* ATS Section */}
              {atsTemplates.length > 0 && (
                <div className="template-category">
                  <h3 className="category-title">ATS Templates ({atsTemplates.length})</h3>
                  <div className="template-list">
                    {atsTemplates.map(template => (
                      <button
                        key={template.id}
                        onClick={() => handleAddReport(template)}
                        className="template-item"
                      >
                        <span className="template-badge ats">ATS</span>
                        {template.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* MTS Section */}
              {mtsTemplates.length > 0 && (
                <div className="template-category">
                  <h3 className="category-title">MTS Templates ({mtsTemplates.length})</h3>
                  <div className="template-list">
                    {mtsTemplates.map(template => (
                      <button
                        key={template.id}
                        onClick={() => handleAddReport(template)}
                        className="template-item"
                      >
                        <span className="template-badge mts">MTS</span>
                        {template.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {filteredTemplates.length === 0 && (
                <div className="no-results">No templates found matching "{searchQuery}"</div>
              )}
            </div>
          </div>
        )}

        {/* Reports List */}
        {reports.length === 0 ? (
          <div className="empty-reports">
            <p>No reports linked to this job yet</p>
            <p className="hint">Click "Add Asset" to create a new report</p>
          </div>
        ) : (
          <div className="reports-list">
            {reports.map(report => (
              <div key={report.id} className="report-card" onClick={() => handleOpenReport(report)}>
                <div className="report-card-header">
                  <h3>{report.title}</h3>
                  <span className={`report-status status-${report.status?.replace(/ /g, '_')}`}>
                    {report.status?.replace(/_/g, ' ')}
                  </span>
                </div>
                <div className="report-card-body">
                  <div className="report-meta">
                    <span className="report-type">{report.report_type}</span>
                    <span className="report-date">
                      Updated: {new Date(report.updated_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

