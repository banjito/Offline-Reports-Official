# Backend Integration Guide

## Connect to Your Supabase Database

### Step 1: Update API Configuration

Create a `.env` file in the project root:

```bash
# API Configuration
VITE_API_BASE_URL=https://your-project.supabase.co
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### Step 2: Add API Endpoints to Backend

The desktop app needs these endpoints (add to your Active-Website-Software backend):

#### 1. Health Check
```typescript
// GET /api/health
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
```

#### 2. Get Assigned Jobs
```typescript
// GET /api/jobs?assigned_to={userId}
router.get('/api/jobs', async (req, res) => {
  const { assigned_to } = req.query;
  
  const { data, error } = await supabase
    .schema('neta_ops')
    .from('jobs')
    .select(`
      *,
      customer:customer_id (
        id,
        name,
        company_name,
        email,
        phone,
        address
      )
    `)
    .eq('assigned_to', assigned_to);
    
  if (error) return res.status(500).json({ error: error.message });
  
  // Flatten customer data for offline storage
  const jobs = data.map(job => ({
    ...job,
    customer_name: job.customer?.name,
    customer_company: job.customer?.company_name,
    customer_email: job.customer?.email,
    customer_phone: job.customer?.phone,
    customer_address: job.customer?.address,
  }));
  
  res.json(jobs);
});
```

#### 3. Batch Upload Reports
```typescript
// POST /api/reports/batch
router.post('/api/reports/batch', async (req, res) => {
  const { reports } = req.body;
  
  const { data, error } = await supabase
    .schema('neta_ops')
    .from('technical_reports')
    .insert(reports)
    .select();
    
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true, uploaded: data.length });
});
```

#### 4. Get Report Templates
```typescript
// GET /api/report-templates
router.get('/api/report-templates', async (req, res) => {
  const { data, error } = await supabase
    .schema('neta_ops')
    .from('report_templates')
    .select('*')
    .eq('is_active', true);
    
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});
```

### Step 3: Update Sync Service

Edit `src/services/sync-service.ts`:

```typescript
// Update the constructor
constructor(apiBaseUrl?: string) {
  const settings = this.storage.getSettings();
  this.apiBaseUrl = apiBaseUrl || 
                     import.meta.env.VITE_API_BASE_URL || 
                     settings.api_base_url || 
                     '';
}
```

### Step 4: Add Authentication

#### Option A: Use Existing Supabase Auth

Create `src/services/auth-service.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  if (error) throw error;
  
  // Store user ID in settings
  const storage = getOfflineStorage();
  storage.updateSetting('current_user_id', data.user.id);
  
  return data;
}

export async function signOut() {
  await supabase.auth.signOut();
  const storage = getOfflineStorage();
  storage.updateSetting('current_user_id', null);
}

export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}
```

Add login UI:

```typescript
// src/components/Login.tsx
import { useState } from 'react';
import { signIn } from '../services/auth-service';

export function Login({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await signIn(email, password);
      onLogin();
    } catch (error) {
      alert('Login failed: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <form onSubmit={handleSubmit}>
        <h2>Field Tech Login</h2>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </div>
  );
}
```

### Step 5: Test the Integration

1. **Start your backend**: Make sure Active-Website-Software is running
2. **Set environment variables**: Update `.env` with correct values
3. **Login**: Use existing user credentials
4. **Trigger sync**: Click sync button - should download assigned jobs
5. **Go offline**: Disable wifi
6. **Work offline**: Create reports, update job status
7. **Go online**: Enable wifi and sync - changes upload

### Step 6: Report Templates

Your existing reports (like `LiquidXfmrVisualMTSReport.tsx`) need to be converted:

1. Extract the form schema/structure
2. Store in `report_templates` table
3. Desktop app renders forms dynamically
4. Or: Embed simplified versions directly in desktop app

Example template schema:
```json
{
  "type": "liquid-transformer-visual",
  "sections": [
    {
      "title": "General Information",
      "fields": [
        { "name": "location", "type": "text", "required": true },
        { "name": "manufacturer", "type": "text" },
        { "name": "serialNumber", "type": "text" }
      ]
    },
    {
      "title": "Visual Inspection",
      "fields": [
        { "name": "overallCondition", "type": "select", "options": ["Good", "Fair", "Poor"] },
        { "name": "leaksObserved", "type": "boolean" }
      ]
    }
  ]
}
```

## Testing Checklist

- [ ] Can login with existing credentials
- [ ] Sync downloads jobs assigned to logged-in user
- [ ] Jobs display with correct customer info
- [ ] Can create new report while offline
- [ ] Report saves locally with dirty flag
- [ ] Going back online shows sync indicator
- [ ] Sync uploads new reports to Supabase
- [ ] Reports appear in web app after sync
- [ ] Sync handles errors gracefully
- [ ] Can work for hours offline without issues

## Common Issues

### "API not reachable"
- Check backend is running
- Verify `VITE_API_BASE_URL` is correct
- Check CORS settings allow Electron

### "Authentication failed"
- User must exist in Supabase
- Check email/password are correct
- Verify Supabase keys are correct

### "Sync fails silently"
- Check browser console for errors
- Look at sync_queue table
- Check retry_count on failed items

## Next: Advanced Features

Once basic sync works:

1. **Offline Photos**: Queue photos for upload
2. **Conflict Resolution UI**: Show user conflicts to resolve manually
3. **Background Sync**: Sync automatically when connection detected
4. **Push Notifications**: Alert when new jobs assigned
5. **Report Preview**: PDF preview before submitting

See `PROJECT_SUMMARY.md` for full feature roadmap.

