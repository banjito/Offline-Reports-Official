/**
 * Report Components Index
 * 
 * Central export point for all report renderers
 */

// Base utilities
export * from './BaseReport';
export * from './reportRegistry';

// Individual Report Components
export { default as LowVoltageSwitchMultiDeviceReport } from './LowVoltageSwitchMultiDeviceReport';
export { default as PanelboardReport } from './PanelboardReport';
export { default as SwitchgearReport } from './SwitchgearReport';
export { default as DryTypeTransformerReport } from './DryTypeTransformerReport';
export { default as LowVoltageCircuitBreakerReport } from './LowVoltageCircuitBreakerReport';
export { default as MediumVoltageCircuitBreakerReport } from './MediumVoltageCircuitBreakerReport';
export { default as AutomaticTransferSwitchReport } from './AutomaticTransferSwitchReport';
export { default as MediumVoltageSwitchReport } from './MediumVoltageSwitchReport';
export { default as GroundingSystemMasterReport } from './GroundingSystemMasterReport';
export { default as LowVoltageCableReport } from './LowVoltageCableReport';
export { default as CurrentTransformerReport } from './CurrentTransformerReport';
export { default as PotentialTransformerReport } from './PotentialTransformerReport';
export { default as VoltagePotentialTransformerMTSReport } from './VoltagePotentialTransformerMTSReport';
export { default as LiquidFilledTransformerReport } from './LiquidFilledTransformerReport';
export { default as MediumVoltageSwitchMTSReport } from './MediumVoltageSwitchMTSReport';

// Report type to component mapping
import LowVoltageSwitchMultiDeviceReport from './LowVoltageSwitchMultiDeviceReport';
import PanelboardReport from './PanelboardReport';
import SwitchgearReport from './SwitchgearReport';
import DryTypeTransformerReport from './DryTypeTransformerReport';
import LowVoltageCircuitBreakerReport from './LowVoltageCircuitBreakerReport';
import MediumVoltageCircuitBreakerReport from './MediumVoltageCircuitBreakerReport';
import AutomaticTransferSwitchReport from './AutomaticTransferSwitchReport';
import MediumVoltageSwitchReport from './MediumVoltageSwitchReport';
import GroundingSystemMasterReport from './GroundingSystemMasterReport';
import LowVoltageCableReport from './LowVoltageCableReport';
import CurrentTransformerReport from './CurrentTransformerReport';
import PotentialTransformerReport from './PotentialTransformerReport';
import VoltagePotentialTransformerMTSReport from './VoltagePotentialTransformerMTSReport';
import LiquidFilledTransformerReport from './LiquidFilledTransformerReport';
import MediumVoltageSwitchMTSReport from './MediumVoltageSwitchMTSReport';

export const REPORT_COMPONENTS: { [key: string]: React.ComponentType<any> } = {
  // Low Voltage Switch Reports
  'low-voltage-switch-multi-device-test': LowVoltageSwitchMultiDeviceReport,
  'low-voltage-switch-report': LowVoltageSwitchMultiDeviceReport,
  '6-low-voltage-switch-maint-mts-report': LowVoltageSwitchMultiDeviceReport,
  
  // Panelboard Reports
  'panelboard-report': PanelboardReport,
  'panelboard-assemblies-ats25': PanelboardReport,
  
  // Switchgear Reports
  'switchgear-report': SwitchgearReport,
  'switchgear-switchboard-assemblies-ats25': SwitchgearReport,
  'switchgear-panelboard-mts-report': SwitchgearReport,
  
  // Dry Type Transformer Reports
  'dry-type-transformer': DryTypeTransformerReport,
  'large-dry-type-transformer-report': DryTypeTransformerReport,
  'large-dry-type-transformer': DryTypeTransformerReport,
  'large-dry-type-transformer-mts-report': DryTypeTransformerReport,
  'large-dry-type-xfmr-mts-report': DryTypeTransformerReport,
  'two-small-dry-typer-xfmr-ats-report': DryTypeTransformerReport,
  'two-small-dry-typer-xfmr-mts-report': DryTypeTransformerReport,
  
  // Liquid Filled Transformer Reports
  'liquid-filled-transformer': LiquidFilledTransformerReport,
  'oil-inspection': LiquidFilledTransformerReport,
  'liquid-xfmr-visual-mts-report': LiquidFilledTransformerReport,
  
  // Low Voltage Circuit Breaker Reports
  'low-voltage-circuit-breaker-electronic-trip-ats-report': LowVoltageCircuitBreakerReport,
  'low-voltage-circuit-breaker-electronic-trip-ats-secondary-injection-report': LowVoltageCircuitBreakerReport,
  'low-voltage-circuit-breaker-thermal-magnetic-ats-report': LowVoltageCircuitBreakerReport,
  'low-voltage-circuit-breaker-electronic-trip-mts-report': LowVoltageCircuitBreakerReport,
  'low-voltage-circuit-breaker-thermal-magnetic-mts-report': LowVoltageCircuitBreakerReport,
  'low-voltage-panelboard-small-breaker-report': LowVoltageCircuitBreakerReport,
  
  // Medium Voltage Circuit Breaker Reports
  'medium-voltage-circuit-breaker-report': MediumVoltageCircuitBreakerReport,
  'medium-voltage-circuit-breaker-mts-report': MediumVoltageCircuitBreakerReport,
  
  // Automatic Transfer Switch Reports
  'automatic-transfer-switch-ats-report': AutomaticTransferSwitchReport,
  
  // Medium Voltage Switch Reports (Oil & SF6)
  'medium-voltage-switch-oil-report': MediumVoltageSwitchReport,
  'medium-voltage-switch-sf6-report': MediumVoltageSwitchReport,
  
  // 23-Medium Voltage Switch MTS Report (different from Oil/SF6)
  '23-medium-voltage-switch-mts-report': MediumVoltageSwitchMTSReport,
  
  // Grounding Reports
  'grounding-system-master': GroundingSystemMasterReport,
  'grounding-fall-of-potential-slope-method-test': GroundingSystemMasterReport,
  
  // Low Voltage Cable Reports
  'low-voltage-cable-test-12sets': LowVoltageCableReport,
  'low-voltage-cable-test-20sets': LowVoltageCableReport,
  'low-voltage-cable-test-3sets': LowVoltageCableReport,
  '3-low-voltage-cable-ats': LowVoltageCableReport,
  '3-low-voltage-cable-mts': LowVoltageCableReport,
  
  // Current Transformer Reports
  'current-transformer-test-ats-report': CurrentTransformerReport,
  '12-current-transformer-test-ats-report': CurrentTransformerReport,
  '12-current-transformer-test-mts-report': CurrentTransformerReport,
  
  // Potential Transformer Reports
  'potential-transformer-ats-report': PotentialTransformerReport,
  '13-voltage-potential-transformer-test-mts-report': VoltagePotentialTransformerMTSReport,
  
  // Additional Report Types (using closest matching renderer)
  'medium-voltage-vlf-tan-delta': LowVoltageCableReport,
  'medium-voltage-vlf': LowVoltageCableReport,
  'medium-voltage-cable-vlf-test': LowVoltageCableReport,
  'medium-voltage-vlf-tan-delta-mts': LowVoltageCableReport,
  'medium-voltage-vlf-mts-report': LowVoltageCableReport,
  'medium-voltage-cable-vlf-test-mts': LowVoltageCableReport,
  'electrical-tan-delta-test-mts-form': LowVoltageCableReport,
  
  // Metal Enclosed Busway (using Switchgear as similar structure)
  'metal-enclosed-busway': SwitchgearReport,
  
  // Motor Starter (using MV Switch as similar structure)
  '23-medium-voltage-motor-starter-mts-report': MediumVoltageSwitchReport,
  
  // Relay Test (using MV Circuit Breaker as similar structure)
  'relay-test-report': MediumVoltageCircuitBreakerReport,
  
  // Oil Analysis (using Liquid Filled Transformer as similar structure)
  'oil-analysis': LiquidFilledTransformerReport
};

/**
 * Get the appropriate report component for a given report type
 */
export function getReportComponent(reportType: string): React.ComponentType<any> | null {
  return REPORT_COMPONENTS[reportType] || null;
}

/**
 * Get variant for circuit breaker reports
 */
export function getCircuitBreakerVariant(reportType: string): 'electronic' | 'thermal-magnetic' {
  if (reportType.includes('thermal-magnetic')) {
    return 'thermal-magnetic';
  }
  return 'electronic';
}

/**
 * Get variant for MV switch reports
 */
export function getMVSwitchVariant(reportType: string): 'oil' | 'sf6' {
  if (reportType.includes('sf6')) {
    return 'sf6';
  }
  return 'oil';
}

/**
 * Get variant for cable reports
 */
export function getCableVariant(reportType: string): '12sets' | '20sets' | '3sets' {
  if (reportType.includes('20sets') || reportType.includes('20')) {
    return '20sets';
  }
  if (reportType.includes('3sets') || reportType.includes('mts')) {
    return '3sets';
  }
  return '12sets';
}

/**
 * Get variant for CT/PT reports
 */
export function getTransformerTestVariant(reportType: string): 'ats' | 'mts' {
  if (reportType.includes('mts')) {
    return 'mts';
  }
  return 'ats';
}
