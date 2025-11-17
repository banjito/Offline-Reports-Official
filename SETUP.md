# Field Tech Desktop - Setup Guide

## Connecting to Your Supabase Database

The desktop app connects to the same Supabase database as your web app to sync jobs and reports for offline use.

### 1. Create Environment File

In the `field-tech-desktop/` directory, create a `.env` file:

```bash
# In the field-tech-desktop directory
touch .env
```

### 2. Add Your Supabase Credentials

Open `.env` and add your Supabase credentials (same ones you use in the web app):

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
```

**Where to find these:**
- Go to your Supabase project dashboard
- Click on "Settings" → "API"
- Copy the "Project URL" (SUPABASE_URL)
- Copy the "anon" key under "Project API keys" (SUPABASE_ANON_KEY)

### 3. Start the App

```bash
npm start
```

### 4. Sync Your Data

Once the app is running:

1. Click the **"Sync"** button in the top-right corner
2. Wait for the sync to complete
3. Your jobs from the web app will now be available offline!

## How Syncing Works

### Sync Down (From Web App → Desktop)
- **Jobs**: All jobs assigned to you (or all jobs if no user filter)
- **Reports**: Technical reports linked to those jobs
- **Data is stored locally** in SQLite for offline access

### Sync Up (From Desktop → Web App)
*Coming soon:* Changes made offline will sync back to Supabase when you reconnect

## Troubleshooting

### "Sync service not initialized" Error
- Make sure you created the `.env` file in the correct directory (`field-tech-desktop/`)
- Check that `SUPABASE_URL` and `SUPABASE_ANON_KEY` are spelled correctly
- Restart the app after creating/editing `.env`

### "Failed to fetch jobs" Error
- Check your internet connection
- Verify your Supabase credentials are correct
- Make sure your Supabase project is running

### Database Schema Errors
- The desktop app expects your web app's `neta_ops` schema
- Jobs are synced from `neta_ops.jobs` table
- Reports are synced from `neta_ops.technical_reports` table

## Data Structure

The desktop app syncs the following fields from your web app:

**Jobs (`neta_ops.jobs`)**:
- id, job_number, title, description
- status, division, location, address
- start_date, due_date, completed_date
- budget, priority
- customer info (name, company, email, phone, address)
- assigned_to, notes
- timestamps (created_at, updated_at)

**Technical Reports (`neta_ops.technical_reports`)**:
- id, job_id, title, report_type
- status, report_data (JSONB)
- submitted_by, submitted_at
- review info (reviewed_by, reviewed_at, review_comments)
- version control (current_version, revision_history)
- timestamps (created_at, updated_at, approved_at, issued_at, sent_at)

## Next Steps

After syncing your data:
1. ✅ Click "Open Job" on any job to view details
2. ✅ View and edit reports offline
3. ✅ Create new reports while offline
4. ✅ Sync changes back when you reconnect (coming soon)

## Development

### Mock Data vs Real Data
- **Mock Data**: Sample data for testing the UI (doesn't require Supabase)
- **Real Data**: Actual jobs and reports from your Supabase database
- Once you sync real data, the mock data button will be hidden

### Database Location
Local SQLite database is stored in:
- **macOS**: `~/Library/Application Support/field-tech-desktop/field-tech.db`
- **Windows**: `%APPDATA%/field-tech-desktop/field-tech.db`
- **Linux**: `~/.config/field-tech-desktop/field-tech.db`

