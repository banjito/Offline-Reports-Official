/**
 * Report Registry - Maps report types to their renderers
 * 
 * This file serves as the central configuration for all report types
 * in the desktop application.
 */

// Report type to table name mapping (for sync)
export const REPORT_TABLE_MAP: { [key: string]: string } = {
  'switchgear-report': 'switchgear_reports',
  'panelboard-report': 'panelboard_reports',
  'switchgear-switchboard-assemblies-ats25': 'switchgear_reports',
  'panelboard-assemblies-ats25': 'panelboard_reports',
  'dry-type-transformer': 'dry_type_transformer_reports',
  'large-dry-type-transformer-report': 'large_dry_type_transformer_reports',
  'large-dry-type-transformer': 'large_dry_type_transformer_reports',
  'liquid-filled-transformer': 'liquid_filled_transformer_reports',
  'oil-inspection': 'oil_inspection_reports',
  'two-small-dry-typer-xfmr-ats-report': 'dry_type_transformer_reports',
  'low-voltage-cable-test-12sets': 'low_voltage_cable_reports',
  'low-voltage-cable-test-20sets': 'low_voltage_cable_reports',
  'medium-voltage-vlf-tan-delta': 'medium_voltage_vlf_reports',
  'medium-voltage-vlf': 'medium_voltage_vlf_reports',
  'medium-voltage-cable-vlf-test': 'medium_voltage_vlf_reports',
  'metal-enclosed-busway': 'metal_enclosed_busway_reports',
  'low-voltage-switch-multi-device-test': 'low_voltage_switch_reports',
  'low-voltage-switch-report': 'low_voltage_switch_reports',
  'medium-voltage-switch-oil-report': 'medium_voltage_switch_reports',
  'medium-voltage-switch-sf6-report': 'medium_voltage_switch_reports',
  'potential-transformer-ats-report': 'potential_transformer_reports',
  'low-voltage-circuit-breaker-electronic-trip-ats-secondary-injection-report': 'lv_circuit_breaker_reports',
  'low-voltage-circuit-breaker-electronic-trip-ats-report': 'lv_circuit_breaker_reports',
  'low-voltage-circuit-breaker-thermal-magnetic-ats-report': 'lv_circuit_breaker_reports',
  'low-voltage-panelboard-small-breaker-report': 'lv_panelboard_breaker_reports',
  'medium-voltage-circuit-breaker-report': 'mv_circuit_breaker_reports',
  'current-transformer-test-ats-report': 'current_transformer_reports',
  '12-current-transformer-test-ats-report': 'current_transformer_reports',
  'automatic-transfer-switch-ats-report': 'automatic_transfer_switch_reports',
  'grounding-system-master': 'grounding_reports',
  'grounding-fall-of-potential-slope-method-test': 'grounding_reports',
  // MTS Reports
  'switchgear-panelboard-mts-report': 'switchgear_reports',
  'large-dry-type-transformer-mts-report': 'large_dry_type_transformer_reports',
  'large-dry-type-xfmr-mts-report': 'large_dry_type_transformer_reports',
  'liquid-xfmr-visual-mts-report': 'liquid_filled_transformer_reports',
  'two-small-dry-typer-xfmr-mts-report': 'dry_type_transformer_reports',
  'low-voltage-cable-test-3sets': 'low_voltage_cable_reports',
  'electrical-tan-delta-test-mts-form': 'medium_voltage_vlf_reports',
  'medium-voltage-vlf-tan-delta-mts': 'medium_voltage_vlf_reports',
  'medium-voltage-vlf-mts-report': 'medium_voltage_vlf_reports',
  'medium-voltage-cable-vlf-test-mts': 'medium_voltage_vlf_reports',
  'low-voltage-circuit-breaker-electronic-trip-mts-report': 'lv_circuit_breaker_reports',
  'low-voltage-circuit-breaker-thermal-magnetic-mts-report': 'lv_circuit_breaker_reports',
  'medium-voltage-circuit-breaker-mts-report': 'mv_circuit_breaker_reports',
  '12-current-transformer-test-mts-report': 'current_transformer_reports',
  '13-voltage-potential-transformer-test-mts-report': 'potential_transformer_reports',
  '23-medium-voltage-motor-starter-mts-report': 'mv_motor_starter_reports',
  '23-medium-voltage-switch-mts-report': 'medium_voltage_switch_reports',
  '6-low-voltage-switch-maint-mts-report': 'low_voltage_switch_reports',
  'relay-test-report': 'relay_test_reports'
};

// Report names for display
export const REPORT_NAMES: { [key: string]: string } = {
  'switchgear-report': '1-Switchgear, Switchboard, Panelboard Inspection & Test Report ATS 21',
  'switchgear-switchboard-assemblies-ats25': '7.1.1 Switchgear & Switchboard Assemblies Test Sheet ATS 25',
  'panelboard-assemblies-ats25': '7.1.2 Panelboard Assemblies Test Sheet ATS 25',
  'panelboard-report': '1-Panelboard Inspection & Test Report ATS 21',
  'dry-type-transformer': '2-Dry Type Xfmr. Visual, Mechanical, Insulation Resistance Test ATS 21',
  'large-dry-type-transformer-report': '2-Large Dry Type Xfmr. Visual, Mechanical, Insulation Resistance Test ATS 21',
  'large-dry-type-transformer': '2-Large Dry Type Xfmr. Visual, Mechanical, Insulation Resistance Test ATS 21',
  'liquid-filled-transformer': '2-Liquid Filled Xfmr. Visual, Mechanical, Insulation Resistance Test ATS 21',
  'oil-inspection': '2-Oil Xfmr. Inspection and Test ATS 21',
  'two-small-dry-typer-xfmr-ats-report': '2-Small Dry Typer Xfmr. Inspection and Test ATS',
  'low-voltage-cable-test-12sets': '3-Low Voltage Cable Test ATS',
  'low-voltage-cable-test-20sets': '3-Low Voltage Cable Test ATS 20 sets',
  'medium-voltage-vlf-tan-delta': '4-Medium Voltage Cable VLF Tan Delta Test ATS',
  'medium-voltage-vlf': '4-Medium Voltage Cable VLF Test ATS',
  'medium-voltage-cable-vlf-test': '4-Medium Voltage Cable VLF Test With Tan Delta ATS',
  'metal-enclosed-busway': '5-Metal Enclosed Busway ATS',
  'low-voltage-switch-multi-device-test': '6-Low Voltage Switch - Multi-Device TEST',
  'low-voltage-switch-report': '6-Low Voltage Switch ATS',
  'medium-voltage-switch-oil-report': '7-Medium Voltage Way Switch (OIL) Report ATS 21',
  'medium-voltage-switch-sf6-report': 'Medium Voltage Way Switch (SF6)',
  'potential-transformer-ats-report': 'Potential Transformer ATS',
  'low-voltage-circuit-breaker-electronic-trip-ats-secondary-injection-report': '8-Low Voltage Circuit Breaker Electronic Trip Unit ATS - Secondary Injection',
  'low-voltage-circuit-breaker-electronic-trip-ats-report': '8-Low Voltage Circuit Breaker Electronic Trip Unit ATS - Primary Injection',
  'low-voltage-circuit-breaker-thermal-magnetic-ats-report': '8-Low Voltage Circuit Breaker Thermal-Magnetic ATS',
  'low-voltage-panelboard-small-breaker-report': '8-Low Voltage Panelboard Small Breaker Test ATS (up to 60 individual breakers)',
  'medium-voltage-circuit-breaker-report': '9-Medium Voltage Circuit Breaker Test Report ATS',
  'current-transformer-test-ats-report': '12-Current Transformer Test ATS (partial, single CT)',
  '12-current-transformer-test-ats-report': '12-Current Transformer Test ATS',
  'automatic-transfer-switch-ats-report': '35-Automatic Transfer Switch ATS',
  'grounding-system-master': 'Grounding System MASTER',
  'grounding-fall-of-potential-slope-method-test': 'Grounding Fall of Potential Slope Method Test',
  // MTS Reports
  'switchgear-panelboard-mts-report': '1-Switchgear, Switchboard, Panelboard Inspection & Test Report MTS',
  'large-dry-type-transformer-mts-report': '2-Large Dry Type Xfmr. Inspection and Test MTS 23',
  'large-dry-type-xfmr-mts-report': '2-Large Dry Type Xfmr. Visual, Mechanical, Insulation Resistance Test MTS',
  'liquid-xfmr-visual-mts-report': '2-Liquid Filled Xfmr. Visual, Mechanical, Insulation Resistance Test MTS',
  'two-small-dry-typer-xfmr-mts-report': '2-Small Dry Typer Xfmr. Inspection and Test MTS',
  'low-voltage-cable-test-3sets': '3-Low Voltage Cable MTS',
  'electrical-tan-delta-test-mts-form': '4-Medium Voltage Cable VLF Tan Delta MTS',
  'medium-voltage-vlf-tan-delta-mts': '4-Medium Voltage Cable VLF Tan Delta Test MTS',
  'medium-voltage-vlf-mts-report': '4-Medium Voltage Cable VLF Test Report MTS',
  'medium-voltage-cable-vlf-test-mts': '4-Medium Voltage Cable VLF Test With Tan Delta MTS',
  'low-voltage-circuit-breaker-electronic-trip-mts-report': '8-Low Voltage Circuit Breaker Electronic Trip Unit MTS - Primary Injection',
  'low-voltage-circuit-breaker-thermal-magnetic-mts-report': '8-Low Voltage Circuit Breaker Thermal-Magnetic MTS',
  'medium-voltage-circuit-breaker-mts-report': '9-Medium Voltage Circuit Breaker Test Report MTS',
  '12-current-transformer-test-mts-report': '12-Current Transformer Test MTS',
  '13-voltage-potential-transformer-test-mts-report': '13-Voltage Potential Transformer Test MTS',
  '23-medium-voltage-motor-starter-mts-report': '23-Medium Voltage Motor Starter MTS Report',
  '23-medium-voltage-switch-mts-report': '23-Medium Voltage Switch MTS',
  '6-low-voltage-switch-maint-mts-report': '6-Low Voltage Switch Maint. MTS',
  'relay-test-report': 'Relay Test Report'
};

export const getReportName = (slug: string): string => {
  return REPORT_NAMES[slug] || slug;
};

export const getReportTable = (slug: string): string => {
  return REPORT_TABLE_MAP[slug] || 'technical_reports';
};

// List of all supported report types for the dropdown
export const ALL_REPORT_TYPES = Object.keys(REPORT_NAMES);



