# Field Tech Desktop

An offline-first desktop application for field technicians built with Electron, React, TypeScript, and SQLite.

## Overview

This application enables field technicians to work seamlessly offline while in the field, with automatic bidirectional synchronization when an internet connection is available. It provides access to jobs, equipment, and report creation capabilities with full offline support.

## Features

- **Offline-First Architecture**: Full functionality without internet connection
- **Automatic Sync**: Bidirectional data synchronization when online
- **Job Management**: View and manage assigned jobs
- **Report Builder**: Create and edit reports offline
- **Network Detection**: Real-time network and API status monitoring
- **Conflict Resolution**: Smart handling of sync conflicts
- **Local SQLite Database**: Fast, reliable local data storage

## Technology Stack

- **Electron**: Cross-platform desktop framework
- **React**: UI library
- **TypeScript**: Type-safe development
- **SQLite (better-sqlite3)**: Local database
- **Vite**: Fast build tool
- **Supabase**: Backend API integration (when online)

## Project Structure

```
field-tech-desktop/
├── src/
│   ├── database/
│   │   ├── schema.sql          # Local SQLite schema
│   │   └── migrations/         # Database migrations
│   ├── services/
│   │   ├── offline-storage.ts  # Local data operations
│   │   └── sync-service.ts     # Sync logic
│   ├── components/
│   │   ├── JobList.tsx         # Job management UI
│   │   ├── ReportBuilder.tsx   # Report creation UI
│   │   └── SyncStatus.tsx      # Connection/sync indicator
│   ├── types/
│   │   ├── index.ts            # TypeScript interfaces
│   │   └── electron.d.ts       # Electron API types
│   ├── App.tsx                 # Main application component
│   └── main.tsx                # React entry point
├── electron.js                 # Electron main process
├── preload.js                  # Secure IPC bridge
└── package.json                # Dependencies and scripts
```

## Prerequisites

- Node.js 18+ and npm
- Git

## Installation

1. Clone the repository:
```bash
cd /Users/cohn/ampOS/field-tech-desktop
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables (optional):
```bash
# Create .env file with:
API_BASE_URL=https://your-api-url.com
```

## Development

Start the development server:
```bash
npm start
```

This will:
1. Start the Vite dev server on port 3000
2. Launch Electron with hot-reload enabled
3. Open DevTools automatically

## Building

### Build for current platform:
```bash
npm run build
npm run build:electron
```

### Platform-specific builds:
```bash
# macOS
npm run build:electron -- --mac

# Windows
npm run build:electron -- --win

# Linux
npm run build:electron -- --linux
```

Compiled applications will be in the `dist-electron/` directory.

## Database

### Local Database

The application uses SQLite for local data storage. The database is automatically created on first run and stored in:
- **macOS**: `~/Library/Application Support/field-tech-desktop/`
- **Windows**: `%APPDATA%/field-tech-desktop/`
- **Linux**: `~/.config/field-tech-desktop/`

### Schema

The database schema includes tables for:
- Jobs
- Reports
- Equipment
- Assets
- Users (cached)
- Customers (cached)
- Sync queue and metadata
- App settings

See `src/database/schema.sql` for the complete schema.

### Migrations

Place migration scripts in `src/database/migrations/` and they will be applied on application startup.

## Sync Strategy

### Sync Down (Before Going Offline)
- Current jobs assigned to technician
- Report templates and forms
- Equipment data and specifications
- Customer information for active jobs
- Historical reports for reference

### Sync Up (When Reconnected)
- New reports created offline
- Updated job status
- Time tracking and notes
- Photos and measurements

### Conflict Resolution
The application uses a "last write wins" strategy by default. More sophisticated conflict resolution can be implemented in the `sync-service.ts`.

## API Integration

The application expects the following API endpoints:

- `GET /health` - API health check
- `GET /api/jobs?assigned_to={userId}` - Get assigned jobs
- `GET /api/reports?job_ids={ids}` - Get reports for jobs
- `GET /api/report-templates` - Get report templates
- `GET /api/equipment` - Get equipment list
- `GET /api/customers` - Get customer list
- `POST /api/{table}` - Create record
- `PUT /api/{table}/{id}` - Update record
- `DELETE /api/{table}/{id}` - Delete record

## Configuration

Application settings can be modified through the UI or by updating the `app_settings` table in the local database:

- `sync_interval_minutes` - Auto-sync frequency (default: 15)
- `auto_sync_enabled` - Enable/disable auto-sync (default: true)
- `offline_mode` - Force offline mode (default: false)
- `api_base_url` - Backend API URL

## Development Notes

### IPC Communication

The application uses Electron's IPC for secure communication between main and renderer processes. All IPC methods are exposed through the `electronAPI` object in the renderer process (see `preload.js`).

### Adding New Features

1. Define TypeScript interfaces in `src/types/`
2. Add database schema changes to `src/database/migrations/`
3. Implement data layer in `src/services/offline-storage.ts`
4. Add sync logic in `src/services/sync-service.ts`
5. Create UI components in `src/components/`
6. Update `electron.js` if new IPC handlers are needed

## Reference Implementation

This application is based on data structures from the Active-Website-Software-master project:
- Job data models: `src/services/jobService.ts`
- Report structures: `src/lib/services/reportService.ts`
- TypeScript interfaces: `src/lib/types/`

## Troubleshooting

### Database Issues
If you encounter database errors, try deleting the local database file and restarting the application. The database will be recreated with the current schema.

### Sync Issues
- Check network connectivity with the network status indicator
- Verify API URL in settings
- Check the `sync_queue` table for failed sync operations
- Review logs for specific error messages

### Build Issues
- Clear the `dist/` and `dist-electron/` directories
- Delete `node_modules/` and reinstall with `npm install`
- Ensure all TypeScript errors are resolved

## License

[Your License Here]

## Contact

For support or questions, please contact [your contact information].

