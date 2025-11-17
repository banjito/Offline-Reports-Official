# Adapting Existing Reports for Desktop App

## Overview

You have excellent reports in `Active-Website-Software-master/src/components/reports/` like `LiquidXfmrVisualMTSReport.tsx`. Here's how to make them work offline:

## Strategy: Two Approaches

### Approach 1: Shared Components (Recommended)
Keep one report component, works in both web and desktop

### Approach 2: Separate Desktop Versions
Create simplified desktop-specific versions

## Approach 1: Shared Components

### Step 1: Extract Report to Shared Library

```bash
# In your Active-Website-Software-master
mkdir -p shared/reports
cp src/components/reports/LiquidXfmrVisualMTSReport.tsx shared/reports/
```

### Step 2: Make It Environment-Agnostic

Update the report to work with different data sources:

```typescript
// shared/reports/LiquidXfmrVisualMTSReport.tsx

interface ReportProps {
  reportId?: string;
  jobId: string;
  onSave: (data: any) => Promise<void>;  // Abstract save function
  onLoad?: (id: string) => Promise<any>; // Abstract load function
  initialData?: any;
}

export function LiquidXfmrVisualMTSReport({ 
  reportId, 
  jobId, 
  onSave,
  onLoad,
  initialData 
}: ReportProps) {
  // Same UI as before...
  // But data access is through props
}
```

### Step 3: Use in Desktop App

```typescript
// field-tech-desktop/src/components/ReportViewer.tsx
import { LiquidXfmrVisualMTSReport } from '../../../Active-Website-Software-master/shared/reports/LiquidXfmrVisualMTSReport';
import { getOfflineStorage } from '../services/offline-storage';

export function DesktopReportViewer({ reportType, jobId }: Props) {
  const storage = getOfflineStorage();
  
  const handleSave = async (data: any) => {
    const report = {
      id: crypto.randomUUID(),
      job_id: jobId,
      report_type: reportType,
      report_data: data,
      status: 'draft',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    storage.createReport(report);
  };
  
  const handleLoad = async (id: string) => {
    return storage.getReport(id);
  };
  
  return (
    <LiquidXfmrVisualMTSReport
      jobId={jobId}
      onSave={handleSave}
      onLoad={handleLoad}
    />
  );
}
```

### Step 4: Configure Module Resolution

In `field-tech-desktop/vite.config.ts`:

```typescript
export default defineConfig({
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, '../Active-Website-Software-master/shared'),
    },
  },
});
```

### Step 5: Package as npm Workspace (Optional but Better)

```json
// Root package.json (create in /Users/cohn/ampOS/)
{
  "private": true,
  "workspaces": [
    "Active-Website-Software-master",
    "field-tech-desktop",
    "shared-components"
  ]
}
```

## Approach 2: Simplified Desktop Versions

For a quicker start, create desktop-optimized versions:

### Benefits:
- ✅ Faster, lighter UI for mobile use
- ✅ Optimized for offline touch input
- ✅ No web app dependencies
- ❌ Maintain two versions

### Example: Simple Report Builder

```typescript
// field-tech-desktop/src/components/reports/TransformerInspection.tsx

export function TransformerInspection({ jobId }: { jobId: string }) {
  const [formData, setFormData] = useState({
    location: '',
    manufacturer: '',
    serialNumber: '',
    overallCondition: 'Good',
    leaksObserved: false,
    notes: '',
    photos: [] as string[],
  });
  
  const handleSave = async () => {
    const storage = getOfflineStorage();
    const report = {
      id: crypto.randomUUID(),
      job_id: jobId,
      report_type: 'transformer-inspection',
      report_data: formData,
      status: 'draft',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    storage.createReport(report);
    alert('Report saved offline!');
  };
  
  return (
    <div className="report-form">
      <h2>Transformer Inspection</h2>
      
      <section>
        <h3>Equipment Info</h3>
        <input
          type="text"
          placeholder="Location"
          value={formData.location}
          onChange={(e) => setFormData({...formData, location: e.target.value})}
        />
        {/* More fields... */}
      </section>
      
      <section>
        <h3>Visual Inspection</h3>
        <select
          value={formData.overallCondition}
          onChange={(e) => setFormData({...formData, overallCondition: e.target.value})}
        >
          <option>Good</option>
          <option>Fair</option>
          <option>Poor</option>
        </select>
        {/* More fields... */}
      </section>
      
      <button onClick={handleSave}>Save Report</button>
    </div>
  );
}
```

## Report Template System

For maximum flexibility, use a template-driven approach:

### 1. Define Template Schema

```typescript
// Store in database
const template = {
  id: 'liquid-xfmr-visual',
  name: 'Liquid Transformer Visual Inspection',
  version: 1,
  sections: [
    {
      title: 'Equipment Information',
      fields: [
        {
          name: 'location',
          label: 'Location',
          type: 'text',
          required: true,
        },
        {
          name: 'manufacturer',
          label: 'Manufacturer',
          type: 'text',
        },
        {
          name: 'condition',
          label: 'Overall Condition',
          type: 'select',
          options: ['Good', 'Fair', 'Poor'],
        },
      ],
    },
  ],
};
```

### 2. Dynamic Form Renderer

```typescript
// field-tech-desktop/src/components/DynamicReport.tsx

export function DynamicReport({ template, jobId }: Props) {
  const [formData, setFormData] = useState({});
  
  const renderField = (field: TemplateField) => {
    switch (field.type) {
      case 'text':
        return (
          <input
            type="text"
            value={formData[field.name] || ''}
            onChange={(e) => setFormData({
              ...formData,
              [field.name]: e.target.value
            })}
          />
        );
      case 'select':
        return (
          <select
            value={formData[field.name] || ''}
            onChange={(e) => setFormData({
              ...formData,
              [field.name]: e.target.value
            })}
          >
            {field.options?.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        );
      // More field types...
    }
  };
  
  return (
    <div>
      {template.sections.map(section => (
        <section key={section.title}>
          <h3>{section.title}</h3>
          {section.fields.map(field => (
            <div key={field.name}>
              <label>{field.label}</label>
              {renderField(field)}
            </div>
          ))}
        </section>
      ))}
    </div>
  );
}
```

## Migration Plan

### Phase 1: Start Simple (Week 1)
1. Create 2-3 simple report forms manually
2. Test offline save/sync workflow
3. Get tech feedback

### Phase 2: Template System (Week 2-3)
1. Build dynamic form renderer
2. Convert 1-2 reports to templates
3. Store templates in database

### Phase 3: Full Integration (Week 4+)
1. Extract web reports to shared library
2. Update web app to use shared components
3. Desktop app imports same components
4. Single codebase for all reports

## Example: Converting Your Liquid Transformer Report

Your current report has ~1900 lines. Here's a simplified version for desktop:

```typescript
// Desktop version - essentials only
interface LiquidXfmrData {
  // Equipment (lines 100-200 of original)
  location: string;
  manufacturer: string;
  serialNumber: string;
  
  // Inspection (lines 500-800 of original)
  tankCondition: 'Good' | 'Fair' | 'Poor';
  leaksObserved: boolean;
  oilLevel: string;
  
  // Tests (lines 1000-1500 of original)  
  insulationResistance: number;
  windingResistance: number;
  turnsRatio: string;
  
  // Simplified - add details later
  notes: string;
  photos: string[];
}
```

Full report stays in web app for detailed viewing/editing.
Desktop version focuses on field data capture.

## Recommended Approach

**For MVP (Next 2 weeks):**
- Use Approach 2 (Simplified versions)
- Build 3-5 most common reports
- Focus on offline reliability

**For Long Term (Month 2+):**
- Migrate to Approach 1 (Shared components)
- Build template system
- Support all report types

## Next Steps

1. Pick your 3 most-used report types
2. Create simplified versions in desktop app
3. Test end-to-end: capture → save → sync → view in web app
4. Iterate based on field tech feedback

Questions? Check `INTEGRATION_GUIDE.md` for backend setup!

