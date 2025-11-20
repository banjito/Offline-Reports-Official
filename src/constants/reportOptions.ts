// Standard dropdown options for report fields
// Synced from web app standardReportStructure.ts

export const STANDARD_DROPDOWN_OPTIONS = {
  visualInspectionResults: [
    "Select One",
    "Satisfactory", 
    "Unsatisfactory",
    "Cleaned",
    "Repaired",
    "Adjusted",
    "See Comments",
    "Not Applicable",
    "N/A",
    // Legacy options for compatibility
    "Y",
    "N",
    "Yes",
    "No",
  ],
  
  insulationResistanceUnits: [
    { symbol: "kΩ", name: "Kilo-Ohms" },
    { symbol: "MΩ", name: "Mega-Ohms" },
    { symbol: "GΩ", name: "Giga-Ohms" }
  ],
  
  contactResistanceUnits: [
    { symbol: "µΩ", name: "Micro-Ohms" },
    { symbol: "mΩ", name: "Milli-Ohms" },
    { symbol: "Ω", name: "Ohms" }
  ],
  
  testVoltages: [
    "250V",
    "500V", 
    "1000V",
    "2500V",
    "5000V",
    "Other"
  ],
  
  passFailResults: [
    "PASS",
    "FAIL",
    "LIMITED SERVICE",
    "N/A"
  ],
  
  connectionTypes: [
    "Delta",
    "Wye", 
    "Single Phase"
  ],
  
  windingMaterials: [
    "Aluminum",
    "Copper"
  ],
  
  voltageUnits: [
    { symbol: "V", name: "Volts" },
    { symbol: "kV", name: "Kilovolts" },
    { symbol: "MV", name: "Megavolts" }
  ],
  
  currentUnits: [
    { symbol: "A", name: "Amps" },
    { symbol: "kA", name: "Kiloamps" }
  ],
  
  resistanceUnits: [
    { symbol: "Ω", name: "Ohms" },
    { symbol: "kΩ", name: "Kilo-Ohms" },
    { symbol: "MΩ", name: "Mega-Ohms" },
    { symbol: "GΩ", name: "Giga-Ohms" }
  ],
  
  powerUnits: [
    { symbol: "W", name: "Watts" },
    { symbol: "kW", name: "Kilowatts" },
    { symbol: "MW", name: "Megawatts" },
    { symbol: "VA", name: "Volt-Amperes" },
    { symbol: "kVA", name: "Kilovolt-Amperes" },
    { symbol: "MVA", name: "Megavolt-Amperes" }
  ],
  
  frequencyUnits: [
    { symbol: "Hz", name: "Hertz" },
    { symbol: "kHz", name: "Kilohertz" }
  ],
  
  temperatureUnits: [
    { symbol: "°C", name: "Celsius" },
    { symbol: "°F", name: "Fahrenheit" }
  ],
  
  dielectricUnits: [
    { symbol: "µA", name: "Microamperes" },
    { symbol: "mA", name: "Milliamperes" },
    { symbol: "A", name: "Amperes" }
  ],
  
  timeUnits: [
    { symbol: "s", name: "Seconds" },
    { symbol: "min.", name: "Minutes" },
    { symbol: "hr", name: "Hours" }
  ],
  
  distanceUnits: [
    { symbol: "ft", name: "Feet" },
    { symbol: "m", name: "Meters" },
    { symbol: "in", name: "Inches" },
    { symbol: "cm", name: "Centimeters" }
  ]
} as const;

// Helper functions to detect field types and appropriate dropdowns
export function getDropdownOptionsForField(fieldName: string, fieldConfig?: any): string[] | null {
  const lowerName = fieldName.toLowerCase();
  
  // Check for custom options in field config first
  if (fieldConfig?.options && Array.isArray(fieldConfig.options)) {
    return fieldConfig.options.map((opt: any) => typeof opt === 'string' ? opt : opt.label || opt.value);
  }
  
  // Visual inspection fields
  if (lowerName.includes('result') || lowerName.includes('inspection') || lowerName.includes('condition')) {
    return STANDARD_DROPDOWN_OPTIONS.visualInspectionResults;
  }
  
  // Pass/Fail fields
  if (lowerName.includes('pass') || lowerName.includes('fail') || lowerName.includes('status') && fieldConfig?.type !== 'text') {
    return STANDARD_DROPDOWN_OPTIONS.passFailResults;
  }
  
  // Test voltage fields (including dielectric test voltage)
  if (lowerName.includes('voltage') && (lowerName.includes('test') || lowerName.includes('dielectric'))) {
    return STANDARD_DROPDOWN_OPTIONS.testVoltages;
  }
  
  // Connection type
  if (lowerName.includes('connection') || (lowerName.includes('phase') && lowerName.includes('config'))) {
    return STANDARD_DROPDOWN_OPTIONS.connectionTypes;
  }
  
  // Winding material
  if (lowerName.includes('winding') && lowerName.includes('material')) {
    return STANDARD_DROPDOWN_OPTIONS.windingMaterials;
  }
  
  return null;
}

export function getUnitOptionsForField(fieldName: string, fieldConfig?: any): Array<{symbol: string, name: string}> | null {
  const lowerName = fieldName.toLowerCase();
  
  // Check explicit unit options in field config first
  if (fieldConfig?.unitOptions) {
    return fieldConfig.unitOptions;
  }
  
  // Insulation resistance
  if (lowerName.includes('insulation') && (lowerName.includes('resistance') || lowerName.includes('unit'))) {
    return STANDARD_DROPDOWN_OPTIONS.insulationResistanceUnits;
  }
  
  // Contact resistance
  if (lowerName.includes('contact') && (lowerName.includes('resistance') || lowerName.includes('unit'))) {
    return STANDARD_DROPDOWN_OPTIONS.contactResistanceUnits;
  }
  
  // General resistance
  if (lowerName.includes('resistance') && lowerName.includes('unit')) {
    return STANDARD_DROPDOWN_OPTIONS.resistanceUnits;
  }
  
  // Voltage
  if (lowerName.includes('voltage') && lowerName.includes('unit')) {
    return STANDARD_DROPDOWN_OPTIONS.voltageUnits;
  }
  
  // Current
  if (lowerName.includes('current') && lowerName.includes('unit')) {
    return STANDARD_DROPDOWN_OPTIONS.currentUnits;
  }
  
  // Power
  if (lowerName.includes('power') && lowerName.includes('unit')) {
    return STANDARD_DROPDOWN_OPTIONS.powerUnits;
  }
  
  // Frequency
  if (lowerName.includes('frequency') && lowerName.includes('unit')) {
    return STANDARD_DROPDOWN_OPTIONS.frequencyUnits;
  }
  
  // Temperature
  if (lowerName.includes('temperature') && lowerName.includes('unit')) {
    return STANDARD_DROPDOWN_OPTIONS.temperatureUnits;
  }
  
  // Dielectric
  if (lowerName.includes('dielectric') && lowerName.includes('unit')) {
    return STANDARD_DROPDOWN_OPTIONS.dielectricUnits;
  }
  
  // Time/Duration
  if ((lowerName.includes('time') || lowerName.includes('duration')) && lowerName.includes('unit')) {
    return STANDARD_DROPDOWN_OPTIONS.timeUnits;
  }
  
  // Distance/Length
  if ((lowerName.includes('distance') || lowerName.includes('length')) && lowerName.includes('unit')) {
    return STANDARD_DROPDOWN_OPTIONS.distanceUnits;
  }
  
  return null;
}

