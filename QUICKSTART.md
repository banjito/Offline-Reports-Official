# Quick Start Guide

## ✅ Installation Complete!

All dependencies are now installed and ready to use.

## Next Steps

### 1. Start Development Mode

```bash
npm start
```

This will:
- Start Vite dev server on http://localhost:3000
- Launch the Electron app with hot-reload
- Open DevTools automatically

**Note:** The first time you run this, it may take a few seconds to start both servers.

### 2. What You'll See

- A desktop window with "Field Tech Desktop" header
- Network status indicators (online/offline)
- Sync button
- Job list (empty initially, as database is fresh)

### 3. Test the App

Since this is a fresh install with no data:

**Option A - Quick UI Test:**
- Look at the network status - should show "Network" and "API Unavailable" (since no backend is running)
- Try clicking the Sync button (will fail gracefully)
- See the empty job list

**Option B - Add Test Data:**
1. Open DevTools (⌘+Option+I on Mac)
2. In the Console, run:
```javascript
// Add a test job
window.electronAPI.dbQuery('jobs', 'upsertJob', {
  id: '123',
  job_number: 'TEST-001',
  title: 'Test Installation Job',
  status: 'pending',
  priority: 'high',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
})
```

## Development Workflow

### File Locations

- **React Components**: `src/components/`
- **Database**: `src/database/schema.sql`
- **Services**: `src/services/`
- **Types**: `src/types/`
- **Electron Main**: `electron.js`

### Hot Reload

Changes to React components will hot-reload automatically.
Changes to `electron.js` require restarting the app (Ctrl+C and `npm start` again).

### Database Location

Your local SQLite database will be created at:
- **macOS**: `~/Library/Application Support/field-tech-desktop/field-tech.db`

You can inspect it with any SQLite browser tool.

## Connect to Your Backend

### Update API URL

The app is configured to sync with a backend API. To connect it:

1. Set your API URL:
   - Create a `.env` file in the project root
   - Add: `API_BASE_URL=https://your-api-url.com`
   - Or set it through the app settings (once UI is built)

2. The app expects these endpoints:
   - `GET /health` - Health check
   - `GET /api/jobs?assigned_to={userId}` - Get jobs
   - `POST /api/reports` - Upload reports
   - etc. (see README.md for full list)

## Build for Production

### Test the Production Build

```bash
npm run build
npm run build:electron
```

The app will be in `dist-electron/` directory.

### Platform-Specific Builds

```bash
# macOS
npm run build:electron -- --mac

# Windows (from Mac requires wine)
npm run build:electron -- --win

# Linux
npm run build:electron -- --linux
```

## Common Issues

### "Cannot connect to API"
- Normal! No backend is running yet
- App still works offline
- Set up backend endpoint when ready

### Database errors
- Delete the database file (see location above)
- Restart the app - it will recreate

### Changes not appearing
- React changes should hot-reload
- Electron changes need app restart
- Clear npm cache: `npm cache clean --force`

## Warnings to Ignore

The following npm warnings are expected and safe:
- ✅ `deprecated eslint@8` - Will upgrade later
- ✅ `deprecated inflight` - Used by dependencies
- ✅ `3 moderate vulnerabilities` - Not critical for development

## Next Development Tasks

See `PROJECT_SUMMARY.md` for:
- Architecture overview
- Feature roadmap
- Integration points
- Testing strategy

## Need Help?

1. Check `README.md` for detailed documentation
2. Check `PROJECT_SUMMARY.md` for architecture details
3. Review code comments in key files:
   - `electron.js` - Main process
   - `src/services/offline-storage.ts` - Database operations
   - `src/services/sync-service.ts` - Sync logic

---

🚀 **Ready to go!** Run `npm start` and start building!

