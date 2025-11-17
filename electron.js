const { app, BrowserWindow, ipcMain, net } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
const Database = require('better-sqlite3');
const fs = require('fs');

// Load environment variables from .env file
// Try multiple possible locations
const possibleEnvPaths = [
  path.join(__dirname, '.env'),
  path.join(process.cwd(), '.env'),
  '/Users/cohn/ampOS/field-tech-desktop/.env', // Absolute path as fallback
];

console.log('=== Loading Environment Variables ===');
console.log('Current directory:', process.cwd());
console.log('__dirname:', __dirname);

let envLoaded = false;
for (const envPath of possibleEnvPaths) {
  console.log('Checking:', envPath);
  if (fs.existsSync(envPath)) {
    console.log('✅ Found .env at:', envPath);
    const result = require('dotenv').config({ path: envPath });
    if (result.error) {
      console.error('Error loading .env:', result.error);
    } else {
      console.log('✅ Loaded', Object.keys(result.parsed || {}).length, 'variables');
      envLoaded = true;
    }
    break;
  } else {
    console.log('❌ Not found');
  }
}

if (!envLoaded) {
  console.error('⚠️  No .env file found in any location!');
}

// Log environment status (without exposing secrets)
console.log('\n=== Environment Variables Status ===');
console.log('SUPABASE_URL exists:', !!process.env.SUPABASE_URL);
console.log('SUPABASE_ANON_KEY exists:', !!process.env.SUPABASE_ANON_KEY);
if (process.env.SUPABASE_URL) {
  console.log('SUPABASE_URL preview:', process.env.SUPABASE_URL.substring(0, 30) + '...');
}
console.log('====================================');

// Store reference to main window
let mainWindow;
let networkCheckInterval;
let db;

/**
 * Initialize the database
 */
function initializeDatabase() {
  try {
    const userDataPath = app.getPath('userData');
    const dbPath = path.join(userDataPath, 'field-tech.db');
    
    console.log('=== DATABASE INITIALIZATION ===');
    console.log('User data path:', userDataPath);
    console.log('Database path:', dbPath);
    console.log('Working directory:', __dirname);
    
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    console.log('Database connection established');
    
    // Read and execute schema
    const schemaPath = path.join(__dirname, 'src/database/schema.sql');
    console.log('Looking for schema at:', schemaPath);
    console.log('Schema exists:', fs.existsSync(schemaPath));
    
    if (fs.existsSync(schemaPath)) {
      const schema = fs.readFileSync(schemaPath, 'utf-8');
      console.log('Schema file loaded, length:', schema.length);
      db.exec(schema);
      console.log('✅ Database schema initialized successfully');
      
      // Verify tables were created
      const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
      console.log('Tables created:', tables.map(t => t.name).join(', '));
    } else {
      console.error('❌ Schema file not found at:', schemaPath);
      console.log('Files in src/database:', fs.existsSync(path.join(__dirname, 'src/database')) 
        ? fs.readdirSync(path.join(__dirname, 'src/database'))
        : 'directory not found');
    }
    
    console.log('=== DATABASE READY ===');
  } catch (error) {
    console.error('❌ Failed to initialize database:', error);
    console.error('Error stack:', error.stack);
    throw error; // Re-throw so we know initialization failed
  }
}

/**
 * Create the main application window
 */
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js'),
    },
    icon: path.join(__dirname, 'public/ampOS-logo.png'),
    title: 'Field Tech Desktop',
    backgroundColor: '#1a1a1a',
  });

  // Load the app
  // For testing, you can temporarily load test-supabase-config.html
  // const startUrl = `file://${path.join(__dirname, 'test-supabase-config.html')}`;
  const startUrl = isDev
    ? 'http://localhost:3000'
    : `file://${path.join(__dirname, 'dist/index.html')}`;

  mainWindow.loadURL(startUrl);

  // Open DevTools in development
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Start network monitoring
  startNetworkMonitoring();
}

/**
 * Network monitoring
 * Checks both OS network status and API reachability
 */
function startNetworkMonitoring() {
  // Check network status immediately
  checkNetworkStatus();

  // Check every 30 seconds
  networkCheckInterval = setInterval(() => {
    checkNetworkStatus();
  }, 30000);
}

/**
 * Check network status
 */
function checkNetworkStatus() {
  const online = net.isOnline();
  
  // Send status to renderer
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('network-status-changed', {
      online,
      timestamp: new Date().toISOString(),
    });
  }

  // If online, check API reachability
  if (online) {
    checkApiReachability();
  }
}

/**
 * Check if API is reachable
 */
async function checkApiReachability() {
  try {
    // Get API URL from settings
    // This would normally be stored in electron-store or similar
    const apiUrl = process.env.API_BASE_URL || 'http://localhost:8000';
    
    const request = net.request({
      method: 'GET',
      url: `${apiUrl}/health`,
      timeout: 5000,
    });

    request.on('response', (response) => {
      const apiReachable = response.statusCode === 200;
      
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('api-status-changed', {
          reachable: apiReachable,
          timestamp: new Date().toISOString(),
        });
      }
    });

    request.on('error', (error) => {
      console.error('API health check failed:', error);
      
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('api-status-changed', {
          reachable: false,
          timestamp: new Date().toISOString(),
          error: error.message,
        });
      }
    });

    request.end();
  } catch (error) {
    console.error('API reachability check failed:', error);
  }
}

/**
 * Stop network monitoring
 */
function stopNetworkMonitoring() {
  if (networkCheckInterval) {
    clearInterval(networkCheckInterval);
    networkCheckInterval = null;
  }
}

// ============================================================================
// IPC Handlers
// ============================================================================

/**
 * Handle manual network check request
 */
ipcMain.handle('check-network', async () => {
  return {
    online: net.isOnline(),
    timestamp: new Date().toISOString(),
  };
});

/**
 * Handle manual sync request
 */
ipcMain.handle('trigger-sync', async () => {
  try {
    // This would trigger the sync service
    // For now, just acknowledge the request
    console.log('Manual sync triggered');
    return { success: true, message: 'Sync started' };
  } catch (error) {
    console.error('Sync failed:', error);
    return { 
      success: false, 
      message: error.message || 'Sync failed' 
    };
  }
});

/**
 * Handle database query requests
 */
ipcMain.handle('db-query', async (event, { table, method, params }) => {
  try {
    if (!db) {
      throw new Error('Database not initialized');
    }
    
    console.log(`DB Query: ${table}.${method}`, params);
    
    if (table === 'jobs') {
      if (method === 'getAll' || method === 'getJobs') {
        const stmt = db.prepare('SELECT * FROM jobs ORDER BY created_at DESC');
        const data = stmt.all();
        return { success: true, data };
      } else if (method === 'deleteAll') {
        console.log('🗑️  Deleting all jobs from local database...');
        const stmt = db.prepare('DELETE FROM jobs');
        const info = stmt.run();
        console.log(`✅ Deleted ${info.changes} jobs`);
        return { success: true, deletedCount: info.changes };
      } else if (method === 'upsertJob') {
        const job = params;
        console.log('Upserting job:', job.job_number, job.title);
        
        try {
          // Convert boolean values to 0/1 for SQLite
          const jobData = {
            ...job,
            is_dirty: job.is_dirty ? 1 : 0
          };
          
          const stmt = db.prepare(`
            INSERT INTO jobs (
              id, job_number, title, description, status, division, location, 
              address, start_date, due_date, completed_date, budget, priority,
              customer_id, customer_name, customer_company, customer_email,
              customer_phone, customer_address, assigned_to, notes,
              is_dirty, last_sync_at, created_at, updated_at
            ) VALUES (
              @id, @job_number, @title, @description, @status, @division, @location,
              @address, @start_date, @due_date, @completed_date, @budget, @priority,
              @customer_id, @customer_name, @customer_company, @customer_email,
              @customer_phone, @customer_address, @assigned_to, @notes,
              @is_dirty, @last_sync_at, @created_at, @updated_at
            )
            ON CONFLICT(id) DO UPDATE SET
              job_number = excluded.job_number,
              title = excluded.title,
              description = excluded.description,
              status = excluded.status,
              division = excluded.division,
              location = excluded.location,
              address = excluded.address,
              start_date = excluded.start_date,
              due_date = excluded.due_date,
              completed_date = excluded.completed_date,
              budget = excluded.budget,
              priority = excluded.priority,
              customer_id = excluded.customer_id,
              customer_name = excluded.customer_name,
              customer_company = excluded.customer_company,
              customer_email = excluded.customer_email,
              customer_phone = excluded.customer_phone,
              customer_address = excluded.customer_address,
              assigned_to = excluded.assigned_to,
              notes = excluded.notes,
              updated_at = excluded.updated_at
          `);
          
          const info = stmt.run(jobData);
          console.log('Insert successful. Changes:', info.changes);
          return { success: true };
        } catch (err) {
          console.error('Error upserting job:', err);
          throw err;
        }
      }
    } else if (table === 'assets') {
      if (method === 'deleteAll') {
        console.log('🗑️  Deleting all assets from local database...');
        const stmt = db.prepare('DELETE FROM assets');
        const info = stmt.run();
        console.log(`✅ Deleted ${info.changes} assets`);
        return { success: true, deletedCount: info.changes };
      } else if (method === 'upsertAsset') {
        const asset = params;
        console.log('Upserting asset:', asset.name);
        
        try {
          const stmt = db.prepare(`
            INSERT INTO assets (
              id, name, file_url, status, approved_at, sent_at, created_at
            ) VALUES (
              @id, @name, @file_url, @status, @approved_at, @sent_at, @created_at
            )
            ON CONFLICT(id) DO UPDATE SET
              name = excluded.name,
              file_url = excluded.file_url,
              status = excluded.status,
              approved_at = excluded.approved_at,
              sent_at = excluded.sent_at
          `);
          
          const info = stmt.run(asset);
          console.log('Asset upsert successful. Changes:', info.changes);
          return { success: true };
        } catch (err) {
          console.error('Error upserting asset:', err);
          throw err;
        }
      } else if (method === 'getByJobId') {
        const { jobId } = params;
        console.log('📋 Fetching assets for job:', jobId);
        
        try {
          // First, check if there are any job_assets for this job
          const checkJobAssets = db.prepare('SELECT COUNT(*) as count FROM job_assets WHERE job_id = ?');
          const jobAssetsCount = checkJobAssets.get(jobId);
          console.log(`  Found ${jobAssetsCount.count} job_asset links for this job`);
          
          // Check total assets in database
          const checkAssets = db.prepare('SELECT COUNT(*) as count FROM assets');
          const assetsCount = checkAssets.get();
          console.log(`  Total assets in database: ${assetsCount.count}`);
          
          // Now run the actual query
          const stmt = db.prepare(`
            SELECT a.*
            FROM assets a
            INNER JOIN job_assets ja ON a.id = ja.asset_id
            WHERE ja.job_id = ?
            ORDER BY a.created_at DESC
          `);
          
          const data = stmt.all(jobId);
          console.log(`✅ Found ${data.length} assets for job ${jobId}`);
          
          if (data.length > 0) {
            console.log(`  Sample asset: ${data[0].name} (${data[0].status})`);
          }
          
          return { success: true, data };
        } catch (err) {
          console.error('❌ Error fetching assets by job ID:', err);
          throw err;
        }
      }
    } else if (table === 'job_assets') {
      if (method === 'deleteAll') {
        console.log('🗑️  Deleting all job_assets from local database...');
        const stmt = db.prepare('DELETE FROM job_assets');
        const info = stmt.run();
        console.log(`✅ Deleted ${info.changes} job_asset links`);
        return { success: true, deletedCount: info.changes };
      } else if (method === 'upsertJobAsset') {
        const jobAsset = params;
        console.log('Upserting job_asset link:', jobAsset.job_id, '->', jobAsset.asset_id);
        
        try {
          const stmt = db.prepare(`
            INSERT INTO job_assets (
              id, job_id, asset_id, user_id, created_at
            ) VALUES (
              @id, @job_id, @asset_id, @user_id, @created_at
            )
            ON CONFLICT(id) DO UPDATE SET
              job_id = excluded.job_id,
              asset_id = excluded.asset_id,
              user_id = excluded.user_id
          `);
          
          const info = stmt.run(jobAsset);
          return { success: true };
        } catch (err) {
          console.error('Error upserting job_asset:', err);
          throw err;
        }
      }
    } else if (table === 'reports' || table === 'technical_reports') {
      if (method === 'getByJobId') {
        const { jobId } = params;
        console.log('Fetching reports for job:', jobId);
        const stmt = db.prepare('SELECT * FROM technical_reports WHERE job_id = ? ORDER BY created_at DESC');
        const data = stmt.all(jobId);
        console.log(`Found ${data.length} reports for job ${jobId}`);
        if (data.length > 0) {
          console.log('Sample report IDs:', data.slice(0, 3).map(r => r.id.substring(0, 8) + '...'));
        }
        return { success: true, data };
      } else if (method === 'getAll') {
        console.log('Fetching ALL reports from database');
        const stmt = db.prepare('SELECT id, job_id, title, report_type, status FROM technical_reports ORDER BY created_at DESC LIMIT 10');
        const data = stmt.all();
        console.log(`Found ${data.length} reports in database (showing first 10)`);
        if (data.length > 0) {
          console.log('Sample reports:', data.map(r => ({ 
            id: r.id.substring(0, 8) + '...', 
            title: r.title.substring(0, 30)
          })));
        }
        return { success: true, data };
      } else if (method === 'getById') {
        const { id } = params;
        console.log('Fetching report by ID:', id);
        const stmt = db.prepare('SELECT * FROM technical_reports WHERE id = ?');
        const data = stmt.get(id);
        if (data) {
          console.log('Found report:', data.title);
          return { success: true, data };
        } else {
          console.warn(`Report not found: ${id}`);
          return { success: false, error: 'Report not found' };
        }
      } else if (method === 'deleteAll') {
        console.log('🗑️  Deleting all reports from local database...');
        const stmt = db.prepare('DELETE FROM technical_reports');
        const info = stmt.run();
        console.log(`✅ Deleted ${info.changes} reports`);
        return { success: true, deletedCount: info.changes };
      } else if (method === 'updateReport') {
        const report = params;
        console.log('Updating report:', report.id);
        
        try {
          const stmt = db.prepare(`
            UPDATE technical_reports 
            SET report_data = @report_data,
                updated_at = @updated_at,
                is_dirty = 1
            WHERE id = @id
          `);
          
          const info = stmt.run({
            id: report.id,
            report_data: report.report_data,
            updated_at: report.updated_at
          });
          
          console.log('Report update successful. Changes:', info.changes);
          return { success: true };
        } catch (err) {
          console.error('Error updating report:', err);
          throw err;
        }
      } else if (method === 'upsertReport') {
        const report = params;
        console.log('Upserting report:', report.title);
        
        try {
          const stmt = db.prepare(`
            INSERT INTO technical_reports (
              id, job_id, title, report_type, status, report_data,
              submitted_by, submitted_at, reviewed_by, reviewed_at,
              revision_history, current_version, review_comments,
              approved_at, issued_at, sent_at, is_dirty, last_sync_at,
              created_at, updated_at
            ) VALUES (
              @id, @job_id, @title, @report_type, @status, @report_data,
              @submitted_by, @submitted_at, @reviewed_by, @reviewed_at,
              @revision_history, @current_version, @review_comments,
              @approved_at, @issued_at, @sent_at, @is_dirty, @last_sync_at,
              @created_at, @updated_at
            )
            ON CONFLICT(id) DO UPDATE SET
              title = excluded.title,
              report_type = excluded.report_type,
              status = excluded.status,
              report_data = excluded.report_data,
              submitted_by = excluded.submitted_by,
              submitted_at = excluded.submitted_at,
              reviewed_by = excluded.reviewed_by,
              reviewed_at = excluded.reviewed_at,
              revision_history = excluded.revision_history,
              current_version = excluded.current_version,
              review_comments = excluded.review_comments,
              approved_at = excluded.approved_at,
              issued_at = excluded.issued_at,
              sent_at = excluded.sent_at,
              last_sync_at = excluded.last_sync_at,
              updated_at = excluded.updated_at
          `);
          
          const info = stmt.run(report);
          console.log('Report upsert successful. Changes:', info.changes);
          return { success: true };
        } catch (err) {
          console.error('Error upserting report:', err);
          throw err;
        }
      }
    } else if (table === 'report_templates') {
      if (method === 'deleteAll') {
        console.log('🗑️  Deleting all report templates from local database...');
        const stmt = db.prepare('DELETE FROM report_templates');
        const info = stmt.run();
        console.log(`✅ Deleted ${info.changes} report templates`);
        return { success: true, deletedCount: info.changes };
      } else if (method === 'upsertTemplate') {
        const template = params;
        console.log('Upserting report template:', template.name);
        
        try {
          const stmt = db.prepare(`
            INSERT INTO report_templates (
              id, name, report_type, template_schema, version, is_active,
              last_sync_at, created_at, updated_at
            ) VALUES (
              @id, @name, @report_type, @template_schema, @version, @is_active,
              @last_sync_at, @created_at, @updated_at
            )
            ON CONFLICT(id) DO UPDATE SET
              name = excluded.name,
              report_type = excluded.report_type,
              template_schema = excluded.template_schema,
              version = excluded.version,
              is_active = excluded.is_active,
              last_sync_at = excluded.last_sync_at,
              updated_at = excluded.updated_at
          `);
          
          const info = stmt.run(template);
          console.log('Template upsert successful. Changes:', info.changes);
          return { success: true };
        } catch (err) {
          console.error('Error upserting report template:', err);
          throw err;
        }
      } else if (method === 'getAll') {
        console.log('Fetching all report templates');
        const stmt = db.prepare('SELECT * FROM report_templates WHERE is_active = 1 ORDER BY name ASC');
        const data = stmt.all();
        console.log(`Found ${data.length} active report templates`);
        return { success: true, data };
      }
    }
    
    return { success: false, error: 'Method not implemented' };
  } catch (error) {
    console.error('Database query failed:', error);
    return { 
      success: false, 
      error: error.message || 'Query failed' 
    };
  }
});

/**
 * Get Supabase credentials
 */
ipcMain.handle('get-supabase-config', async () => {
  try {
    console.log('📡 Supabase config requested');
    console.log('  - URL exists:', !!process.env.SUPABASE_URL);
    console.log('  - Key exists:', !!process.env.SUPABASE_ANON_KEY);
    
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
      console.error('❌ Missing Supabase credentials in environment');
      return {
        success: false,
        error: 'SUPABASE_URL or SUPABASE_ANON_KEY not found in .env file'
      };
    }
    
    return {
      success: true,
      url: process.env.SUPABASE_URL,
      anonKey: process.env.SUPABASE_ANON_KEY,
    };
  } catch (error) {
    console.error('Failed to get Supabase config:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to get Supabase config' 
    };
  }
});

/**
 * Handle get app settings
 */
ipcMain.handle('get-settings', async () => {
  try {
    // This would get settings from offline storage
    return {
      success: true,
      settings: {
        last_full_sync: null,
        sync_interval_minutes: 15,
        auto_sync_enabled: true,
        offline_mode: false,
        current_user_id: null,
        api_base_url: process.env.API_BASE_URL || null,
      },
    };
  } catch (error) {
    console.error('Failed to get settings:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to get settings' 
    };
  }
});

/**
 * Handle update settings
 */
ipcMain.handle('update-settings', async (event, { key, value }) => {
  try {
    // This would update settings in offline storage
    console.log(`Update setting: ${key} = ${value}`);
    return { success: true };
  } catch (error) {
    console.error('Failed to update setting:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to update setting' 
    };
  }
});

/**
 * Handle file selection for asset uploads
 */
ipcMain.handle('select-file', async () => {
  const { dialog } = require('electron');
  
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile', 'multiSelections'],
    filters: [
      { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif'] },
      { name: 'Documents', extensions: ['pdf', 'doc', 'docx'] },
      { name: 'All Files', extensions: ['*'] },
    ],
  });

  if (result.canceled) {
    return { success: false, canceled: true };
  }

  return { success: true, filePaths: result.filePaths };
});

// ============================================================================
// App Lifecycle
// ============================================================================

/**
 * App ready - create window
 */
app.whenReady().then(() => {
  initializeDatabase();
  createWindow();

  app.on('activate', () => {
    // On macOS, re-create window when dock icon is clicked
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

/**
 * Quit when all windows are closed (except on macOS)
 */
app.on('window-all-closed', () => {
  stopNetworkMonitoring();
  
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

/**
 * Handle app quit
 */
app.on('will-quit', () => {
  stopNetworkMonitoring();
  
  // Close database connection
  if (db) {
    db.close();
    console.log('Database closed');
  }
});

/**
 * Handle uncaught exceptions
 */
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  // Log to file in production
});

/**
 * Handle unhandled promise rejections
 */
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled rejection at:', promise, 'reason:', reason);
  // Log to file in production
});

