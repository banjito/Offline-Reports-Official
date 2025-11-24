/**
 * Liquid Filled Transformer Report
 * Desktop offline version
 */

import { useState, useEffect } from 'react';
import { Job } from '../../types';
import {
  ReportSection,
  ReportInput,
  ReportSelect,
  JobInfoSection,
  VisualInspectionSection,
  TestEquipmentSection,
  CommentsSection,
  ReportHeader,
  useReportState,
  multiplyByTCF,
  calculateRatio,
  IR_UNITS,
  TEST_VOLTAGE_OPTIONS,
  PHASE_CONFIGS
} from './BaseReport';
import './ReportStyles.css';

interface Props {
  job: Job | null;
  reportData: any;
  onSave: (data: any) => void;
  variant?: 'ats' | 'mts';
}

// Visual inspection items for Liquid Filled Transformer
const LIQUID_XFMR_INSPECTION_ITEMS = [
  { id: '7.2.1.A.1', description: 'Compare equipment nameplate data with drawings and specifications.' },
  { id: '7.2.1.A.2', description: 'Inspect physical and mechanical condition.' },
  { id: '7.2.1.A.3', description: 'Verify proper anchorage and grounding.' },
  { id: '7.2.1.A.4', description: 'Verify the unit is clean.' },
  { id: '7.2.1.A.5', description: 'Verify proper liquid level in all tanks and bushings.' },
  { id: '7.2.1.A.6', description: 'Inspect for leaks.' },
  { id: '7.2.1.A.7', description: 'Verify that all required grounding and bonding connections provide contact integrity.' },
  { id: '7.2.1.A.8', description: 'Verify tightness of accessible bolted electrical connections.' },
  { id: '7.2.1.A.9', description: 'Verify correct operation of auxiliary devices.' },
  { id: '7.2.1.A.10', description: 'Verify correct operation of cooling system.' },
  { id: '7.2.1.A.11', description: 'Verify correct operation of tap changer.' },
  { id: '7.2.1.A.12', description: 'Inspect bushings for cracks, chips, and contamination.' },
];

export function LiquidFilledTransformerReport({ job, reportData, onSave, variant = 'ats' }: Props) {
  const initialData = {
    customer: job?.customer_name || reportData?.customer || '',
    jobNumber: job?.job_number || reportData?.jobNumber || '',
    technicians: reportData?.technicians || '',
    date: reportData?.date || new Date().toISOString().split('T')[0],
    identifier: reportData?.identifier || '',
    substation: reportData?.substation || '',
    eqptLocation: reportData?.eqptLocation || '',
    user: reportData?.user || '',
    temperature: {
      fahrenheit: reportData?.temperature?.fahrenheit ?? 68,
      celsius: reportData?.temperature?.celsius ?? 20,
      tcf: reportData?.temperature?.tcf ?? 1,
      humidity: reportData?.temperature?.humidity ?? ''
    },
    status: reportData?.status || 'PASS',
    // Nameplate
    nameplate: {
      manufacturer: reportData?.nameplate?.manufacturer || '',
      serialNumber: reportData?.nameplate?.serialNumber || '',
      type: reportData?.nameplate?.type || '',
      kva: reportData?.nameplate?.kva || '',
      phaseConfiguration: reportData?.nameplate?.phaseConfiguration || '',
      frequency: reportData?.nameplate?.frequency || '60',
      primaryVoltage: reportData?.nameplate?.primaryVoltage || '',
      secondaryVoltage: reportData?.nameplate?.secondaryVoltage || '',
      impedance: reportData?.nameplate?.impedance || '',
      tempRise: reportData?.nameplate?.tempRise || '',
      bil: reportData?.nameplate?.bil || '',
      oilType: reportData?.nameplate?.oilType || '',
      oilVolume: reportData?.nameplate?.oilVolume || '',
      weight: reportData?.nameplate?.weight || '',
      coolingClass: reportData?.nameplate?.coolingClass || ''
    },
    // Tap Configuration
    tapConfig: {
      tapPosition: reportData?.tapConfig?.tapPosition || '',
      tapVoltage: reportData?.tapConfig?.tapVoltage || '',
      tapRange: reportData?.tapConfig?.tapRange || ''
    },
    // Visual inspection
    visualInspection: LIQUID_XFMR_INSPECTION_ITEMS.map(item => ({
      id: item.id,
      description: item.description,
      result: reportData?.visualInspection?.[item.id] || 'Select One',
      comments: ''
    })),
    // Insulation Resistance
    insulationResistance: {
      testVoltage: reportData?.insulationResistance?.testVoltage || '5000V',
      units: reportData?.insulationResistance?.units || 'MΩ',
      // Primary
      primaryHToLPlusG: reportData?.insulationResistance?.primaryHToLPlusG || '',
      primaryHToLPlusGCorrected: '',
      // Secondary
      secondaryXToHPlusG: reportData?.insulationResistance?.secondaryXToHPlusG || '',
      secondaryXToHPlusGCorrected: '',
      // Primary to Ground
      primaryHToG: reportData?.insulationResistance?.primaryHToG || '',
      primaryHToGCorrected: '',
      // Secondary to Ground
      secondaryXToG: reportData?.insulationResistance?.secondaryXToG || '',
      secondaryXToGCorrected: '',
      // 10 min readings for PI
      oneMinH: reportData?.insulationResistance?.oneMinH || '',
      tenMinH: reportData?.insulationResistance?.tenMinH || '',
      oneMinX: reportData?.insulationResistance?.oneMinX || '',
      tenMinX: reportData?.insulationResistance?.tenMinX || '',
      // Calculated
      dielectricAbsorptionH: '',
      polarizationIndexH: '',
      dielectricAbsorptionX: '',
      polarizationIndexX: ''
    },
    // Oil Analysis
    oilAnalysis: {
      sampleDate: reportData?.oilAnalysis?.sampleDate || '',
      dielectricStrength: reportData?.oilAnalysis?.dielectricStrength || '',
      acidNumber: reportData?.oilAnalysis?.acidNumber || '',
      interfacialTension: reportData?.oilAnalysis?.interfacialTension || '',
      colorNumber: reportData?.oilAnalysis?.colorNumber || '',
      moistureContent: reportData?.oilAnalysis?.moistureContent || '',
      powerFactor: reportData?.oilAnalysis?.powerFactor || ''
    },
    // Test equipment
    testEquipment: {
      megohmmeter: reportData?.testEquipment?.megohmmeter || { name: '', serialNumber: '', ampId: '' },
      lowResistance: reportData?.testEquipment?.lowResistance || { name: '', serialNumber: '', ampId: '' }
    },
    comments: reportData?.comments || ''
  };

  const { formData, setFormData, setField, isEditing, setIsEditing } = useReportState(initialData);
  const [status, setStatus] = useState<'PASS' | 'FAIL'>(initialData.status as 'PASS' | 'FAIL');

  // Auto-calculate corrected IR and PI/DA values
  useEffect(() => {
    const tcf = formData.temperature?.tcf || 1;
    const ir = formData.insulationResistance;
    
    setFormData((prev: any) => ({
      ...prev,
      insulationResistance: {
        ...prev.insulationResistance,
        primaryHToLPlusGCorrected: multiplyByTCF(ir.primaryHToLPlusG, tcf),
        secondaryXToHPlusGCorrected: multiplyByTCF(ir.secondaryXToHPlusG, tcf),
        primaryHToGCorrected: multiplyByTCF(ir.primaryHToG, tcf),
        secondaryXToGCorrected: multiplyByTCF(ir.secondaryXToG, tcf),
        dielectricAbsorptionH: calculateRatio(ir.oneMinH, ir.primaryHToG),
        polarizationIndexH: calculateRatio(ir.tenMinH, ir.oneMinH),
        dielectricAbsorptionX: calculateRatio(ir.oneMinX, ir.secondaryXToG),
        polarizationIndexX: calculateRatio(ir.tenMinX, ir.oneMinX)
      }
    }));
  }, [formData.temperature?.tcf, formData.insulationResistance.primaryHToLPlusG, formData.insulationResistance.secondaryXToHPlusG, formData.insulationResistance.primaryHToG, formData.insulationResistance.secondaryXToG, formData.insulationResistance.oneMinH, formData.insulationResistance.tenMinH, formData.insulationResistance.oneMinX, formData.insulationResistance.tenMinX]);

  const handleSave = () => {
    const dataToSave = {
      ...formData,
      status,
      visualInspection: Object.fromEntries(formData.visualInspection.map((item: any) => [item.id, item.result]))
    };
    onSave(dataToSave);
    setIsEditing(false);
  };

  const reportTitle = variant === 'mts' 
    ? '2-Liquid Filled Xfmr. Visual, Mechanical, Insulation Resistance Test MTS'
    : '2-Liquid Filled Xfmr. Visual, Mechanical, Insulation Resistance Test ATS 21';

  return (
    <div className="report-container">
      <ReportHeader
        title={reportTitle}
        status={status}
        onStatusChange={() => setStatus(s => s === 'PASS' ? 'FAIL' : 'PASS')}
        isEditing={isEditing}
        onEdit={() => setIsEditing(true)}
        onSave={handleSave}
      />

      <JobInfoSection data={formData} onChange={setField} isEditing={isEditing} />

      {/* Nameplate Data */}
      <ReportSection title="Transformer Nameplate Data">
        <div className="form-grid-4">
          <div className="form-field">
            <label>Manufacturer:</label>
            <ReportInput value={formData.nameplate.manufacturer} onChange={v => setField('nameplate.manufacturer', v)} readOnly={!isEditing} />
          </div>
          <div className="form-field">
            <label>Serial Number:</label>
            <ReportInput value={formData.nameplate.serialNumber} onChange={v => setField('nameplate.serialNumber', v)} readOnly={!isEditing} />
          </div>
          <div className="form-field">
            <label>Type:</label>
            <ReportInput value={formData.nameplate.type} onChange={v => setField('nameplate.type', v)} readOnly={!isEditing} />
          </div>
          <div className="form-field">
            <label>KVA:</label>
            <ReportInput value={formData.nameplate.kva} onChange={v => setField('nameplate.kva', v)} readOnly={!isEditing} />
          </div>
          <div className="form-field">
            <label>Phase Config:</label>
            <ReportSelect
              value={formData.nameplate.phaseConfiguration}
              options={['', ...PHASE_CONFIGS]}
              onChange={v => setField('nameplate.phaseConfiguration', v)}
              disabled={!isEditing}
            />
          </div>
          <div className="form-field">
            <label>Frequency (Hz):</label>
            <ReportInput value={formData.nameplate.frequency} onChange={v => setField('nameplate.frequency', v)} readOnly={!isEditing} />
          </div>
          <div className="form-field">
            <label>Primary Voltage:</label>
            <ReportInput value={formData.nameplate.primaryVoltage} onChange={v => setField('nameplate.primaryVoltage', v)} readOnly={!isEditing} />
          </div>
          <div className="form-field">
            <label>Secondary Voltage:</label>
            <ReportInput value={formData.nameplate.secondaryVoltage} onChange={v => setField('nameplate.secondaryVoltage', v)} readOnly={!isEditing} />
          </div>
          <div className="form-field">
            <label>Impedance %:</label>
            <ReportInput value={formData.nameplate.impedance} onChange={v => setField('nameplate.impedance', v)} readOnly={!isEditing} />
          </div>
          <div className="form-field">
            <label>Temp Rise (°C):</label>
            <ReportInput value={formData.nameplate.tempRise} onChange={v => setField('nameplate.tempRise', v)} readOnly={!isEditing} />
          </div>
          <div className="form-field">
            <label>BIL (kV):</label>
            <ReportInput value={formData.nameplate.bil} onChange={v => setField('nameplate.bil', v)} readOnly={!isEditing} />
          </div>
          <div className="form-field">
            <label>Cooling Class:</label>
            <ReportInput value={formData.nameplate.coolingClass} onChange={v => setField('nameplate.coolingClass', v)} readOnly={!isEditing} />
          </div>
          <div className="form-field">
            <label>Oil Type:</label>
            <ReportInput value={formData.nameplate.oilType} onChange={v => setField('nameplate.oilType', v)} readOnly={!isEditing} />
          </div>
          <div className="form-field">
            <label>Oil Volume (gal):</label>
            <ReportInput value={formData.nameplate.oilVolume} onChange={v => setField('nameplate.oilVolume', v)} readOnly={!isEditing} />
          </div>
          <div className="form-field">
            <label>Weight (lbs):</label>
            <ReportInput value={formData.nameplate.weight} onChange={v => setField('nameplate.weight', v)} readOnly={!isEditing} />
          </div>
        </div>
      </ReportSection>

      {/* Tap Configuration */}
      <ReportSection title="Tap Configuration">
        <div className="form-grid-3">
          <div className="form-field">
            <label>Tap Position:</label>
            <ReportInput value={formData.tapConfig.tapPosition} onChange={v => setField('tapConfig.tapPosition', v)} readOnly={!isEditing} />
          </div>
          <div className="form-field">
            <label>Tap Voltage:</label>
            <ReportInput value={formData.tapConfig.tapVoltage} onChange={v => setField('tapConfig.tapVoltage', v)} readOnly={!isEditing} />
          </div>
          <div className="form-field">
            <label>Tap Range:</label>
            <ReportInput value={formData.tapConfig.tapRange} onChange={v => setField('tapConfig.tapRange', v)} readOnly={!isEditing} />
          </div>
        </div>
      </ReportSection>

      <VisualInspectionSection
        items={formData.visualInspection}
        onChange={items => setFormData((prev: any) => ({ ...prev, visualInspection: items }))}
        isEditing={isEditing}
        netaSection="7.2.1"
      />

      {/* Insulation Resistance */}
      <ReportSection title="Insulation Resistance Tests">
        <div className="test-voltage-row">
          <label>Test Voltage:</label>
          <ReportSelect
            value={formData.insulationResistance.testVoltage}
            options={TEST_VOLTAGE_OPTIONS}
            onChange={v => setField('insulationResistance.testVoltage', v)}
            disabled={!isEditing}
          />
          <label>Units:</label>
          <ReportSelect
            value={formData.insulationResistance.units}
            options={IR_UNITS.map(u => u.symbol)}
            onChange={v => setField('insulationResistance.units', v)}
            disabled={!isEditing}
          />
        </div>
        <p className="calculated-note">Corrected values calculated using TCF = {(formData.temperature?.tcf || 1).toFixed(3)}</p>
        <div className="table-container">
          <table className="report-table">
            <thead>
              <tr>
                <th>Test</th>
                <th>Measured</th>
                <th>Corrected</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Primary (H) to Secondary+Ground (L+G)</td>
                <td><ReportInput value={formData.insulationResistance.primaryHToLPlusG} onChange={v => setField('insulationResistance.primaryHToLPlusG', v)} readOnly={!isEditing} /></td>
                <td><ReportInput value={formData.insulationResistance.primaryHToLPlusGCorrected} readOnly calculated /></td>
              </tr>
              <tr>
                <td>Secondary (X) to Primary+Ground (H+G)</td>
                <td><ReportInput value={formData.insulationResistance.secondaryXToHPlusG} onChange={v => setField('insulationResistance.secondaryXToHPlusG', v)} readOnly={!isEditing} /></td>
                <td><ReportInput value={formData.insulationResistance.secondaryXToHPlusGCorrected} readOnly calculated /></td>
              </tr>
              <tr>
                <td>Primary (H) to Ground</td>
                <td><ReportInput value={formData.insulationResistance.primaryHToG} onChange={v => setField('insulationResistance.primaryHToG', v)} readOnly={!isEditing} /></td>
                <td><ReportInput value={formData.insulationResistance.primaryHToGCorrected} readOnly calculated /></td>
              </tr>
              <tr>
                <td>Secondary (X) to Ground</td>
                <td><ReportInput value={formData.insulationResistance.secondaryXToG} onChange={v => setField('insulationResistance.secondaryXToG', v)} readOnly={!isEditing} /></td>
                <td><ReportInput value={formData.insulationResistance.secondaryXToGCorrected} readOnly calculated /></td>
              </tr>
            </tbody>
          </table>
        </div>
      </ReportSection>

      {/* Polarization Index */}
      <ReportSection title="Dielectric Absorption / Polarization Index">
        <div className="table-container">
          <table className="report-table">
            <thead>
              <tr>
                <th>Winding</th>
                <th>1 Min Reading</th>
                <th>10 Min Reading</th>
                <th>DA (1min/30sec)</th>
                <th>PI (10min/1min)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Primary (H)</td>
                <td><ReportInput value={formData.insulationResistance.oneMinH} onChange={v => setField('insulationResistance.oneMinH', v)} readOnly={!isEditing} /></td>
                <td><ReportInput value={formData.insulationResistance.tenMinH} onChange={v => setField('insulationResistance.tenMinH', v)} readOnly={!isEditing} /></td>
                <td><ReportInput value={formData.insulationResistance.dielectricAbsorptionH} readOnly calculated /></td>
                <td><ReportInput value={formData.insulationResistance.polarizationIndexH} readOnly calculated /></td>
              </tr>
              <tr>
                <td>Secondary (X)</td>
                <td><ReportInput value={formData.insulationResistance.oneMinX} onChange={v => setField('insulationResistance.oneMinX', v)} readOnly={!isEditing} /></td>
                <td><ReportInput value={formData.insulationResistance.tenMinX} onChange={v => setField('insulationResistance.tenMinX', v)} readOnly={!isEditing} /></td>
                <td><ReportInput value={formData.insulationResistance.dielectricAbsorptionX} readOnly calculated /></td>
                <td><ReportInput value={formData.insulationResistance.polarizationIndexX} readOnly calculated /></td>
              </tr>
            </tbody>
          </table>
        </div>
      </ReportSection>

      {/* Oil Analysis */}
      <ReportSection title="Oil Analysis">
        <div className="form-grid-4">
          <div className="form-field">
            <label>Sample Date:</label>
            <ReportInput type="date" value={formData.oilAnalysis.sampleDate} onChange={v => setField('oilAnalysis.sampleDate', v)} readOnly={!isEditing} />
          </div>
          <div className="form-field">
            <label>Dielectric Strength (kV):</label>
            <ReportInput value={formData.oilAnalysis.dielectricStrength} onChange={v => setField('oilAnalysis.dielectricStrength', v)} readOnly={!isEditing} />
          </div>
          <div className="form-field">
            <label>Acid Number:</label>
            <ReportInput value={formData.oilAnalysis.acidNumber} onChange={v => setField('oilAnalysis.acidNumber', v)} readOnly={!isEditing} />
          </div>
          <div className="form-field">
            <label>Interfacial Tension:</label>
            <ReportInput value={formData.oilAnalysis.interfacialTension} onChange={v => setField('oilAnalysis.interfacialTension', v)} readOnly={!isEditing} />
          </div>
          <div className="form-field">
            <label>Color Number:</label>
            <ReportInput value={formData.oilAnalysis.colorNumber} onChange={v => setField('oilAnalysis.colorNumber', v)} readOnly={!isEditing} />
          </div>
          <div className="form-field">
            <label>Moisture Content (ppm):</label>
            <ReportInput value={formData.oilAnalysis.moistureContent} onChange={v => setField('oilAnalysis.moistureContent', v)} readOnly={!isEditing} />
          </div>
          <div className="form-field">
            <label>Power Factor %:</label>
            <ReportInput value={formData.oilAnalysis.powerFactor} onChange={v => setField('oilAnalysis.powerFactor', v)} readOnly={!isEditing} />
          </div>
        </div>
      </ReportSection>

      <TestEquipmentSection
        equipment={formData.testEquipment}
        onChange={eq => setFormData((prev: any) => ({ ...prev, testEquipment: eq }))}
        isEditing={isEditing}
        showLowResistance={true}
      />

      <CommentsSection
        comments={formData.comments}
        onChange={c => setField('comments', c)}
        isEditing={isEditing}
      />
    </div>
  );
}

export default LiquidFilledTransformerReport;

