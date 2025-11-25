import { getOfflineStorage } from './offline-storage';
import { getSupabase } from '../lib/supabase';
import type {
  Job,
  Report,
  Equipment,
  Customer,
  ReportTemplate,
  SyncQueueItem,
} from '../types';

/**
 * Sync Service
 * Handles bidirectional synchronization between local SQLite and remote Supabase
 */
export class SyncService {
  private storage = getOfflineStorage();
  private syncInterval: NodeJS.Timeout | null = null;

  // Mapping from report type (slug) to Supabase table name
  // Derived from JobDetail.tsx
  private slugToTable: Record<string, string> = {
    'switchgear-switchboard-assemblies-ats25': 'switchgear_switchboard_ats25_reports',
    'panelboard-assemblies-ats25': 'panelboard_assemblies_ats25_reports',
    'panelboard-report': 'panelboard_reports',
    'switchgear-report': 'switchgear_reports',
    'dry-type-transformer': 'transformer_reports',
    'large-dry-type-transformer-report': 'large_transformer_reports',
    'large-dry-type-transformer': 'large_transformer_reports',
    'large-dry-type-transformer-mts-report': 'large_dry_type_transformer_mts_reports',
    'large-dry-type-xfmr-mts-report': 'large_dry_type_transformer_mts_reports',
    'liquid-xfmr-visual-mts-report': 'liquid_xfmr_visual_mts_reports',
    'low-voltage-switch-report': 'low_voltage_switch_reports',
    'medium-voltage-switch-oil-report': 'medium_voltage_switch_oil_reports',
    'medium-voltage-switch-sf6': 'medium_voltage_switch_sf6_reports',
    'medium-voltage-switch-sf6-report': 'medium_voltage_switch_sf6_reports',
    'potential-transformer-ats-report': 'potential_transformer_ats_reports',
    'low-voltage-panelboard-small-breaker-report': 'low_voltage_panelboard_small_breaker_reports',
    'medium-voltage-circuit-breaker-report': 'medium_voltage_circuit_breaker_reports',
    'medium-voltage-circuit-breaker-mts-report': 'medium_voltage_circuit_breaker_mts_reports',
    'medium-voltage-vlf-mts-report': 'medium_voltage_vlf_mts_reports',
    'medium-voltage-cable-vlf-test-mts': 'medium_voltage_vlf_mts_reports',
    'medium-voltage-vlf': 'medium_voltage_vlf_mts_reports',
    'medium-voltage-vlf-tan-delta': 'tandelta_reports',
    'medium-voltage-vlf-tan-delta-mts': 'tandelta_mts_reports',
    'electrical-tan-delta-test-mts-form': 'tandelta_mts_reports',
    'medium-voltage-cable-vlf-test': 'medium_voltage_cable_vlf_test',
    'current-transformer-test-ats-report': 'current_transformer_test_ats_reports',
    '12-current-transformer-test-ats-report': 'current_transformer_test_ats_reports',
    '12-current-transformer-test-mts-report': 'current_transformer_test_mts_reports',
    '13-voltage-potential-transformer-test-mts-report': 'voltage_potential_transformer_mts_reports',
    '23-medium-voltage-motor-starter-mts-report': 'medium_voltage_motor_starter_mts_reports',
    '23-medium-voltage-switch-mts-report': 'medium_voltage_switch_mts_reports',
    'metal-enclosed-busway': 'metal_enclosed_busway_reports',
    'low-voltage-circuit-breaker-thermal-magnetic-mts-report': 'low_voltage_circuit_breaker_thermal_magnetic_mts_reports',
    'low-voltage-circuit-breaker-electronic-trip-ats-report': 'low_voltage_circuit_breaker_electronic_trip_ats_reports',
    'low-voltage-circuit-breaker-electronic-trip-ats-secondary-injection-report': 'low_voltage_circuit_breaker_electronic_trip_ats_reports',
    'low-voltage-circuit-breaker-thermal-magnetic-ats-report': 'low_voltage_circuit_breaker_thermal_magnetic_ats_reports',
    'automatic-transfer-switch-ats-report': 'automatic_transfer_switch_ats_reports',
    'low-voltage-circuit-breaker-electronic-trip-mts-report': 'low_voltage_circuit_breaker_electronic_trip_mts_reports',
    'low-voltage-circuit-breaker-electronic-trip-mts': 'low_voltage_circuit_breaker_electronic_trip_mts_reports',
    'low-voltage-circuit-breaker-electronic-trip-unit-mts': 'low_voltage_circuit_breaker_electronic_trip_mts_reports',
    'two-small-dry-typer-xfmr-mts-report': 'two_small_dry_type_xfmr_mts_reports',
    'low-voltage-cable-test-3sets': 'low_voltage_cable_test_3sets',
    'low-voltage-cable-test-12sets': 'low_voltage_cable_test_12sets',
    'low-voltage-cable-test-20sets': 'transformer_reports',
    'low-voltage-switch-multi-device-test': 'low_voltage_switch_multi_device_reports',
    'two-small-dry-typer-xfmr-ats-report': 'two_small_dry_type_xfmr_ats_reports',
    'switchgear-panelboard-mts-report': 'switchgear_panelboard_mts_reports',
    'liquid-filled-transformer': 'liquid_filled_transformer_reports',
    'oil-inspection': 'oil_inspection_reports',
    'grounding-system-master': 'grounding_system_master_reports',
    'grounding-fall-of-potential-slope-method-test': 'grounding_fall_of_potential_slope_method_test_reports',
    'standard-report': 'standard_reports'
  };

  // Reverse mapping for sync down (Table -> Slug)
  // We pick the first slug that maps to a table as the default type
  private tableToSlug: Record<string, string> = {};

  constructor() {
    // Initialize reverse mapping
    Object.entries(this.slugToTable).forEach(([slug, table]) => {
      if (!this.tableToSlug[table]) {
        this.tableToSlug[table] = slug;
      }
    });
  }

  /**
   * Check if API is reachable (via Supabase)
   */
  async checkConnection(): Promise<boolean> {
    try {
      const supabase = getSupabase();
      const { error } = await supabase.from('jobs').select('count', { count: 'exact', head: true });
      return !error;
    } catch (error) {
      console.error('Connection check failed:', error);
      return false;
    }
  }

  /**
   * Start automatic sync at specified interval
   */
  startAutoSync(intervalMinutes?: number): void {
    const settings = this.storage.getSettings();
    const interval = intervalMinutes || settings.sync_interval_minutes || 15;

    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = setInterval(() => {
      this.performFullSync().catch(error => {
        console.error('Auto-sync failed:', error);
      });
    }, interval * 60 * 1000);

    console.log(`Auto-sync started with ${interval} minute interval`);
  }

  /**
   * Stop automatic sync
   */
  stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      console.log('Auto-sync stopped');
    }
  }

  /**
   * Perform a full bidirectional sync
   */
  async performFullSync(): Promise<{
    success: boolean;
    uploaded: number;
    downloaded: number;
    errors: string[];
  }> {
    console.log('Starting full sync...');
    const errors: string[] = [];
    let uploaded = 0;
    let downloaded = 0;

    try {
      // Phase 1: Upload local changes (sync up)
      uploaded = await this.syncUp();

      // Phase 2: Download remote changes (sync down)
      downloaded = await this.syncDown();

      // Update last sync timestamp
      this.storage.updateSetting('last_full_sync', new Date().toISOString());

      console.log(`Sync completed: ${uploaded} uploaded, ${downloaded} downloaded`);
      return { success: true, uploaded, downloaded, errors };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown sync error';
      console.error('Full sync failed:', errorMsg);
      errors.push(errorMsg);
      return { success: false, uploaded, downloaded, errors };
    }
  }

  /**
   * Sync local changes to remote (upload)
   */
  private async syncUp(): Promise<number> {
    let uploadCount = 0;
    const syncQueue = this.storage.getSyncQueue();

    console.log(`Syncing up ${syncQueue.length} items...`);

    for (const item of syncQueue) {
      try {
        await this.uploadItem(item);
        this.storage.removeSyncQueueItem(item.id);
        uploadCount++;
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Upload failed';
        console.error(`Failed to sync ${item.table_name}:${item.record_id}`, errorMsg);
        this.storage.updateSyncQueueRetry(item.id, errorMsg);
      }
    }

    return uploadCount;
  }

  /**
   * Helper to get remote table name from local table name and record data
   */
  private getRemoteTableName(localTableName: string, data?: any): string {
    if (localTableName === 'reports' && data && data.report_type) {
      return this.slugToTable[data.report_type] || 'technical_reports';
    }
    return localTableName;
  }

  /**
   * Upload a single item to remote
   */
  private async uploadItem(item: SyncQueueItem): Promise<void> {
    const { table_name, record_id, operation, data } = item;

    // Parse data if it's a string (SQLite storage)
    let payload = data;
    if (typeof data === 'string') {
      try {
        payload = JSON.parse(data);
      } catch (e) {
        console.warn(`Failed to parse data for ${table_name}:${record_id}, using as is`);
      }
    }

    const remoteTableName = this.getRemoteTableName(table_name, payload);
    const supabase = getSupabase();

    // Prepare payload for remote
    if (payload && typeof payload === 'object') {
      delete (payload as any).is_dirty;

      // Special handling for reports: unpack JSON blob into columns
      if (table_name === 'reports') {
        payload = this.mapLocalReportToRemoteColumns(payload);
      }
    }

    let error;

    switch (operation) {
      case 'create':
        ({ error } = await supabase.from(remoteTableName).insert(payload));
        break;
      case 'update':
        ({ error } = await supabase.from(remoteTableName).update(payload).eq('id', record_id));
        break;
      case 'delete':
        ({ error } = await supabase.from(remoteTableName).delete().eq('id', record_id));
        break;
      default:
        throw new Error(`Unknown operation: ${operation}`);
    }

    if (error) {
      throw new Error(`Supabase error: ${error.message} (${error.code})`);
    }

    // Clear dirty flag after successful upload
    this.storage.clearDirtyFlag(table_name, record_id);
  }

  /**
   * Map local report object (single JSON blob) to remote table columns
   */
  private mapLocalReportToRemoteColumns(localReport: any): any {
    const reportData = localReport.report_data || {};

    // Base fields that exist in most report tables
    const remotePayload: any = {
      id: localReport.id,
      job_id: localReport.job_id,
      user_id: localReport.user_id || localReport.submitted_by, // Fallback
      created_at: localReport.created_at,
      updated_at: localReport.updated_at,
      comments: localReport.comments || reportData.comments,

      // JSONB columns commonly found in report tables
      report_info: reportData.report_info || reportData.reportInfo,
      visual_inspection_items: reportData.visual_inspection_items || reportData.visualInspectionItems || reportData.visual_inspection,
      test_equipment_used: reportData.test_equipment_used || reportData.testEquipment || reportData.test_equipment,

      // Some tables have specific columns, we try to map them if they exist in data
      insulation_resistance: reportData.insulation_resistance || reportData.insulationResistance,
      contact_resistance: reportData.contact_resistance || reportData.contactResistance,
      nameplate_data: reportData.nameplate_data || reportData.nameplateData || reportData.nameplate
    };

    // Remove undefined fields
    Object.keys(remotePayload).forEach(key =>
      remotePayload[key] === undefined && delete remotePayload[key]
    );

    return remotePayload;
  }

  /**
   * Sync remote changes to local (download)
   */
  private async syncDown(): Promise<number> {
    let downloadCount = 0;

    try {
      // Get current user's assigned jobs
      const settings = this.storage.getSettings();
      const currentUserId = settings.current_user_id;

      if (!currentUserId) {
        console.warn('No current user ID, skipping sync down');
        return 0;
      }

      // Sync jobs
      downloadCount += await this.syncJobs(currentUserId);

      // Sync reports for those jobs (Multi-table iteration)
      downloadCount += await this.syncReports();

      // Sync report templates
      downloadCount += await this.syncTemplates();

      // Sync equipment
      downloadCount += await this.syncEquipment();

      // Sync customers
      downloadCount += await this.syncCustomers();

      return downloadCount;
    } catch (error) {
      console.error('Sync down failed:', error);
      throw error;
    }
  }

  /**
   * Sync jobs assigned to current user
   */
  private async syncJobs(userId: string): Promise<number> {
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('assigned_to', userId);

      if (error) throw error;
      if (!data) return 0;

      const jobs = data as Job[];

      for (const job of jobs) {
        // Ensure is_dirty is false for synced items
        this.storage.upsertJob({ ...job, is_dirty: false });
      }

      console.log(`Synced ${jobs.length} jobs`);
      return jobs.length;
    } catch (error) {
      console.error('Failed to sync jobs:', error);
      return 0;
    }
  }

  /**
   * Sync reports for local jobs (Multi-table)
   */
  private async syncReports(): Promise<number> {
    try {
      const localJobs = this.storage.getJobs();
      const jobIds = localJobs.map(j => j.id);

      if (jobIds.length === 0) return 0;

      const supabase = getSupabase();
      let totalReports = 0;

      // Get unique table names to query
      const tables = Array.from(new Set(Object.values(this.slugToTable)));

      console.log(`Syncing reports from ${tables.length} tables...`);

      for (const tableName of tables) {
        try {
          const { data, error } = await supabase
            .from(tableName)
            .select('*')
            .in('job_id', jobIds);

          if (error) {
            // Some tables might not exist or have permissions issues, log and continue
            console.warn(`Failed to sync table ${tableName}:`, error.message);
            continue;
          }

          if (!data || data.length === 0) continue;

          const reports = data as any[];

          for (const remoteReport of reports) {
            // Map remote columns back to local Report structure
            const reportType = this.tableToSlug[tableName] || 'unknown-report';

            // Reconstruct report_data from columns
            const reportData = {
              ...remoteReport.report_info, // Spread report_info if it exists
              report_info: remoteReport.report_info,
              visual_inspection_items: remoteReport.visual_inspection_items,
              test_equipment_used: remoteReport.test_equipment_used,
              insulation_resistance: remoteReport.insulation_resistance,
              contact_resistance: remoteReport.contact_resistance,
              nameplate_data: remoteReport.nameplate_data,
              comments: remoteReport.comments
            };

            const localReport: Report = {
              id: remoteReport.id,
              job_id: remoteReport.job_id,
              title: remoteReport.report_info?.jobInfo?.reportTitle || reportType, // Try to find title
              report_type: reportType,
              status: 'draft', // Default to draft if status missing
              report_data: reportData,
              submitted_by: remoteReport.user_id,
              submitted_at: remoteReport.created_at,
              current_version: 1,
              revision_history: [],
              is_dirty: false,
              created_at: remoteReport.created_at,
              updated_at: remoteReport.updated_at
            };

            this.storage.upsertReport(localReport);
          }

          totalReports += reports.length;
        } catch (tableError) {
          console.warn(`Error processing table ${tableName}:`, tableError);
        }
      }

      console.log(`Synced ${totalReports} reports across all tables`);
      return totalReports;
    } catch (error) {
      console.error('Failed to sync reports:', error);
      return 0;
    }
  }

  /**
   * Sync report templates
   */
  private async syncTemplates(): Promise<number> {
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('report_templates')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;
      if (!data) return 0;

      const templates = data as ReportTemplate[];

      for (const template of templates) {
        this.storage.upsertTemplate({ ...template, is_active: true });
      }

      console.log(`Synced ${templates.length} templates`);
      return templates.length;
    } catch (error) {
      console.error('Failed to sync templates:', error);
      return 0;
    }
  }

  /**
   * Sync equipment
   */
  private async syncEquipment(): Promise<number> {
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('equipment')
        .select('*');

      if (error) throw error;
      if (!data) return 0;

      const equipmentList = data as Equipment[];

      for (const equipment of equipmentList) {
        this.storage.upsertEquipment({ ...equipment, is_dirty: false });
      }

      console.log(`Synced ${equipmentList.length} equipment items`);
      return equipmentList.length;
    } catch (error) {
      console.error('Failed to sync equipment:', error);
      return 0;
    }
  }

  /**
   * Sync customers
   */
  private async syncCustomers(): Promise<number> {
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('customers')
        .select('*');

      if (error) throw error;
      if (!data) return 0;

      const customers = data as Customer[];

      for (const customer of customers) {
        this.storage.upsertCustomer(customer);
      }

      console.log(`Synced ${customers.length} customers`);
      return customers.length;
    } catch (error) {
      console.error('Failed to sync customers:', error);
      return 0;
    }
  }

  /**
   * Handle conflict resolution
   */
  async resolveConflict(
    conflictId: string,
    strategy: 'local' | 'remote' | 'manual'
  ): Promise<void> {
    console.log(`Resolving conflict ${conflictId} with strategy: ${strategy}`);
    // Implementation would query sync_conflicts table
    // and apply the chosen resolution strategy
  }

  /**
   * Force sync a specific record
   */
  async forceSyncRecord(tableName: string, recordId: string): Promise<void> {
    console.log(`Force syncing ${tableName}:${recordId}`);
    // Implementation would create a sync queue item and immediately process it
  }
}
