# Report Sync Guide: Desktop ↔ Web App Alignment

This document explains how to properly align desktop report components with the web app's data structure to ensure seamless synchronization.

## The Problem

The desktop app's report components were using **different data structures** than what the web app stores in Supabase. This caused:
- Data not displaying after sync
- Missing fields and tables
- Incorrect field mappings

## The Solution Process

### Step 1: Identify the Web App Report Component

Find the corresponding report in `Active-Website-Software-master/src/components/reports/`:

```
Example: 13-VoltagePotentialTransformerTestMTSReport.tsx
```

### Step 2: Analyze the FormData Interface

Look for the `FormData` interface in the web app component. This defines the **exact structure** that gets saved to Supabase:

```typescript
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
    manufacturer: string;
    catalogNumber: string;
    // ... etc
  };
  visualMechanicalInspection: Array<{ netaSection: string; description: string; result: string }>;
  // ... etc
}
```

### Step 3: Match the Desktop Component's State

Update the desktop component to use the **exact same** interface and field names:

**❌ WRONG (Desktop using different structure):**
```typescript
const [ptData, setPTData] = useState<PTData[]>([...]);  // Different!
const [visualInspection, setVisualInspection] = useState([...]); // Different!
```

**✅ CORRECT (Desktop matching web app):**
```typescript
const [formData, setFormData] = useState<FormData>({
  visualMechanicalInspection: [...],  // Same as web!
  deviceData: {...},                   // Same as web!
  insulationResistance: [...],         // Same as web!
});
```

### Step 4: Match Initial Data Arrays

Copy the exact initial values from the web app:

**Web App:**
```typescript
const initialVisualInspectionItems = [
  { netaSection: '7.10.2.1', description: 'Inspect physical and mechanical condition.', result: 'Select One' },
  { netaSection: '7.10.2.3', description: 'Clean the unit.', result: 'Select One' },
  // ...
];
```

**Desktop (must match exactly):**
```typescript
const INITIAL_VISUAL_INSPECTION_ITEMS = [
  { netaSection: '7.10.2.1', description: 'Inspect physical and mechanical condition.', result: 'Select One' },
  { netaSection: '7.10.2.3', description: 'Clean the unit.', result: 'Select One' },
  // ...
];
```

### Step 5: Match UI Sections

Ensure the desktop component has the **same sections** as the web app:
- Job Information
- Device Data
- Visual and Mechanical Inspection
- Fuse Data (if applicable)
- Electrical Tests - Fuse Resistance
- Electrical Tests - Insulation Resistance & Ratio
- Test Equipment Used
- Comments

### Step 6: Match Table Structures

If the web app has side-by-side tables (like Insulation Resistance + Temperature Corrected), the desktop must too:

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
  {/* Insulation Resistance Table */}
  <div>
    <h3>Insulation Resistance</h3>
    <table>...</table>
  </div>
  
  {/* Temperature Corrected Table */}
  <div>
    <h3>Temperature Corrected</h3>
    <table>...</table>
  </div>
</div>
```

### Step 7: Preserve Calculations

Copy calculation logic from web app (TCF, pass/fail, ratios, etc.):

```typescript
const calculatePassFail = (deviation: number, revenueMetering: boolean): string => {
  if (isNaN(deviation)) return '';
  const tolerance = revenueMetering ? 0.501 : 1.201;
  return (deviation > -tolerance && deviation < tolerance) ? 'Pass' : 'Fail';
};
```

## Key Field Mappings Reference

| Web App Field | Desktop Field | Notes |
|--------------|---------------|-------|
| `customerName` | `customerName` | Must match exactly |
| `visualMechanicalInspection` | `visualMechanicalInspection` | Array of {netaSection, description, result} |
| `deviceData` | `deviceData` | Object with manufacturer, catalogNumber, etc. |
| `insulationResistance` | `insulationResistance` | Array with windingTested, testVoltage, results, units |
| `testEquipmentUsed` | `testEquipmentUsed` | Object with equipment names as keys |
| `turnsRatioTest` | `turnsRatioTest` | Array with tap, primaryVoltage, calculatedRatio, etc. |

## Checklist for Each Report

- [ ] Find web app component in `Active-Website-Software-master/src/components/reports/`
- [ ] Copy the `FormData` interface exactly
- [ ] Copy initial data arrays (visual inspection items, etc.)
- [ ] Match all section titles
- [ ] Match table structures (single vs side-by-side)
- [ ] Copy calculation functions (TCF, pass/fail, etc.)
- [ ] Update the report registry to use the new component
- [ ] Test sync FROM DB
- [ ] Verify all data displays correctly

## Reports Fixed

| Report | Status | Notes |
|--------|--------|-------|
| 13-Voltage Potential Transformer Test MTS | ✅ Fixed | Created `VoltagePotentialTransformerMTSReport.tsx` |
| Switchgear Report | ⏳ Pending | Next to fix |
| Panelboard Report | ⏳ Pending | |
| Low Voltage Switch Multi Device | ⏳ Pending | |
| Dry Type Transformer | ⏳ Pending | |
| Current Transformer | ⏳ Pending | |
| Medium Voltage Circuit Breaker | ⏳ Pending | |
| ... | | |

## Common Issues

1. **Data not showing**: Field names don't match between web app and desktop
2. **Missing sections**: Desktop component doesn't have all the sections from web app
3. **Wrong table layout**: Web app has side-by-side tables, desktop has single table
4. **Calculations not working**: Calculation logic not copied from web app
5. **Dropdown options different**: Option arrays don't match web app

