import { getDropdownOptionsForField, getUnitOptionsForField } from '../constants/reportOptions';
import './SmartFormField.css';

interface SmartFormFieldProps {
  fieldKey: string;
  value: any;
  onChange: (value: any) => void;
  isEditMode: boolean;
  fieldConfig?: any; // Optional field configuration from template schema
}

export function SmartFormField({ fieldKey, value, onChange, isEditMode, fieldConfig }: SmartFormFieldProps) {
  // Get dropdown options if available
  const dropdownOptions = getDropdownOptionsForField(fieldKey, fieldConfig);
  const unitOptions = getUnitOptionsForField(fieldKey, fieldConfig);

  // Render label
  const label = formatFieldLabel(fieldKey);

  if (!isEditMode) {
    // View mode - just display the value
    return (
      <div className="field-row">
        <label className="field-label">{label}:</label>
        <span className="field-value">{formatValue(value)}</span>
      </div>
    );
  }

  // Edit mode - render appropriate input type

  // Unit dropdown (MΩ, kΩ, etc.)
  if (unitOptions) {
    // Ensure value is a string (not object/array)
    const stringValue = typeof value === 'string' ? value : '';
    return (
      <div className="field-row">
        <label className="field-label">{label}:</label>
        <select
          value={stringValue || ''}
          onChange={(e) => onChange(e.target.value)}
          className="field-select unit-select"
        >
          <option value="">Select unit...</option>
          {unitOptions.map((opt) => (
            <option key={opt.symbol} value={opt.symbol}>
              {opt.symbol} - {opt.name}
            </option>
          ))}
        </select>
      </div>
    );
  }

  // Regular dropdown (Pass/Fail, Satisfactory/Unsatisfactory, etc.)
  if (dropdownOptions) {
    // Ensure value is a string (not object/array)
    const stringValue = typeof value === 'string' ? value : '';
    return (
      <div className="field-row">
        <label className="field-label">{label}:</label>
        <select
          value={stringValue || ''}
          onChange={(e) => onChange(e.target.value)}
          className="field-select"
        >
          {dropdownOptions.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>
    );
  }

  // Number field (if field name suggests numeric data)
  if (isNumericField(fieldKey, value)) {
    return (
      <div className="field-row">
        <label className="field-label">{label}:</label>
        <input
          type="text"
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          className="field-input number-input"
          placeholder={isEditMode ? "Enter value..." : ""}
          inputMode="decimal"
        />
      </div>
    );
  }

  // Date field
  if (isDateField(fieldKey)) {
    return (
      <div className="field-row">
        <label className="field-label">{label}:</label>
        <input
          type="date"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className="field-input date-input"
        />
      </div>
    );
  }

  // Textarea for long text fields
  if (isLongTextField(fieldKey)) {
    return (
      <div className="field-row">
        <label className="field-label">{label}:</label>
        <textarea
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className="field-textarea"
          rows={3}
        />
      </div>
    );
  }

  // Default: text input
  return (
    <div className="field-row">
      <label className="field-label">{label}:</label>
      <input
        type="text"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        className="field-input"
        placeholder={isEditMode ? "Enter value..." : ""}
      />
    </div>
  );
}

// Helper functions

function formatFieldLabel(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim();
}

function formatValue(value: any): string {
  if (value === null || value === undefined) {
    return '';
  }
  if (typeof value === 'object') {
    return JSON.stringify(value, null, 2);
  }
  return String(value);
}

function isNumericField(fieldKey: string, value: any): boolean {
  const lowerKey = fieldKey.toLowerCase();

  // Check if value is already a number
  if (typeof value === 'number') {
    return true;
  }

  // Check if field name suggests numeric data
  const numericKeywords = [
    'voltage', 'current', 'resistance', 'temperature', 'humidity',
    'tcf', 'value', 'reading', 'measurement', 'ohms', 'amps', 'volts',
    'celsius', 'fahrenheit', 'power', 'frequency', 'kv', 'mv',
    'ag', 'bg', 'cg', 'ab', 'bc', 'ca', 'an', 'bn', 'cn', // Common phase labels
  ];

  return numericKeywords.some(keyword => lowerKey.includes(keyword));
}

function isDateField(fieldKey: string): boolean {
  const lowerKey = fieldKey.toLowerCase();
  return lowerKey.includes('date') || lowerKey === 'submitted_at' || lowerKey === 'reviewed_at';
}

function isLongTextField(fieldKey: string): boolean {
  const lowerKey = fieldKey.toLowerCase();
  return lowerKey.includes('comment') ||
    lowerKey.includes('note') ||
    lowerKey.includes('description') ||
    lowerKey.includes('remarks');
}

