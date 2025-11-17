import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { join } from 'path';
import { app } from 'electron';
import { v4 as uuidv4 } from 'uuid';
import type {
  Job,
  Report,
  Equipment,
  Asset,
  User,
  Customer,
  ReportTemplate,
  SyncQueueItem,
  SyncMetadata,
  SyncConflict,
  AppSettings,
} from '../types';

/**
 * Offline Storage Service
 * Handles all local database operations using SQLite
 */
export class OfflineStorage {
  private db: Database.Database;
  private dbPath: string;

  constructor() {
    // Store database in user data directory
    const userDataPath = app.getPath('userData');
    this.dbPath = join(userDataPath, 'field-tech.db');
    this.db = new Database(this.dbPath);
    
    // Enable WAL mode for better concurrency
    this.db.pragma('journal_mode = WAL');
    
    this.initialize();
  }

  /**
   * Initialize database with schema
   */
  private initialize(): void {
    try {
      const schemaPath = join(__dirname, '../database/schema.sql');
      const schema = readFileSync(schemaPath, 'utf-8');
      this.db.exec(schema);
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Error initializing database:', error);
      throw error;
    }
  }

  /**
   * Mark a record as dirty (needs sync)
   */
  private markDirty(table: string, id: string): void {
    const stmt = this.db.prepare(`
      UPDATE ${table} 
      SET is_dirty = 1, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `);
    stmt.run(id);
  }

  /**
   * Add operation to sync queue
   */
  addToSyncQueue(
    tableName: string,
    recordId: string,
    operation: 'create' | 'update' | 'delete',
    data?: Record<string, any>
  ): void {
    const stmt = this.db.prepare(`
      INSERT INTO sync_queue (id, table_name, record_id, operation, data)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      uuidv4(),
      tableName,
      recordId,
      operation,
      data ? JSON.stringify(data) : null
    );
  }

  // ============================================================================
  // JOB OPERATIONS
  // ============================================================================

  /**
   * Get all jobs, optionally filtered by assigned technician
   */
  getJobs(assignedTo?: string): Job[] {
    let query = 'SELECT * FROM jobs WHERE 1=1';
    const params: any[] = [];

    if (assignedTo) {
      query += ' AND assigned_to = ?';
      params.push(assignedTo);
    }

    query += ' ORDER BY created_at DESC';

    const stmt = this.db.prepare(query);
    return stmt.all(...params) as Job[];
  }

  /**
   * Get a single job by ID
   */
  getJob(id: string): Job | undefined {
    const stmt = this.db.prepare('SELECT * FROM jobs WHERE id = ?');
    return stmt.get(id) as Job | undefined;
  }

  /**
   * Create or update a job
   */
  upsertJob(job: Job): void {
    const stmt = this.db.prepare(`
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

    stmt.run(job);
  }

  /**
   * Update job status
   */
  updateJobStatus(id: string, status: Job['status']): void {
    const stmt = this.db.prepare(`
      UPDATE jobs 
      SET status = ?, is_dirty = 1, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `);
    stmt.run(status, id);
    this.addToSyncQueue('jobs', id, 'update');
  }

  // ============================================================================
  // REPORT OPERATIONS
  // ============================================================================

  /**
   * Get all reports, optionally filtered by job
   */
  getReports(jobId?: string): Report[] {
    let query = 'SELECT * FROM reports WHERE 1=1';
    const params: any[] = [];

    if (jobId) {
      query += ' AND job_id = ?';
      params.push(jobId);
    }

    query += ' ORDER BY created_at DESC';

    const stmt = this.db.prepare(query);
    const reports = stmt.all(...params) as any[];
    
    // Parse JSON fields
    return reports.map(report => ({
      ...report,
      report_data: JSON.parse(report.report_data),
      revision_history: report.revision_history ? JSON.parse(report.revision_history) : []
    }));
  }

  /**
   * Get a single report by ID
   */
  getReport(id: string): Report | undefined {
    const stmt = this.db.prepare('SELECT * FROM reports WHERE id = ?');
    const report = stmt.get(id) as any;
    
    if (!report) return undefined;
    
    return {
      ...report,
      report_data: JSON.parse(report.report_data),
      revision_history: report.revision_history ? JSON.parse(report.revision_history) : []
    };
  }

  /**
   * Create a new report
   */
  createReport(report: Report): void {
    const stmt = this.db.prepare(`
      INSERT INTO reports (
        id, job_id, title, report_type, status, report_data,
        submitted_by, submitted_at, current_version, revision_history,
        is_dirty, last_sync_at, created_at, updated_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      )
    `);

    stmt.run(
      report.id,
      report.job_id,
      report.title,
      report.report_type,
      report.status,
      JSON.stringify(report.report_data),
      report.submitted_by,
      report.submitted_at,
      report.current_version,
      JSON.stringify(report.revision_history || [])
    );

    this.addToSyncQueue('reports', report.id, 'create', report);
  }

  /**
   * Update an existing report
   */
  updateReport(id: string, updates: Partial<Report>): void {
    const report = this.getReport(id);
    if (!report) throw new Error('Report not found');

    const updatedReport = { ...report, ...updates };

    const stmt = this.db.prepare(`
      UPDATE reports SET
        title = ?,
        report_type = ?,
        status = ?,
        report_data = ?,
        submitted_by = ?,
        submitted_at = ?,
        current_version = ?,
        revision_history = ?,
        is_dirty = 1,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    stmt.run(
      updatedReport.title,
      updatedReport.report_type,
      updatedReport.status,
      JSON.stringify(updatedReport.report_data),
      updatedReport.submitted_by,
      updatedReport.submitted_at,
      updatedReport.current_version,
      JSON.stringify(updatedReport.revision_history || []),
      id
    );

    this.addToSyncQueue('reports', id, 'update', updatedReport);
  }

  // ============================================================================
  // EQUIPMENT OPERATIONS
  // ============================================================================

  /**
   * Get all equipment
   */
  getEquipment(): Equipment[] {
    const stmt = this.db.prepare('SELECT * FROM equipment ORDER BY name');
    return stmt.all() as Equipment[];
  }

  /**
   * Get equipment assigned to a user
   */
  getEquipmentByAssignee(userId: string): Equipment[] {
    const stmt = this.db.prepare('SELECT * FROM equipment WHERE assigned_to = ?');
    return stmt.all(userId) as Equipment[];
  }

  // ============================================================================
  // ASSET OPERATIONS
  // ============================================================================

  /**
   * Get assets for a job
   */
  getJobAssets(jobId: string): Asset[] {
    const stmt = this.db.prepare(`
      SELECT a.* FROM assets a
      JOIN job_assets ja ON a.id = ja.asset_id
      WHERE ja.job_id = ?
      ORDER BY a.created_at DESC
    `);
    return stmt.all(jobId) as Asset[];
  }

  /**
   * Create an asset
   */
  createAsset(asset: Asset): void {
    const stmt = this.db.prepare(`
      INSERT INTO assets (
        id, name, file_path, file_url, file_type, file_size,
        mime_type, status, user_id, is_dirty, created_at, updated_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      )
    `);

    stmt.run(
      asset.id,
      asset.name,
      asset.file_path,
      asset.file_url,
      asset.file_type,
      asset.file_size,
      asset.mime_type,
      asset.status,
      asset.user_id
    );

    this.addToSyncQueue('assets', asset.id, 'create', asset);
  }

  /**
   * Link an asset to a job
   */
  linkAssetToJob(jobId: string, assetId: string, userId: string): void {
    const id = uuidv4();
    const stmt = this.db.prepare(`
      INSERT INTO job_assets (id, job_id, asset_id, user_id, is_dirty, created_at)
      VALUES (?, ?, ?, ?, 1, CURRENT_TIMESTAMP)
    `);

    stmt.run(id, jobId, assetId, userId);
    this.addToSyncQueue('job_assets', id, 'create');
  }

  // ============================================================================
  // SYNC OPERATIONS
  // ============================================================================

  /**
   * Get pending sync queue items
   */
  getSyncQueue(): SyncQueueItem[] {
    const stmt = this.db.prepare('SELECT * FROM sync_queue ORDER BY created_at');
    return stmt.all() as SyncQueueItem[];
  }

  /**
   * Remove item from sync queue
   */
  removeSyncQueueItem(id: string): void {
    const stmt = this.db.prepare('DELETE FROM sync_queue WHERE id = ?');
    stmt.run(id);
  }

  /**
   * Update sync queue item retry count
   */
  updateSyncQueueRetry(id: string, error: string): void {
    const stmt = this.db.prepare(`
      UPDATE sync_queue 
      SET retry_count = retry_count + 1, last_error = ? 
      WHERE id = ?
    `);
    stmt.run(error, id);
  }

  /**
   * Get all dirty records (need sync)
   */
  getDirtyRecords(tableName: string): any[] {
    const stmt = this.db.prepare(`SELECT * FROM ${tableName} WHERE is_dirty = 1`);
    return stmt.all();
  }

  /**
   * Clear dirty flag after successful sync
   */
  clearDirtyFlag(tableName: string, id: string): void {
    const stmt = this.db.prepare(`
      UPDATE ${tableName} 
      SET is_dirty = 0, last_sync_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `);
    stmt.run(id);
  }

  // ============================================================================
  // APP SETTINGS
  // ============================================================================

  /**
   * Get app settings
   */
  getSettings(): AppSettings {
    const stmt = this.db.prepare('SELECT key, value FROM app_settings');
    const rows = stmt.all() as { key: string; value: string }[];
    
    const settings: any = {};
    rows.forEach(row => {
      if (row.value === 'true' || row.value === 'false') {
        settings[row.key] = row.value === 'true';
      } else if (!isNaN(Number(row.value))) {
        settings[row.key] = Number(row.value);
      } else {
        settings[row.key] = row.value;
      }
    });
    
    return settings as AppSettings;
  }

  /**
   * Update a setting
   */
  updateSetting(key: string, value: any): void {
    const stmt = this.db.prepare(`
      INSERT INTO app_settings (key, value, updated_at) 
      VALUES (?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP
    `);
    stmt.run(key, String(value));
  }

  // ============================================================================
  // UTILITY
  // ============================================================================

  /**
   * Execute a raw query (for migrations)
   */
  exec(sql: string): void {
    this.db.exec(sql);
  }

  /**
   * Close database connection
   */
  close(): void {
    this.db.close();
  }

  /**
   * Get database path
   */
  getDbPath(): string {
    return this.dbPath;
  }
}

// Export singleton instance
let storageInstance: OfflineStorage | null = null;

export function getOfflineStorage(): OfflineStorage {
  if (!storageInstance) {
    storageInstance = new OfflineStorage();
  }
  return storageInstance;
}

