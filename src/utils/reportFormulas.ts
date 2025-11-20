// Report formula calculations

export function applyReportFormulas(reportData: any): any {
  if (!reportData) return reportData;
  
  const data = { ...reportData };
  
  // Get TCF value
  const tcf = getTCFValue(data);
  
  console.log('🧮 Applying formulas with TCF:', tcf);
  console.log('📊 Data keys:', Object.keys(data));
  
  // Apply TCF corrections to test data
  if (tcf && tcf !== 1) {
    const corrected = applyTCFCorrections(data, tcf);
    console.log('✅ Formulas applied, corrected data keys:', Object.keys(corrected));
    return corrected;
  }
  
  console.log('⚠️ No TCF correction applied (TCF = 1 or invalid)');
  return data;
}

function getTCFValue(data: any): number {
  // Check various locations where TCF might be stored
  if (data.temperature?.tcf) return data.temperature.tcf;
  if (data.environmental?.tcf) return data.environmental.tcf;
  if (data.tcf) return data.tcf;
  
  // Calculate from temperature if present
  if (data.temperature?.celsius) {
    return calculateTCF(data.temperature.celsius);
  }
  if (data.environmental?.celsius) {
    return calculateTCF(data.environmental.celsius);
  }
  
  return 1; // Default TCF
}

function applyTCFCorrections(data: any, tcf: number): any {
  const corrected = { ...data };
  
  console.log('🔧 Applying TCF corrections, checking data structure...');
  
  // Look for any array fields that might be tests
  Object.keys(data).forEach(key => {
    const value = data[key];
    
    // Check if this is a test array
    if (Array.isArray(value) && value.length > 0) {
      const firstItem = value[0];
      
      // Check if it looks like test data (has numeric fields or "values" object)
      const hasNumericFields = typeof firstItem === 'object' && 
        Object.values(firstItem).some(v => !isNaN(parseFloat(String(v))));
      const hasValuesObject = typeof firstItem === 'object' && 'values' in firstItem;
      const hasTestPattern = key.toLowerCase().includes('test') || 
                            key.toLowerCase().includes('resistance') ||
                            key.toLowerCase().includes('insulation');
      
      if ((hasNumericFields || hasValuesObject) && hasTestPattern) {
        console.log(`📊 Found test array: ${key}, applying corrections...`);
        
        // Determine corrected key name
        let correctedKey = 'correctedTests';
        if (key.includes('insulation')) {
          correctedKey = 'temperatureCorrectedTests';
        } else if (key === 'tests') {
          correctedKey = 'correctedTests';
        } else {
          correctedKey = `corrected${key.charAt(0).toUpperCase()}${key.slice(1)}`;
        }
        
        // Apply corrections
        corrected[correctedKey] = value.map((test: any) => {
          if (!test || typeof test !== 'object') return test;
          
          const correctedTest: any = {};
          
          // Handle nested "values" object
          if (test.values && typeof test.values === 'object') {
            correctedTest.values = {};
            Object.entries(test.values).forEach(([vKey, vValue]) => {
              const numValue = parseFloat(String(vValue));
              if (!isNaN(numValue) && numValue !== 0) {
                correctedTest.values[vKey] = (numValue * tcf).toFixed(2);
              } else {
                correctedTest.values[vKey] = vValue;
              }
            });
            
            // Copy non-values fields
            Object.keys(test).forEach(k => {
              if (k !== 'values') {
                correctedTest[k] = test[k];
              }
            });
          } else {
            // Direct numeric fields
            Object.entries(test).forEach(([tKey, tValue]) => {
              // Skip non-numeric fields
              if (tKey.toLowerCase().includes('section') || 
                  tKey.toLowerCase().includes('voltage') || 
                  tKey.toLowerCase().includes('unit') ||
                  tKey.toLowerCase().includes('description')) {
                correctedTest[tKey] = tValue;
              } else {
                const numValue = parseFloat(String(tValue));
                if (!isNaN(numValue) && numValue !== 0) {
                  correctedTest[tKey] = (numValue * tcf).toFixed(2);
                } else {
                  correctedTest[tKey] = tValue;
                }
              }
            });
          }
          
          return correctedTest;
        });
        
        console.log(`✅ Created ${correctedKey} with ${corrected[correctedKey].length} corrected entries`);
      }
    }
  });
  
  return corrected;
}

function calculateTCF(celsius: number): number {
  // TCF table based on NETA standards (20°C reference)
  const tcfTable: { [key: number]: number } = {
    0: 0.25,
    5: 0.33,
    10: 0.45,
    15: 0.63,
    20: 1.0,   // Reference temperature
    25: 1.25,
    30: 1.66,
    35: 2.0,
    40: 2.5,
    45: 3.0,
    50: 4.0,
    55: 5.0,
    60: 6.0,
    65: 7.0,
    70: 8.5
  };
  
  // Find exact match
  if (tcfTable[celsius] !== undefined) {
    return tcfTable[celsius];
  }
  
  // Find surrounding values for interpolation
  const temps = Object.keys(tcfTable).map(Number).sort((a, b) => a - b);
  
  // Handle out of range
  if (celsius < temps[0]) return tcfTable[temps[0]];
  if (celsius > temps[temps.length - 1]) return tcfTable[temps[temps.length - 1]];
  
  // Find bounding temperatures
  let lower = temps[0];
  let upper = temps[temps.length - 1];
  
  for (let i = 0; i < temps.length - 1; i++) {
    if (celsius >= temps[i] && celsius <= temps[i + 1]) {
      lower = temps[i];
      upper = temps[i + 1];
      break;
    }
  }
  
  // Linear interpolation
  const ratio = (celsius - lower) / (upper - lower);
  const tcf = tcfTable[lower] + ratio * (tcfTable[upper] - tcfTable[lower]);
  
  return Math.round(tcf * 100) / 100;
}

// Export for use in components
export { calculateTCF };

