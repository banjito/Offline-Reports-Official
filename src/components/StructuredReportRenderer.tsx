import { SmartFormField } from './SmartFormField';
import { ReactNode } from 'react';
import './StructuredReportRenderer.css';

interface StructuredReportRendererProps {
  data: any;
  isEditMode: boolean;
  onFieldChange: (path: string, value: any) => void;
}

export function StructuredReportRenderer({ data, isEditMode, onFieldChange }: StructuredReportRendererProps) {
  // Group fields into logical sections
  const sections = groupDataIntoSections(data);
  
  return (
    <div className="structured-report">
      {sections.map((section, idx) => (
        <div key={idx} className="report-section">
          <h2 className="section-title">{section.title}</h2>
          <div className="section-content">
            {section.type === 'fields' && renderFields(section.data, section.basePath, isEditMode, onFieldChange)}
            {section.type === 'table' && renderTable(section.data, section.basePath, section.title, isEditMode, onFieldChange)}
            {section.type === 'nested' && renderNestedSection(section.data, section.basePath, isEditMode, onFieldChange)}
          </div>
        </div>
      ))}
    </div>
  );
}

// Section grouping logic
function groupDataIntoSections(data: any): Array<{title: string, type: string, data: any, basePath: string}> {
  const sections: Array<{title: string, type: string, data: any, basePath: string}> = [];
  
  // Common section names to look for
  const sectionPatterns = {
    'jobInfo': { title: 'Job Information', priority: 1 },
    'reportInfo': { title: 'Report Information', priority: 1 },
    'report_info': { title: 'Report Information', priority: 1 },
    'jobNumber': { title: 'Job Information', priority: 1 },
    'customer': { title: 'Job Information', priority: 1 },
    'date': { title: 'Job Information', priority: 1 },
    
    'temperature': { title: 'Environmental Conditions', priority: 2 },
    'environmental': { title: 'Environmental Conditions', priority: 2 },
    
    'nameplate': { title: 'Nameplate Data', priority: 3 },
    'nameplateData': { title: 'Nameplate Data', priority: 3 },
    'manufacturer': { title: 'Nameplate Data', priority: 3 },
    
    'visualInspection': { title: 'Visual & Mechanical Inspection', priority: 4 },
    'visualInspectionItems': { title: 'Visual & Mechanical Inspection', priority: 4 },
    
    'insulationResistance': { title: 'Insulation Resistance Tests', priority: 5 },
    'tests': { title: 'Tests', priority: 5 },
    'contactResistance': { title: 'Contact Resistance Tests', priority: 5 },
    'electricalTests': { title: 'Electrical Tests', priority: 5 },
    
    'temperatureCorrected': { title: 'Temperature Corrected Tests', priority: 6 },
    'correctedTests': { title: 'Corrected Tests', priority: 6 },
    
    'testEquipment': { title: 'Test Equipment', priority: 7 },
    'fuseData': { title: 'Fuse Data', priority: 8 },
    'comments': { title: 'Comments', priority: 9 },
  };
  
  // Extract job info fields first
  const jobInfoFields: any = {};
  const jobInfoKeys = ['customer', 'customerName', 'address', 'date', 'jobNumber', 'technicians', 'user', 'userName'];
  
  jobInfoKeys.forEach(key => {
    if (data[key] !== undefined) {
      jobInfoFields[key] = data[key];
    }
  });
  
  if (Object.keys(jobInfoFields).length > 0) {
    sections.push({
      title: 'Job Information',
      type: 'fields',
      data: jobInfoFields,
      basePath: ''
    });
  }
  
  // Process remaining data
  Object.entries(data).forEach(([key, value]) => {
    // Skip if already in job info
    if (jobInfoKeys.includes(key)) return;
    
    // Determine section
    const pattern = Object.entries(sectionPatterns).find(([pattern]) => 
      key.toLowerCase().includes(pattern.toLowerCase())
    );
    
    if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object') {
      // Render as table
      sections.push({
        title: pattern ? pattern[1].title : formatKey(key),
        type: 'table',
        data: value,
        basePath: key
      });
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      // Check if it's a temperature object with TCF
      if (key.toLowerCase().includes('temperature') && 'tcf' in value) {
        sections.push({
          title: 'Environmental Conditions',
          type: 'fields',
          data: value,
          basePath: key
        });
      } else if (key.toLowerCase().includes('nameplate')) {
        sections.push({
          title: 'Nameplate Data',
          type: 'fields',
          data: value,
          basePath: key
        });
      } else {
        sections.push({
          title: pattern ? pattern[1].title : formatKey(key),
          type: 'nested',
          data: value,
          basePath: key
        });
      }
    } else {
      // Simple field - add to miscellaneous
      const miscIdx = sections.findIndex(s => s.title === 'Additional Information');
      if (miscIdx >= 0) {
        sections[miscIdx].data[key] = value;
      } else {
        sections.push({
          title: 'Additional Information',
          type: 'fields',
          data: { [key]: value },
          basePath: ''
        });
      }
    }
  });
  
  return sections;
}

// Render simple fields
function renderFields(fields: any, basePath: string, isEditMode: boolean, onFieldChange: (path: string, value: any) => void) {
  return (
    <div className="fields-grid">
      {Object.entries(fields).map(([key, value]) => {
        const fullPath = basePath ? `${basePath}.${key}` : key;
        
        // Special handling for temperature with TCF
        if (key === 'tcf') {
          return (
            <div key={key} className="field-row">
              <label className="field-label">Temperature Correction Factor (TCF):</label>
              <span className="field-value tcf-value">{String(value)}</span>
            </div>
          );
        }
        
        return (
          <SmartFormField
            key={key}
            fieldKey={key}
            value={value}
            onChange={(newValue) => onFieldChange(fullPath, newValue)}
            isEditMode={isEditMode}
          />
        );
      })}
    </div>
  );
}

// Render data as HTML table
function renderTable(rows: any[], basePath: string, _title: string, isEditMode: boolean, onFieldChange: (path: string, value: any) => void) {
  if (!rows || rows.length === 0) {
    if (!isEditMode) return <div className="empty-table">No data</div>;
    
    // In edit mode, show button to add first row
    return (
      <div className="empty-table">
        <p>No rows yet</p>
        <button 
          onClick={() => handleAddRow(basePath, onFieldChange)} 
          className="btn-add-row"
        >
          + Add Row
        </button>
      </div>
    );
  }
  
  // Get column headers from first row
  const firstRow = rows[0];
  const columns = typeof firstRow === 'object' ? Object.keys(firstRow) : [];
  
  if (columns.length === 0) return null;
  
  return (
    <div className="table-container">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map(col => (
              <th key={col}>{formatKey(col)}</th>
            ))}
            {isEditMode && <th className="actions-column">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIdx) => (
            <tr key={rowIdx}>
              {columns.map(col => {
                const cellPath = `${basePath}[${rowIdx}].${col}`;
                const cellValue = row[col];
                
                // Handle nested objects in cells
                if (typeof cellValue === 'object' && cellValue !== null && !Array.isArray(cellValue)) {
                  return (
                    <td key={col} className="nested-cell">
                      {Object.entries(cellValue).map(([subKey, subValue]): ReactNode => (
                        <div key={subKey} className="nested-field">
                          <SmartFormField
                            fieldKey={subKey}
                            value={subValue}
                            onChange={(newValue) => onFieldChange(`${cellPath}.${subKey}`, newValue)}
                            isEditMode={isEditMode}
                          />
                        </div>
                      ))}
                    </td>
                  );
                }
                
                return (
                  <td key={col}>
                    <SmartFormField
                      fieldKey={col}
                      value={cellValue}
                      onChange={(newValue) => onFieldChange(cellPath, newValue)}
                      isEditMode={isEditMode}
                    />
                  </td>
                );
              })}
              {isEditMode && (
                <td className="actions-cell">
                  <button
                    onClick={() => handleRemoveRow(basePath, rowIdx, onFieldChange)}
                    className="btn-remove-row"
                    title="Remove row"
                  >
                    ✕
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      {isEditMode && (
        <button 
          onClick={() => handleAddRow(basePath, onFieldChange, firstRow)} 
          className="btn-add-row"
        >
          + Add Row
        </button>
      )}
    </div>
  );
}

// Helper functions for row management
function handleAddRow(basePath: string, onFieldChange: (path: string, value: any) => void, templateRow?: any) {
  // Create a new empty row based on template
  const newRow: any = {};
  
  if (templateRow) {
    Object.keys(templateRow).forEach(key => {
      const value = templateRow[key];
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        // Copy structure for nested objects
        newRow[key] = Object.keys(value).reduce((obj, k) => ({ ...obj, [k]: '' }), {});
      } else {
        newRow[key] = '';
      }
    });
  } else {
    // Generic row for empty tables
    newRow.value = '';
  }
  
  // Trigger adding to the array
  onFieldChange(`${basePath}._ADD_ROW_`, newRow);
}

function handleRemoveRow(basePath: string, rowIndex: number, onFieldChange: (path: string, value: any) => void) {
  // Trigger removal from the array
  onFieldChange(`${basePath}._REMOVE_ROW_${rowIndex}_`, null);
}

// Render nested sections
function renderNestedSection(nestedData: any, basePath: string, isEditMode: boolean, onFieldChange: (path: string, value: any) => void) {
  return (
    <div className="nested-section">
      {Object.entries(nestedData).map(([key, value]) => {
        const fullPath = `${basePath}.${key}`;
        
        if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object') {
          return (
            <div key={key} className="nested-table">
              <h3 className="subsection-title">{formatKey(key)}</h3>
              {renderTable(value, fullPath, formatKey(key), isEditMode, onFieldChange)}
            </div>
          );
        } else if (typeof value === 'object' && value !== null) {
          return (
            <div key={key} className="nested-fields">
              <h3 className="subsection-title">{formatKey(key)}</h3>
              {renderFields(value, fullPath, isEditMode, onFieldChange)}
            </div>
          );
        } else {
          return (
            <SmartFormField
              key={key}
              fieldKey={key}
              value={value}
              onChange={(newValue) => onFieldChange(fullPath, newValue)}
              isEditMode={isEditMode}
            />
          );
        }
      })}
    </div>
  );
}

function formatKey(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim();
}

