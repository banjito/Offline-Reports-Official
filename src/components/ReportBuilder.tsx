import { useState } from 'react';
import { Report, ReportTemplate } from '../types';
import './ReportBuilder.css';

interface ReportBuilderProps {
  jobId: string;
  onClose: () => void;
  onSave: (report: Report) => void;
}

export function ReportBuilder({ jobId, onClose, onSave }: ReportBuilderProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null);
  const [reportData, setReportData] = useState<Record<string, any>>({});
  const [title, setTitle] = useState('');

  const handleSave = () => {
    if (!selectedTemplate || !title) {
      alert('Please select a template and enter a title');
      return;
    }

    const report: Report = {
      id: crypto.randomUUID(),
      job_id: jobId,
      title,
      report_type: selectedTemplate.report_type,
      status: 'draft',
      report_data: reportData,
      current_version: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    onSave(report);
  };

  return (
    <div className="report-builder">
      <div className="report-builder-header">
        <h2>Create Report</h2>
        <button className="close-btn" onClick={onClose}>×</button>
      </div>

      <div className="report-builder-body">
        <div className="form-group">
          <label htmlFor="report-title">Report Title</label>
          <input
            id="report-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter report title"
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label htmlFor="report-template">Template</label>
          <select
            id="report-template"
            className="form-select"
            onChange={(e) => {
              // In a real app, fetch template details
              setSelectedTemplate({
                id: e.target.value,
                name: e.target.options[e.target.selectedIndex].text,
                report_type: e.target.value,
                template_schema: {},
                version: 1,
                is_active: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              });
            }}
          >
            <option value="">Select a template</option>
            <option value="inspection">Inspection Report</option>
            <option value="testing">Testing Report</option>
            <option value="maintenance">Maintenance Report</option>
            <option value="incident">Incident Report</option>
          </select>
        </div>

        {selectedTemplate && (
          <div className="report-fields">
            <h3>Report Details</h3>
            <p className="info-text">
              Template-specific fields would appear here based on the selected template schema.
            </p>
            
            {/* Placeholder for dynamic form fields */}
            <div className="form-group">
              <label htmlFor="report-notes">Notes</label>
              <textarea
                id="report-notes"
                className="form-textarea"
                rows={5}
                value={reportData.notes || ''}
                onChange={(e) => setReportData({ ...reportData, notes: e.target.value })}
                placeholder="Enter report notes..."
              />
            </div>
          </div>
        )}
      </div>

      <div className="report-builder-footer">
        <button className="btn-secondary" onClick={onClose}>Cancel</button>
        <button className="btn-primary" onClick={handleSave}>Save Draft</button>
      </div>
    </div>
  );
}

