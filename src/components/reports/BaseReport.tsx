/**
 * Base Report Component System
 * 
 * This provides shared functionality for all report types:
 * - TCF calculations
 * - Common form handling
 * - Shared UI components
 */

import { useState, useEffect } from 'react';
import './ReportStyles.css';

// ============================================================================
// TCF TABLE - Used by all reports for temperature correction
// ============================================================================
export const tcfTable: { [key: string]: number } = {
  '-24': 0.054, '-23': 0.068, '-22': 0.082, '-21': 0.096, '-20': 0.11,
  '-19': 0.124, '-18': 0.138, '-17': 0.152, '-16': 0.166, '-15': 0.18,
  '-14': 0.194, '-13': 0.208, '-12': 0.222, '-11': 0.236, '-10': 0.25,
  '-9': 0.264, '-8': 0.278, '-7': 0.292, '-6': 0.306, '-5': 0.32,
  '-4': 0.336, '-3': 0.352, '-2': 0.368, '-1': 0.384, '0': 0.4,
  '1': 0.42, '2': 0.44, '3': 0.46, '4': 0.48, '5': 0.5,
  '6': 0.526, '7': 0.552, '8': 0.578, '9': 0.604, '10': 0.63,
  '11': 0.666, '12': 0.702, '13': 0.738, '14': 0.774, '15': 0.81,
  '16': 0.848, '17': 0.886, '18': 0.924, '19': 0.962, '20': 1,
  '21': 1.05, '22': 1.1, '23': 1.15, '24': 1.2, '25': 1.25,
  '26': 1.316, '27': 1.382, '28': 1.448, '29': 1.514, '30': 1.58,
  '31': 1.664, '32': 1.748, '33': 1.832, '34': 1.872, '35': 2,
  '36': 2.1, '37': 2.2, '38': 2.3, '39': 2.4, '40': 2.5,
  '41': 2.628, '42': 2.756, '43': 2.884, '44': 3.012, '45': 3.15,
  '46': 3.316, '47': 3.482, '48': 3.648, '49': 3.814, '50': 3.98,
  '51': 4.184, '52': 4.388, '53': 4.592, '54': 4.796, '55': 5,
  '56': 5.26, '57': 5.52, '58': 5.78, '59': 6.04, '60': 6.3,
  '61': 6.62, '62': 6.94, '63': 7.26, '64': 7.58, '65': 7.9,
  '66': 8.32, '67': 8.74, '68': 9.16, '69': 9.58, '70': 10,
  '71': 10.52, '72': 11.04, '73': 11.56, '74': 12.08, '75': 12.6,
  '76': 13.24, '77': 13.88, '78': 14.52, '79': 15.16, '80': 15.8,
  '81': 16.64, '82': 17.48, '83': 18.32, '84': 19.16, '85': 20,
  '86': 21.04, '87': 22.08, '88': 23.12, '89': 24.16, '90': 25.2,
  '91': 26.45, '92': 27.7, '93': 28.95, '94': 30.2, '95': 31.6,
  '96': 33.28, '97': 34.96, '98': 36.64, '99': 38.32, '100': 40,
  '101': 42.08, '102': 44.16, '103': 46.24, '104': 48.32, '105': 50.4,
  '106': 52.96, '107': 55.52, '108': 58.08, '109': 60.64, '110': 63.2
};

export const getTCF = (celsius: number): number => {
  const rounded = Math.round(celsius);
  const key = String(rounded);
  return tcfTable[key] !== undefined ? tcfTable[key] : 1;
};

export const fahrenheitToCelsius = (f: number): number => Math.round((f - 32) * 5 / 9);

// ============================================================================
// COMMON OPTIONS
// ============================================================================
export const VISUAL_INSPECTION_OPTIONS = [
  'Select One', 'Satisfactory', 'Unsatisfactory', 'Cleaned', 'Repaired',
  'Adjusted', 'See Comments', 'Not Applicable', 'N/A', 'Y', 'N', 'Yes', 'No'
];

export const TEST_VOLTAGE_OPTIONS = ['250V', '500V', '1000V', '2500V', '5000V', '10000V'];

export const IR_UNITS = [
  { symbol: 'kΩ', name: 'Kilo-Ohms' },
  { symbol: 'MΩ', name: 'Mega-Ohms' },
  { symbol: 'GΩ', name: 'Giga-Ohms' }
];

export const CONTACT_RESISTANCE_UNITS = [
  { symbol: 'µΩ', name: 'Micro-Ohms' },
  { symbol: 'mΩ', name: 'Milli-Ohms' },
  { symbol: 'Ω', name: 'Ohms' }
];

export const PHASE_CONFIGS = ['Delta', 'Wye', 'Single Phase'];
export const CONDUCTOR_MATERIALS = ['Aluminum', 'Copper'];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================
export const multiplyByTCF = (val: string, tcf: number): string => {
  const num = parseFloat(String(val).replace(/[^0-9.\-]/g, ''));
  if (Number.isNaN(num)) return val || '';
  return String(Math.round((num * tcf + Number.EPSILON) * 100) / 100);
};

export const calculateRatio = (num: string, denom: string): string => {
  const n = parseFloat(num);
  const d = parseFloat(denom);
  if (isNaN(n) || isNaN(d) || d === 0) return '';
  return (n / d).toFixed(2);
};

// ============================================================================
// SHARED UI COMPONENTS
// ============================================================================

interface SectionProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export function ReportSection({ title, subtitle, children }: SectionProps) {
  return (
    <section className="report-section">
      <div className="section-divider"></div>
      <h2 className="section-title">{title}</h2>
      {subtitle && <p className="section-subtitle">{subtitle}</p>}
      {children}
    </section>
  );
}

interface InputProps {
  value: string | number;
  onChange?: (val: string) => void;
  readOnly?: boolean;
  type?: 'text' | 'number' | 'date';
  placeholder?: string;
  className?: string;
  calculated?: boolean;
}

export function ReportInput({ value, onChange, readOnly = false, type = 'text', placeholder, className = '', calculated = false }: InputProps) {
  const baseClass = `report-input ${readOnly ? 'readonly' : ''} ${calculated ? 'calculated' : ''} ${className}`;
  return (
    <input
      type={type}
      value={value ?? ''}
      onChange={e => onChange?.(e.target.value)}
      readOnly={readOnly || calculated}
      placeholder={placeholder}
      className={baseClass}
    />
  );
}

interface SelectProps {
  value: string;
  options: string[] | { value: string; label: string }[];
  onChange?: (val: string) => void;
  disabled?: boolean;
  className?: string;
}

export function ReportSelect({ value, options, onChange, disabled = false, className = '' }: SelectProps) {
  return (
    <select
      value={value}
      onChange={e => onChange?.(e.target.value)}
      disabled={disabled}
      className={`report-input ${disabled ? 'readonly' : ''} ${className}`}
    >
      {options.map(opt => {
        const val = typeof opt === 'string' ? opt : opt.value;
        const label = typeof opt === 'string' ? opt : opt.label;
        return <option key={val} value={val}>{label}</option>;
      })}
    </select>
  );
}

// ============================================================================
// JOB INFO SECTION - Used by most reports
// ============================================================================
interface JobInfoData {
  customer?: string;
  jobNumber?: string;
  technicians?: string;
  date?: string;
  identifier?: string;
  substation?: string;
  eqptLocation?: string;
  user?: string;
  temperature?: {
    fahrenheit: number;
    celsius: number;
    tcf: number;
    humidity?: number | string;
  };
}

interface JobInfoSectionProps {
  data: JobInfoData;
  onChange: (field: string, value: any) => void;
  isEditing: boolean;
}

export function JobInfoSection({ data, onChange, isEditing }: JobInfoSectionProps) {
  return (
    <ReportSection title="Job Information">
      <div className="form-grid-6">
        <div className="form-field">
          <label>Customer:</label>
          <ReportInput value={data.customer || ''} onChange={v => onChange('customer', v)} readOnly={!isEditing} />
        </div>
        <div className="form-field">
          <label>Job #:</label>
          <ReportInput value={data.jobNumber || ''} onChange={v => onChange('jobNumber', v)} readOnly={!isEditing} />
        </div>
        <div className="form-field">
          <label>Technicians:</label>
          <ReportInput value={data.technicians || ''} onChange={v => onChange('technicians', v)} readOnly={!isEditing} />
        </div>
        <div className="form-field">
          <label>Date:</label>
          <ReportInput type="date" value={data.date || ''} onChange={v => onChange('date', v)} readOnly={!isEditing} />
        </div>
        <div className="form-field">
          <label>Identifier:</label>
          <ReportInput value={data.identifier || ''} onChange={v => onChange('identifier', v)} readOnly={!isEditing} />
        </div>
        <div className="form-field temp-field">
          <label>Temp:</label>
          <div className="temp-inputs">
            <ReportInput
              type="number"
              value={data.temperature?.fahrenheit ?? 68}
              onChange={v => onChange('temperature.fahrenheit', Number(v))}
              readOnly={!isEditing}
              className="temp-input"
            />
            <span>°F</span>
            <span className="temp-celsius">{data.temperature?.celsius ?? 20}</span>
            <span>°C</span>
            <span className="temp-label">TCF</span>
            <span className="temp-value">{(data.temperature?.tcf ?? 1).toFixed(3)}</span>
          </div>
        </div>
        <div className="form-field">
          <label>Humidity:</label>
          <div className="humidity-input">
            <ReportInput value={data.temperature?.humidity ?? ''} onChange={v => onChange('temperature.humidity', v)} readOnly={!isEditing} className="humidity-field" />
            <span>%</span>
          </div>
        </div>
        <div className="form-field">
          <label>Substation:</label>
          <ReportInput value={data.substation || ''} onChange={v => onChange('substation', v)} readOnly={!isEditing} />
        </div>
        <div className="form-field">
          <label>Eqpt. Location:</label>
          <ReportInput value={data.eqptLocation || ''} onChange={v => onChange('eqptLocation', v)} readOnly={!isEditing} />
        </div>
        <div className="form-field col-span-2">
          <label>User:</label>
          <ReportInput value={data.user || ''} onChange={v => onChange('user', v)} readOnly={!isEditing} />
        </div>
      </div>
    </ReportSection>
  );
}

// ============================================================================
// NAMEPLATE SECTION - Used by transformer, switchgear, panelboard reports
// ============================================================================
interface NameplateData {
  manufacturer?: string;
  catalogNumber?: string;
  serialNumber?: string;
  type?: string;
  systemVoltage?: string;
  ratedVoltage?: string;
  ratedCurrent?: string;
  phaseConfiguration?: string;
  kva?: string;
  tempRise?: string;
  impedance?: string;
}

interface NameplateSectionProps {
  data: NameplateData;
  onChange: (field: string, value: any) => void;
  isEditing: boolean;
  showKva?: boolean;
  showImpedance?: boolean;
}

export function NameplateSection({ data, onChange, isEditing, showKva = false, showImpedance = false }: NameplateSectionProps) {
  return (
    <ReportSection title="Nameplate Data">
      <div className="enclosure-grid">
        <div className="enclosure-row">
          <div className="enclosure-cell">
            <strong>Manufacturer:</strong>
            <ReportInput value={data.manufacturer || ''} onChange={v => onChange('manufacturer', v)} readOnly={!isEditing} />
          </div>
          <div className="enclosure-cell">
            <strong>Catalog Number:</strong>
            <ReportInput value={data.catalogNumber || ''} onChange={v => onChange('catalogNumber', v)} readOnly={!isEditing} />
          </div>
          <div className="enclosure-cell">
            <strong>Serial Number:</strong>
            <ReportInput value={data.serialNumber || ''} onChange={v => onChange('serialNumber', v)} readOnly={!isEditing} />
          </div>
          <div className="enclosure-cell">
            <strong>Type:</strong>
            <ReportInput value={data.type || ''} onChange={v => onChange('type', v)} readOnly={!isEditing} />
          </div>
        </div>
        <div className="enclosure-row">
          <div className="enclosure-cell">
            <strong>System Voltage:</strong>
            <ReportInput value={data.systemVoltage || ''} onChange={v => onChange('systemVoltage', v)} readOnly={!isEditing} />
          </div>
          <div className="enclosure-cell">
            <strong>Rated Voltage:</strong>
            <ReportInput value={data.ratedVoltage || ''} onChange={v => onChange('ratedVoltage', v)} readOnly={!isEditing} />
          </div>
          <div className="enclosure-cell">
            <strong>Rated Current:</strong>
            <ReportInput value={data.ratedCurrent || ''} onChange={v => onChange('ratedCurrent', v)} readOnly={!isEditing} />
          </div>
          <div className="enclosure-cell">
            <strong>Phase Config:</strong>
            <ReportSelect
              value={data.phaseConfiguration || ''}
              options={['', ...PHASE_CONFIGS]}
              onChange={v => onChange('phaseConfiguration', v)}
              disabled={!isEditing}
            />
          </div>
        </div>
        {(showKva || showImpedance) && (
          <div className="enclosure-row">
            {showKva && (
              <div className="enclosure-cell">
                <strong>KVA:</strong>
                <ReportInput value={data.kva || ''} onChange={v => onChange('kva', v)} readOnly={!isEditing} />
              </div>
            )}
            {showImpedance && (
              <>
                <div className="enclosure-cell">
                  <strong>Temp Rise:</strong>
                  <ReportInput value={data.tempRise || ''} onChange={v => onChange('tempRise', v)} readOnly={!isEditing} />
                </div>
                <div className="enclosure-cell">
                  <strong>Impedance %:</strong>
                  <ReportInput value={data.impedance || ''} onChange={v => onChange('impedance', v)} readOnly={!isEditing} />
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </ReportSection>
  );
}

// ============================================================================
// VISUAL INSPECTION SECTION
// ============================================================================
interface VisualInspectionItem {
  id: string;
  description: string;
  result: string;
  comments?: string;
}

interface VisualInspectionSectionProps {
  items: VisualInspectionItem[];
  onChange: (items: VisualInspectionItem[]) => void;
  isEditing: boolean;
  netaSection?: string;
}

export function VisualInspectionSection({ items, onChange, isEditing, netaSection }: VisualInspectionSectionProps) {
  // Ensure items is always an array
  const safeItems = Array.isArray(items) ? items : [];
  
  const updateItem = (index: number, field: keyof VisualInspectionItem, value: string) => {
    const newItems = [...safeItems];
    newItems[index] = { ...newItems[index], [field]: value };
    onChange(newItems);
  };

  if (safeItems.length === 0) {
    return (
      <ReportSection title="Visual and Mechanical Inspection" subtitle={netaSection ? `Per NETA ATS Section ${netaSection}` : undefined}>
        <p className="text-gray-500">No visual inspection items available.</p>
      </ReportSection>
    );
  }

  return (
    <ReportSection title="Visual and Mechanical Inspection" subtitle={netaSection ? `Per NETA ATS Section ${netaSection}` : undefined}>
      <div className="table-container">
        <table className="report-table">
          <thead>
            <tr>
              <th style={{ width: '5%' }}>#</th>
              <th style={{ width: '45%' }}>Description</th>
              <th style={{ width: '20%' }}>Result</th>
              <th style={{ width: '30%' }}>Comments</th>
            </tr>
          </thead>
          <tbody>
            {safeItems.map((item, idx) => (
              <tr key={item.id || idx}>
                <td>{item.id || idx + 1}</td>
                <td>{item.description}</td>
                <td>
                  <ReportSelect
                    value={item.result}
                    options={VISUAL_INSPECTION_OPTIONS}
                    onChange={v => updateItem(idx, 'result', v)}
                    disabled={!isEditing}
                  />
                </td>
                <td>
                  <ReportInput
                    value={item.comments || ''}
                    onChange={v => updateItem(idx, 'comments', v)}
                    readOnly={!isEditing}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ReportSection>
  );
}

// ============================================================================
// TEST EQUIPMENT SECTION
// ============================================================================
interface TestEquipmentItem {
  name: string;
  serialNumber: string;
  ampId: string;
}

interface TestEquipmentSectionProps {
  equipment: {
    megohmmeter?: TestEquipmentItem;
    lowResistance?: TestEquipmentItem;
    hipot?: TestEquipmentItem;
    [key: string]: TestEquipmentItem | undefined;
  };
  onChange: (equipment: any) => void;
  isEditing: boolean;
  showLowResistance?: boolean;
  showHipot?: boolean;
}

export function TestEquipmentSection({ equipment, onChange, isEditing, showLowResistance = true, showHipot = false }: TestEquipmentSectionProps) {
  const updateEquipment = (type: string, field: string, value: string) => {
    onChange({
      ...equipment,
      [type]: { ...equipment[type], [field]: value }
    });
  };

  return (
    <ReportSection title="Test Equipment Used">
      <div className="equipment-grid">
        <div className="equipment-row">
          <label>Megohmeter:</label>
          <ReportInput value={equipment.megohmmeter?.name || ''} onChange={v => updateEquipment('megohmmeter', 'name', v)} readOnly={!isEditing} />
          <label>Serial #:</label>
          <ReportInput value={equipment.megohmmeter?.serialNumber || ''} onChange={v => updateEquipment('megohmmeter', 'serialNumber', v)} readOnly={!isEditing} />
          <label>AMP ID:</label>
          <ReportInput value={equipment.megohmmeter?.ampId || ''} onChange={v => updateEquipment('megohmmeter', 'ampId', v)} readOnly={!isEditing} />
        </div>
        {showLowResistance && (
          <div className="equipment-row">
            <label>Low Resistance:</label>
            <ReportInput value={equipment.lowResistance?.name || ''} onChange={v => updateEquipment('lowResistance', 'name', v)} readOnly={!isEditing} />
            <label>Serial #:</label>
            <ReportInput value={equipment.lowResistance?.serialNumber || ''} onChange={v => updateEquipment('lowResistance', 'serialNumber', v)} readOnly={!isEditing} />
            <label>AMP ID:</label>
            <ReportInput value={equipment.lowResistance?.ampId || ''} onChange={v => updateEquipment('lowResistance', 'ampId', v)} readOnly={!isEditing} />
          </div>
        )}
        {showHipot && (
          <div className="equipment-row">
            <label>Hi-Pot:</label>
            <ReportInput value={equipment.hipot?.name || ''} onChange={v => updateEquipment('hipot', 'name', v)} readOnly={!isEditing} />
            <label>Serial #:</label>
            <ReportInput value={equipment.hipot?.serialNumber || ''} onChange={v => updateEquipment('hipot', 'serialNumber', v)} readOnly={!isEditing} />
            <label>AMP ID:</label>
            <ReportInput value={equipment.hipot?.ampId || ''} onChange={v => updateEquipment('hipot', 'ampId', v)} readOnly={!isEditing} />
          </div>
        )}
      </div>
    </ReportSection>
  );
}

// ============================================================================
// COMMENTS SECTION
// ============================================================================
interface CommentsSectionProps {
  comments: string;
  onChange: (comments: string) => void;
  isEditing: boolean;
}

export function CommentsSection({ comments, onChange, isEditing }: CommentsSectionProps) {
  return (
    <ReportSection title="Comments">
      <textarea
        className={`report-textarea ${!isEditing ? 'readonly' : ''}`}
        value={comments}
        onChange={e => onChange(e.target.value)}
        readOnly={!isEditing}
        rows={4}
      />
    </ReportSection>
  );
}

// ============================================================================
// REPORT HEADER
// ============================================================================
interface ReportHeaderProps {
  title: string;
  status: 'PASS' | 'FAIL';
  onStatusChange: () => void;
  isEditing: boolean;
  onEdit: () => void;
  onSave: () => void;
}

export function ReportHeader({ title, status, onStatusChange, isEditing, onEdit, onSave }: ReportHeaderProps) {
  return (
    <div className="report-header-bar">
      <h1 className="report-title">{title}</h1>
      <div className="report-actions">
        <button
          onClick={onStatusChange}
          disabled={!isEditing}
          className={`status-btn ${status === 'PASS' ? 'pass' : 'fail'}`}
        >
          {status}
        </button>
        {!isEditing ? (
          <button onClick={onEdit} className="btn-primary">Edit Report</button>
        ) : (
          <button onClick={onSave} className="btn-save">Save Report</button>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// BASE REPORT HOOK - Shared state management
// ============================================================================
export function useReportState<T extends Record<string, any>>(initialData: T) {
  const [formData, setFormData] = useState<T>(initialData);
  const [isEditing, setIsEditing] = useState(false);

  const setField = (path: string, value: any) => {
    setFormData(prev => {
      const clone: any = { ...prev };
      const keys = path.split('.');
      let cur = clone;
      for (let i = 0; i < keys.length - 1; i++) {
        if (cur[keys[i]] === undefined) cur[keys[i]] = {};
        cur[keys[i]] = { ...cur[keys[i]] };
        cur = cur[keys[i]];
      }
      cur[keys[keys.length - 1]] = value;
      return clone;
    });
  };

  // Auto-update TCF when temperature changes
  useEffect(() => {
    if (formData.temperature?.fahrenheit !== undefined) {
      const celsius = fahrenheitToCelsius(formData.temperature.fahrenheit);
      const tcf = getTCF(celsius);
      if (celsius !== formData.temperature.celsius || tcf !== formData.temperature.tcf) {
        setFormData(prev => ({
          ...prev,
          temperature: { ...prev.temperature, celsius, tcf }
        }));
      }
    }
  }, [formData.temperature?.fahrenheit]);

  return {
    formData,
    setFormData,
    setField,
    isEditing,
    setIsEditing
  };
}

export default {
  tcfTable,
  getTCF,
  fahrenheitToCelsius,
  multiplyByTCF,
  calculateRatio,
  ReportSection,
  ReportInput,
  ReportSelect,
  JobInfoSection,
  NameplateSection,
  VisualInspectionSection,
  TestEquipmentSection,
  CommentsSection,
  ReportHeader,
  useReportState
};



