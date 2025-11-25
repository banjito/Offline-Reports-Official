/**
 * 13-Voltage Potential Transformer Test MTS Report
 * Desktop offline version - matches web app data structure with clean UI
 */

import { useState, useEffect } from 'react';
import { Job } from '../../types';
import {
  ReportSection,
  ReportHeader,
  IR_UNITS,
  VISUAL_INSPECTION_OPTIONS
} from './BaseReport';
import './ReportStyles.css';

interface Props {
  job: Job | null;
  reportData: any;
  onSave: (data: any) => void;
}

// Visual inspection items matching web app exactly
const INITIAL_VISUAL_INSPECTION_ITEMS = [
  { netaSection: '7.10.2.1', description: 'Inspect physical and mechanical condition.', result: 'Select One' },
  { netaSection: '7.10.2.3', description: 'Clean the unit.', result: 'Select One' },
  { netaSection: '7.10.2.4', description: 'Use of a low-resistance ohmmeter in accordance with Section 7.10.1.B.1.', result: 'Select One' },
  { netaSection: '7.10.2.5', description: 'Verify that all required grounding and connections provide contact.', result: 'Select One' },
  { netaSection: '7.10.2.6', description: 'Verify correct operation of transformer withdrawal mechanism and grounding operation.', result: 'Select One' },
  { netaSection: '7.10.2.7', description: 'Verify correct primary and secondary fuse sizes for voltage transformers.', result: 'Select One' },
  { netaSection: '7.10.2.8', description: 'Use appropriate lubrication on moving current-carrying parts and on moving and sliding surfaces.', result: 'Select One' },
];

const INITIAL_INSULATION_RESISTANCE_ITEMS = [
  { id: 'ir-primary-gnd', windingTested: 'Primary to Ground', testVoltage: 'Select One', results: '', units: 'MΩ', correctedResults: '' },
  { id: 'ir-secondary-gnd', windingTested: 'Secondary to Ground', testVoltage: 'Select One', results: '', units: 'MΩ', correctedResults: '' },
  { id: 'ir-primary-secondary', windingTested: 'Primary to Secondary', testVoltage: 'Select One', results: '', units: 'MΩ', correctedResults: '' },
];

const INITIAL_TURNS_RATIO_TEST = [
  { id: 'tr-0', tap: '', primaryVoltage: '', calculatedRatio: '', measuredH1H2: '', percentDeviation: '', passFail: '' }
];

const INSULATION_TEST_VOLTAGE_OPTIONS = ['Select One', '250V', '500V', '1000V', '2500V', '5000V'];
const FUSE_RESISTANCE_UNIT_OPTIONS = [
  { symbol: 'µΩ', name: 'Micro-Ohms' },
  { symbol: 'mΩ', name: 'Milli-Ohms' },
  { symbol: 'Ω', name: 'Ohms' }
];

// TCF lookup table
const tcfData: Array<{ celsius: number; multiplier: number }> = [
  { celsius: 20, multiplier: 1 },
  { celsius: 21, multiplier: 1.05 }, { celsius: 22, multiplier: 1.1 }, { celsius: 23, multiplier: 1.15 }, { celsius: 24, multiplier: 1.2 }, { celsius: 25, multiplier: 1.25 },
  { celsius: 26, multiplier: 1.316 }, { celsius: 27, multiplier: 1.382 }, { celsius: 28, multiplier: 1.448 }, { celsius: 29, multiplier: 1.514 }, { celsius: 30, multiplier: 1.58 },
  { celsius: 15, multiplier: 0.81 }, { celsius: 16, multiplier: 0.848 }, { celsius: 17, multiplier: 0.886 }, { celsius: 18, multiplier: 0.924 }, { celsius: 19, multiplier: 0.962 },
  { celsius: 10, multiplier: 0.63 }, { celsius: 11, multiplier: 0.666 }, { celsius: 12, multiplier: 0.702 }, { celsius: 13, multiplier: 0.738 }, { celsius: 14, multiplier: 0.774 },
];

const getTCF = (celsius: number): number => {
  const exactMatch = tcfData.find(data => data.celsius === celsius);
  if (exactMatch) return exactMatch.multiplier;
  
  const sortedTable = [...tcfData].sort((a, b) => a.celsius - b.celsius);
  let lowerBound: { celsius: number; multiplier: number } | null = null;
  let upperBound: { celsius: number; multiplier: number } | null = null;
  
  for (const entry of sortedTable) {
    if (entry.celsius < celsius) lowerBound = entry;
    else if (entry.celsius > celsius) { upperBound = entry; break; }
  }
  
  if (lowerBound && upperBound) {
    return lowerBound.multiplier + (celsius - lowerBound.celsius) * 
           (upperBound.multiplier - lowerBound.multiplier) / (upperBound.celsius - lowerBound.celsius);
  }
  return 1.0;
};

const calculateTempCorrectedReading = (reading: string, tcf: number): string => {
  const numericReading = parseFloat(reading);
  if (isNaN(numericReading) || !reading.trim()) return '';
  return (numericReading * tcf).toFixed(2);
};

const calculatePassFail = (deviation: number, revenueMetering: boolean): string => {
  if (isNaN(deviation)) return '';
  const tolerance = revenueMetering ? 0.501 : 1.201;
  return (deviation > -tolerance && deviation < tolerance) ? 'Pass' : 'Fail';
};

interface FormData {
  customerName: string;
  customerAddress: string;
  userName: string;
  date: string;
  identifier: string;
  jobNumber: string;
  technicians: string;
  temperature: { fahrenheit: number; celsius: number; tcf: number; humidity: number };
  substation: string;
  eqptLocation: string;
  deviceData: {
    manufacturer: string; catalogNumber: string; serialNumber: string; accuracyClass: string;
    manufacturedYear: string; voltageRating: string; insulationClass: string; frequency: string;
  };
  visualMechanicalInspection: Array<{ netaSection: string; description: string; result: string }>;
  fuseData: { manufacturer: string; catalogNumber: string; class: string; voltageRatingKv: string; ampacityA: string; icRatingKa: string };
  fuseResistanceTest: { asFound: string; asLeft: string; units: string };
  insulationResistance: Array<{ id: string; windingTested: string; testVoltage: string; results: string; units: string; correctedResults: string }>;
  secondaryVoltageAsFoundTap: string;
  revenueMetering: boolean;
  turnsRatioTest: Array<{ id: string; tap: string; primaryVoltage: string; calculatedRatio: string; measuredH1H2: string; percentDeviation: string; passFail: string }>;
  testEquipmentUsed: {
    megohmmeter: { name: string; serialNumber: string; ampId: string };
    lowResistanceOhmmeter: { name: string; serialNumber: string; ampId: string };
    ttrTestSet: { name: string; serialNumber: string; ampId: string };
  };
  comments: string;
  status: string;
}

// Helper component for labeled input
function LabeledInput({ label, value, onChange, readOnly = false, type = 'text', className = '' }: {
  label?: string;
  value: string | number;
  onChange?: (v: string) => void;
  readOnly?: boolean;
  type?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      {label && <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>}
      <input
        type={type}
        value={value}
        onChange={e => onChange?.(e.target.value)}
        readOnly={readOnly}
        className={`form-input w-full ${readOnly ? 'bg-gray-100 dark:bg-gray-700' : ''}`}
      />
    </div>
  );
}

export function VoltagePotentialTransformerMTSReport({ job, reportData, onSave }: Props) {
  const [formData, setFormData] = useState<FormData>(() => {
    const data = reportData || {};
    return {
      customerName: data.customerName || job?.customer_name || '',
      customerAddress: data.customerAddress || '',
      userName: data.userName || '',
      date: data.date || new Date().toISOString().split('T')[0],
      identifier: data.identifier || '',
      jobNumber: data.jobNumber || job?.job_number || '',
      technicians: data.technicians || '',
      temperature: {
        fahrenheit: data.temperature?.fahrenheit ?? 76,
        celsius: data.temperature?.celsius ?? 24,
        tcf: data.temperature?.tcf ?? 1.2,
        humidity: data.temperature?.humidity ?? 0
      },
      substation: data.substation || '',
      eqptLocation: data.eqptLocation || '',
      deviceData: {
        manufacturer: data.deviceData?.manufacturer || '',
        catalogNumber: data.deviceData?.catalogNumber || '',
        serialNumber: data.deviceData?.serialNumber || '',
        accuracyClass: data.deviceData?.accuracyClass || '',
        manufacturedYear: data.deviceData?.manufacturedYear || '',
        voltageRating: data.deviceData?.voltageRating || '',
        insulationClass: data.deviceData?.insulationClass || '',
        frequency: data.deviceData?.frequency || ''
      },
      visualMechanicalInspection: data.visualMechanicalInspection || INITIAL_VISUAL_INSPECTION_ITEMS,
      fuseData: {
        manufacturer: data.fuseData?.manufacturer || '',
        catalogNumber: data.fuseData?.catalogNumber || '',
        class: data.fuseData?.class || '',
        voltageRatingKv: data.fuseData?.voltageRatingKv || '',
        ampacityA: data.fuseData?.ampacityA || '',
        icRatingKa: data.fuseData?.icRatingKa || ''
      },
      fuseResistanceTest: {
        asFound: data.fuseResistanceTest?.asFound || '',
        asLeft: data.fuseResistanceTest?.asLeft || '',
        units: data.fuseResistanceTest?.units || 'µΩ'
      },
      insulationResistance: data.insulationResistance || INITIAL_INSULATION_RESISTANCE_ITEMS,
      secondaryVoltageAsFoundTap: data.secondaryVoltageAsFoundTap || '120',
      revenueMetering: data.revenueMetering ?? true,
      turnsRatioTest: data.turnsRatioTest || INITIAL_TURNS_RATIO_TEST,
      testEquipmentUsed: {
        megohmmeter: data.testEquipmentUsed?.megohmmeter || { name: '', serialNumber: '', ampId: '' },
        lowResistanceOhmmeter: data.testEquipmentUsed?.lowResistanceOhmmeter || { name: '', serialNumber: '', ampId: '' },
        ttrTestSet: data.testEquipmentUsed?.ttrTestSet || { name: '', serialNumber: '', ampId: '' }
      },
      comments: data.comments || '',
      status: data.status || 'PASS'
    };
  });

  const [isEditing, setIsEditing] = useState(true);

  const handleFahrenheitChange = (fahrenheit: number) => {
    const celsius = Math.round((fahrenheit - 32) * 5 / 9);
    const tcf = getTCF(celsius);
    setFormData(prev => ({ ...prev, temperature: { ...prev.temperature, fahrenheit, celsius, tcf } }));
  };

  const handleCelsiusChange = (celsius: number) => {
    const fahrenheit = Math.round(celsius * 9 / 5 + 32);
    const tcf = getTCF(celsius);
    setFormData(prev => ({ ...prev, temperature: { ...prev.temperature, fahrenheit, celsius, tcf } }));
  };

  // Recalculate corrected insulation resistance when temperature changes
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      insulationResistance: prev.insulationResistance.map(item => ({
        ...item,
        correctedResults: calculateTempCorrectedReading(item.results, prev.temperature.tcf)
      }))
    }));
  }, [formData.temperature.tcf]);

  // Recalculate turns ratio when values change
  useEffect(() => {
    if (formData.turnsRatioTest && formData.turnsRatioTest.length > 0) {
      const item = formData.turnsRatioTest[0];
      const primaryVoltage = parseFloat(item.primaryVoltage);
      const secondaryVoltage = parseFloat(formData.secondaryVoltageAsFoundTap);
      const measuredH1H2 = parseFloat(item.measuredH1H2);
      
      let calculatedRatio = '';
      let percentDeviation = '';
      let passFail = '';

      if (!isNaN(primaryVoltage) && !isNaN(secondaryVoltage) && secondaryVoltage !== 0) {
        const calcRatioVal = primaryVoltage / secondaryVoltage;
        calculatedRatio = calcRatioVal.toFixed(4);
        if (!isNaN(measuredH1H2)) {
          const dev = ((calcRatioVal - measuredH1H2) / calcRatioVal) * 100;
          percentDeviation = dev.toFixed(2);
          passFail = calculatePassFail(parseFloat(percentDeviation), formData.revenueMetering);
        }
      }

      if (calculatedRatio !== item.calculatedRatio || percentDeviation !== item.percentDeviation || passFail !== item.passFail) {
        setFormData(prev => ({
          ...prev,
          turnsRatioTest: [{ ...item, calculatedRatio, percentDeviation, passFail }]
        }));
      }
    }
  }, [formData.turnsRatioTest?.[0]?.primaryVoltage, formData.turnsRatioTest?.[0]?.measuredH1H2, formData.secondaryVoltageAsFoundTap, formData.revenueMetering]);

  const handleChange = (path: string, value: any) => {
    setFormData(prev => {
      const keys = path.split('.');
      const newData = { ...prev };
      let current: any = newData;
      
      for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        current[key] = { ...current[key] };
        current = current[key];
      }
      
      current[keys[keys.length - 1]] = value;
      return newData;
    });
  };

  const handleVisualInspectionChange = (index: number, value: string) => {
    setFormData(prev => {
      const newItems = [...prev.visualMechanicalInspection];
      newItems[index] = { ...newItems[index], result: value };
      return { ...prev, visualMechanicalInspection: newItems };
    });
  };

  const handleInsulationResistanceChange = (index: number, field: string, value: string) => {
    setFormData(prev => {
      const newItems = [...prev.insulationResistance];
      newItems[index] = { ...newItems[index], [field]: value };
      if (field === 'results') {
        newItems[index].correctedResults = calculateTempCorrectedReading(value, prev.temperature.tcf);
      }
      return { ...prev, insulationResistance: newItems };
    });
  };

  const handleTurnsRatioChange = (field: string, value: string) => {
    setFormData(prev => {
      const newItems = [...prev.turnsRatioTest];
      newItems[0] = { ...newItems[0], [field]: value };
      return { ...prev, turnsRatioTest: newItems };
    });
  };

  const handleSave = () => {
    onSave(formData);
    setIsEditing(false);
  };

  return (
    <div className="report-container">
      <ReportHeader
        title="13-Voltage Potential Transformer Test MTS"
        status={formData.status as 'PASS' | 'FAIL'}
        onStatusChange={() => setFormData(prev => ({ ...prev, status: prev.status === 'PASS' ? 'FAIL' : 'PASS' }))}
        isEditing={isEditing}
        onEdit={() => setIsEditing(true)}
        onSave={handleSave}
      />

      {/* Job Information */}
      <ReportSection title="Job Information">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <LabeledInput label="Customer" value={formData.customerName} readOnly />
          <LabeledInput label="Job #" value={formData.jobNumber} readOnly />
          <LabeledInput label="Technicians" value={formData.technicians} onChange={v => handleChange('technicians', v)} readOnly={!isEditing} />
          <LabeledInput label="Date" type="date" value={formData.date} onChange={v => handleChange('date', v)} readOnly={!isEditing} />
          <LabeledInput label="Identifier" value={formData.identifier} onChange={v => handleChange('identifier', v)} readOnly={!isEditing} />
          <div className="flex gap-2 items-end">
            <LabeledInput label="Temp °F" type="number" value={formData.temperature.fahrenheit.toString()} onChange={v => handleFahrenheitChange(Number(v))} readOnly={!isEditing} className="w-20" />
            <LabeledInput label="°C" type="number" value={formData.temperature.celsius.toString()} onChange={v => handleCelsiusChange(Number(v))} readOnly={!isEditing} className="w-20" />
            <LabeledInput label="TCF" value={formData.temperature.tcf.toFixed(3)} readOnly className="w-20" />
          </div>
          <LabeledInput label="Humidity %" type="number" value={formData.temperature.humidity?.toString() || ''} onChange={v => handleChange('temperature.humidity', Number(v))} readOnly={!isEditing} />
          <LabeledInput label="Substation" value={formData.substation} onChange={v => handleChange('substation', v)} readOnly={!isEditing} />
          <LabeledInput label="Eqpt. Location" value={formData.eqptLocation} onChange={v => handleChange('eqptLocation', v)} readOnly={!isEditing} />
          <LabeledInput label="User" value={formData.userName} onChange={v => handleChange('userName', v)} readOnly={!isEditing} />
        </div>
      </ReportSection>

      {/* Device Data */}
      <ReportSection title="Device Data">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <LabeledInput label="Manufacturer" value={formData.deviceData.manufacturer} onChange={v => handleChange('deviceData.manufacturer', v)} readOnly={!isEditing} />
          <LabeledInput label="Catalog Number" value={formData.deviceData.catalogNumber} onChange={v => handleChange('deviceData.catalogNumber', v)} readOnly={!isEditing} />
          <LabeledInput label="Serial Number" value={formData.deviceData.serialNumber} onChange={v => handleChange('deviceData.serialNumber', v)} readOnly={!isEditing} />
          <LabeledInput label="Accuracy Class" value={formData.deviceData.accuracyClass} onChange={v => handleChange('deviceData.accuracyClass', v)} readOnly={!isEditing} />
          <LabeledInput label="Manufactured Year" value={formData.deviceData.manufacturedYear} onChange={v => handleChange('deviceData.manufacturedYear', v)} readOnly={!isEditing} />
          <LabeledInput label="Voltage Rating" value={formData.deviceData.voltageRating} onChange={v => handleChange('deviceData.voltageRating', v)} readOnly={!isEditing} />
          <LabeledInput label="Insulation Class" value={formData.deviceData.insulationClass} onChange={v => handleChange('deviceData.insulationClass', v)} readOnly={!isEditing} />
          <LabeledInput label="Frequency" value={formData.deviceData.frequency} onChange={v => handleChange('deviceData.frequency', v)} readOnly={!isEditing} />
        </div>
      </ReportSection>

      {/* Visual and Mechanical Inspection */}
      <ReportSection title="Visual and Mechanical Inspection">
        <div className="overflow-x-auto">
          <table className="report-table">
            <thead>
              <tr>
                <th className="w-24">NETA</th>
                <th>Description</th>
                <th className="w-40">Result</th>
              </tr>
            </thead>
            <tbody>
              {formData.visualMechanicalInspection.map((item, index) => (
                <tr key={item.netaSection}>
                  <td className="text-center">{item.netaSection}</td>
                  <td>{item.description}</td>
                  <td>
                    <select
                      value={item.result}
                      onChange={e => handleVisualInspectionChange(index, e.target.value)}
                      disabled={!isEditing}
                      className="form-select w-full"
                    >
                      {VISUAL_INSPECTION_OPTIONS.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ReportSection>

      {/* Fuse Data */}
      <ReportSection title="Fuse Data">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <LabeledInput label="Manufacturer" value={formData.fuseData.manufacturer} onChange={v => handleChange('fuseData.manufacturer', v)} readOnly={!isEditing} />
          <LabeledInput label="Catalog Number" value={formData.fuseData.catalogNumber} onChange={v => handleChange('fuseData.catalogNumber', v)} readOnly={!isEditing} />
          <LabeledInput label="Class" value={formData.fuseData.class} onChange={v => handleChange('fuseData.class', v)} readOnly={!isEditing} />
          <LabeledInput label="Voltage Rating (kV)" value={formData.fuseData.voltageRatingKv} onChange={v => handleChange('fuseData.voltageRatingKv', v)} readOnly={!isEditing} />
          <LabeledInput label="Ampacity (A)" value={formData.fuseData.ampacityA} onChange={v => handleChange('fuseData.ampacityA', v)} readOnly={!isEditing} />
          <LabeledInput label="I.C. Rating (kA)" value={formData.fuseData.icRatingKa} onChange={v => handleChange('fuseData.icRatingKa', v)} readOnly={!isEditing} />
        </div>
      </ReportSection>

      {/* Electrical Tests - Fuse Resistance */}
      <ReportSection title="Electrical Tests - Fuse Resistance">
        <div className="overflow-x-auto">
          <table className="report-table">
            <thead>
              <tr>
                <th>Fuse Resistance</th>
                <th>As Found</th>
                <th>As Left</th>
                <th>Units</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Fuse Resistance</td>
                <td>
                  <input type="text" value={formData.fuseResistanceTest.asFound} onChange={e => handleChange('fuseResistanceTest.asFound', e.target.value)} readOnly={!isEditing} className={`form-input w-full ${!isEditing ? 'bg-gray-100 dark:bg-gray-700' : ''}`} />
                </td>
                <td>
                  <input type="text" value={formData.fuseResistanceTest.asLeft} onChange={e => handleChange('fuseResistanceTest.asLeft', e.target.value)} readOnly={!isEditing} className={`form-input w-full ${!isEditing ? 'bg-gray-100 dark:bg-gray-700' : ''}`} />
                </td>
                <td>
                  <select value={formData.fuseResistanceTest.units} onChange={e => handleChange('fuseResistanceTest.units', e.target.value)} disabled={!isEditing} className="form-select w-full">
                    {FUSE_RESISTANCE_UNIT_OPTIONS.map(opt => <option key={opt.symbol} value={opt.symbol}>{opt.symbol}</option>)}
                  </select>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </ReportSection>

      {/* Electrical Tests - Insulation Resistance & Ratio */}
      <ReportSection title="Electrical Tests - Insulation Resistance & Ratio">
        {/* Two side-by-side tables */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Insulation Resistance Table */}
          <div>
            <h3 className="text-lg font-medium mb-2">Insulation Resistance</h3>
            <div className="overflow-x-auto">
              <table className="report-table">
                <thead>
                  <tr>
                    <th>Winding Tested</th>
                    <th>Test Voltage</th>
                    <th>Results</th>
                    <th>Units</th>
                  </tr>
                </thead>
                <tbody>
                  {formData.insulationResistance.map((item, index) => (
                    <tr key={item.id}>
                      <td>{item.windingTested}</td>
                      <td>
                        <select value={item.testVoltage} onChange={e => handleInsulationResistanceChange(index, 'testVoltage', e.target.value)} disabled={!isEditing} className="form-select w-full">
                          {INSULATION_TEST_VOLTAGE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                      </td>
                      <td>
                        <input type="text" value={item.results} onChange={e => handleInsulationResistanceChange(index, 'results', e.target.value)} readOnly={!isEditing} className={`form-input w-full ${!isEditing ? 'bg-gray-100 dark:bg-gray-700' : ''}`} />
                      </td>
                      <td>
                        <select value={item.units} onChange={e => handleInsulationResistanceChange(index, 'units', e.target.value)} disabled={!isEditing} className="form-select w-full">
                          {IR_UNITS.map(u => <option key={u.symbol} value={u.symbol}>{u.symbol}</option>)}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Temperature Corrected Table */}
          <div>
            <h3 className="text-lg font-medium mb-2">Temperature Corrected</h3>
            <div className="overflow-x-auto">
              <table className="report-table">
                <thead>
                  <tr>
                    <th>Winding Tested</th>
                    <th>Test Voltage</th>
                    <th>Results</th>
                    <th>Units</th>
                  </tr>
                </thead>
                <tbody>
                  {formData.insulationResistance.map((item) => (
                    <tr key={`corrected-${item.id}`}>
                      <td>{item.windingTested}</td>
                      <td>
                        <input type="text" value={item.testVoltage} readOnly className="form-input w-full bg-gray-100 dark:bg-gray-700" />
                      </td>
                      <td>
                        <input type="text" value={item.correctedResults} readOnly className="form-input w-full bg-gray-100 dark:bg-gray-700" />
                      </td>
                      <td>
                        <input type="text" value={item.units} readOnly className="form-input w-full bg-gray-100 dark:bg-gray-700" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Secondary Voltage and Turns Ratio Test */}
        <div className="mt-6">
          <div className="mb-4 flex items-center gap-4">
            <LabeledInput
              label="Secondary Voltage at as-found tap"
              value={formData.secondaryVoltageAsFoundTap}
              onChange={v => handleChange('secondaryVoltageAsFoundTap', v)}
              readOnly={!isEditing}
              className="w-48"
            />
            <span className="mt-6">V</span>
          </div>

          {/* Revenue Metering Toggle */}
          <div className="mb-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.revenueMetering}
                onChange={e => handleChange('revenueMetering', e.target.checked)}
                disabled={!isEditing}
                className="form-checkbox"
              />
              <span className="text-sm">Used for Revenue Metering (0.5% tolerance)</span>
            </label>
            <p className="text-xs text-gray-500 mt-1">Uncheck if not used for revenue metering (1.2% tolerance)</p>
          </div>

          <h3 className="text-lg font-medium mb-2">Turns Ratio Test</h3>
          <div className="overflow-x-auto">
            <table className="report-table">
              <thead>
                <tr>
                  <th>Tap</th>
                  <th>Primary Voltage</th>
                  <th>Calculated Ratio</th>
                  <th>Measured H1-H2</th>
                  <th>% Dev.</th>
                  <th>Pass/Fail</th>
                </tr>
              </thead>
              <tbody>
                {formData.turnsRatioTest && formData.turnsRatioTest.length > 0 && (
                  <tr>
                    <td>
                      <input type="text" value={formData.turnsRatioTest[0].tap} onChange={e => handleTurnsRatioChange('tap', e.target.value)} readOnly={!isEditing} className={`form-input w-full ${!isEditing ? 'bg-gray-100 dark:bg-gray-700' : ''}`} />
                    </td>
                    <td>
                      <input type="text" value={formData.turnsRatioTest[0].primaryVoltage} onChange={e => handleTurnsRatioChange('primaryVoltage', e.target.value)} readOnly={!isEditing} className={`form-input w-full ${!isEditing ? 'bg-gray-100 dark:bg-gray-700' : ''}`} />
                    </td>
                    <td>
                      <input type="text" value={formData.turnsRatioTest[0].calculatedRatio} readOnly className="form-input w-full bg-gray-100 dark:bg-gray-700" />
                    </td>
                    <td>
                      <input type="text" value={formData.turnsRatioTest[0].measuredH1H2} onChange={e => handleTurnsRatioChange('measuredH1H2', e.target.value)} readOnly={!isEditing} className={`form-input w-full ${!isEditing ? 'bg-gray-100 dark:bg-gray-700' : ''}`} />
                    </td>
                    <td>
                      <input type="text" value={formData.turnsRatioTest[0].percentDeviation} readOnly className="form-input w-full bg-gray-100 dark:bg-gray-700" />
                    </td>
                    <td>
                      <input type="text" value={formData.turnsRatioTest[0].passFail} readOnly className="form-input w-full bg-gray-100 dark:bg-gray-700" />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </ReportSection>

      {/* Test Equipment Used */}
      <ReportSection title="Test Equipment Used">
        <div className="overflow-x-auto">
          <table className="report-table">
            <thead>
              <tr>
                <th>Equipment</th>
                <th>Name</th>
                <th>Serial Number</th>
                <th>AMP ID</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="font-medium">Megohmmeter</td>
                <td>
                  <input type="text" value={formData.testEquipmentUsed.megohmmeter.name} onChange={e => handleChange('testEquipmentUsed.megohmmeter.name', e.target.value)} readOnly={!isEditing} className={`form-input w-full ${!isEditing ? 'bg-gray-100 dark:bg-gray-700' : ''}`} />
                </td>
                <td>
                  <input type="text" value={formData.testEquipmentUsed.megohmmeter.serialNumber} onChange={e => handleChange('testEquipmentUsed.megohmmeter.serialNumber', e.target.value)} readOnly={!isEditing} className={`form-input w-full ${!isEditing ? 'bg-gray-100 dark:bg-gray-700' : ''}`} />
                </td>
                <td>
                  <input type="text" value={formData.testEquipmentUsed.megohmmeter.ampId} onChange={e => handleChange('testEquipmentUsed.megohmmeter.ampId', e.target.value)} readOnly={!isEditing} className={`form-input w-full ${!isEditing ? 'bg-gray-100 dark:bg-gray-700' : ''}`} />
                </td>
              </tr>
              <tr>
                <td className="font-medium">Low Resistance Ohmmeter</td>
                <td>
                  <input type="text" value={formData.testEquipmentUsed.lowResistanceOhmmeter.name} onChange={e => handleChange('testEquipmentUsed.lowResistanceOhmmeter.name', e.target.value)} readOnly={!isEditing} className={`form-input w-full ${!isEditing ? 'bg-gray-100 dark:bg-gray-700' : ''}`} />
                </td>
                <td>
                  <input type="text" value={formData.testEquipmentUsed.lowResistanceOhmmeter.serialNumber} onChange={e => handleChange('testEquipmentUsed.lowResistanceOhmmeter.serialNumber', e.target.value)} readOnly={!isEditing} className={`form-input w-full ${!isEditing ? 'bg-gray-100 dark:bg-gray-700' : ''}`} />
                </td>
                <td>
                  <input type="text" value={formData.testEquipmentUsed.lowResistanceOhmmeter.ampId} onChange={e => handleChange('testEquipmentUsed.lowResistanceOhmmeter.ampId', e.target.value)} readOnly={!isEditing} className={`form-input w-full ${!isEditing ? 'bg-gray-100 dark:bg-gray-700' : ''}`} />
                </td>
              </tr>
              <tr>
                <td className="font-medium">TTR Test Set</td>
                <td>
                  <input type="text" value={formData.testEquipmentUsed.ttrTestSet.name} onChange={e => handleChange('testEquipmentUsed.ttrTestSet.name', e.target.value)} readOnly={!isEditing} className={`form-input w-full ${!isEditing ? 'bg-gray-100 dark:bg-gray-700' : ''}`} />
                </td>
                <td>
                  <input type="text" value={formData.testEquipmentUsed.ttrTestSet.serialNumber} onChange={e => handleChange('testEquipmentUsed.ttrTestSet.serialNumber', e.target.value)} readOnly={!isEditing} className={`form-input w-full ${!isEditing ? 'bg-gray-100 dark:bg-gray-700' : ''}`} />
                </td>
                <td>
                  <input type="text" value={formData.testEquipmentUsed.ttrTestSet.ampId} onChange={e => handleChange('testEquipmentUsed.ttrTestSet.ampId', e.target.value)} readOnly={!isEditing} className={`form-input w-full ${!isEditing ? 'bg-gray-100 dark:bg-gray-700' : ''}`} />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </ReportSection>

      {/* Comments */}
      <ReportSection title="Comments">
        <textarea
          value={formData.comments}
          onChange={e => handleChange('comments', e.target.value)}
          readOnly={!isEditing}
          className="form-textarea w-full h-32"
          placeholder="Enter any additional comments..."
        />
      </ReportSection>
    </div>
  );
}

export default VoltagePotentialTransformerMTSReport;
