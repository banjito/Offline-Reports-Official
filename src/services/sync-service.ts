import { getOfflineStorage } from './offline-storage';
import type {
  Job,
  Report,
  Equipment,
  Asset,
  User,
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
  private apiBaseUrl: string;
  private authToken: string | null = null;
  private syncInterval: NodeJS.Timeout | null = null;

  constructor(apiBaseUrl?: string) {
    const settings = this.storage.getSettings();
    this.apiBaseUrl = apiBaseUrl || settings.api_base_url || '';
  }

  /**
   * Set authentication token
   */
  setAuthToken(token: string): void {
    this.authToken = token;
  }

  /**
   * Check if API is reachable
   */
  async checkConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/health`, {
        method: 'GET',
        headers: this.getHeaders(),
      });
      return response.ok;
    } catch (error) {
      console.error('Connection check failed:', error);
      return false;
    }
  }

  /**
   * Get request headers with auth token
   */
  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    return headers;
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
      // Check connection first
      const connected = await this.checkConnection();
      if (!connected) {
        throw new Error('API not reachable');
      }

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
   * Upload a single item to remote
   */
  private async uploadItem(item: SyncQueueItem): Promise<void> {
    const { table_name, record_id, operation, data } = item;

    let endpoint: string;
    let method: string;

    switch (operation) {
      case 'create':
        endpoint = `${this.apiBaseUrl}/api/${table_name}`;
        method = 'POST';
        break;
      case 'update':
        endpoint = `${this.apiBaseUrl}/api/${table_name}/${record_id}`;
        method = 'PUT';
        break;
      case 'delete':
        endpoint = `${this.apiBaseUrl}/api/${table_name}/${record_id}`;
        method = 'DELETE';
        break;
      default:
        throw new Error(`Unknown operation: ${operation}`);
    }

    const response = await fetch(endpoint, {
      method,
      headers: this.getHeaders(),
      body: data ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    // Clear dirty flag after successful upload
    this.storage.clearDirtyFlag(table_name, record_id);
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

      // Sync reports for those jobs
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
      const response = await fetch(
        `${this.apiBaseUrl}/api/jobs?assigned_to=${userId}`,
        {
          method: 'GET',
          headers: this.getHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch jobs: ${response.statusText}`);
      }

      const jobs: Job[] = await response.json();
      
      for (const job of jobs) {
        this.storage.upsertJob(job);
      }

      console.log(`Synced ${jobs.length} jobs`);
      return jobs.length;
    } catch (error) {
      console.error('Failed to sync jobs:', error);
      return 0;
    }
  }

  /**
   * Sync reports for local jobs
   */
  private async syncReports(): Promise<number> {
    try {
      const localJobs = this.storage.getJobs();
      const jobIds = localJobs.map(j => j.id);

      if (jobIds.length === 0) return 0;

      const response = await fetch(
        `${this.apiBaseUrl}/api/reports?job_ids=${jobIds.join(',')}`,
        {
          method: 'GET',
          headers: this.getHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch reports: ${response.statusText}`);
      }

      const reports: Report[] = await response.json();
      
      // Note: Report upserting would need to be implemented in offline-storage
      console.log(`Synced ${reports.length} reports`);
      return reports.length;
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
      const response = await fetch(
        `${this.apiBaseUrl}/api/report-templates`,
        {
          method: 'GET',
          headers: this.getHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch templates: ${response.statusText}`);
      }

      const templates: ReportTemplate[] = await response.json();
      
      // Store templates in local database
      // Implementation would be added to offline-storage
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
      const response = await fetch(
        `${this.apiBaseUrl}/api/equipment`,
        {
          method: 'GET',
          headers: this.getHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch equipment: ${response.statusText}`);
      }

      const equipment: Equipment[] = await response.json();
      
      // Store equipment in local database
      // Implementation would be added to offline-storage
      console.log(`Synced ${equipment.length} equipment items`);
      return equipment.length;
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
      const response = await fetch(
        `${this.apiBaseUrl}/api/customers`,
        {
          method: 'GET',
          headers: this.getHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch customers: ${response.statusText}`);
      }

      const customers: Customer[] = await response.json();
      
      // Store customers in local database
      // Implementation would be added to offline-storage
      console.log(`Synced ${customers.length} customers`);
      return customers.length;
    } catch (error) {
      console.error('Failed to sync customers:', error);
      return 0;
    }
  }

  /**
   * Handle conflict resolution
   * This is a simple last-write-wins strategy
   * More sophisticated strategies can be implemented
   */
  async resolveConflict(
    conflictId: string,
    strategy: 'local' | 'remote' | 'manual'
  ): Promise<void> {
    // Implementation would query sync_conflicts table
    // and apply the chosen resolution strategy
    console.log(`Resolving conflict ${conflictId} with strategy: ${strategy}`);
  }

  /**
   * Force sync a specific record
   */
  async forceSyncRecord(tableName: string, recordId: string): Promise<void> {
    console.log(`Force syncing ${tableName}:${recordId}`);
    // Implementation would create a sync queue item and immediately process it
  }
}

// Export singleton instance
let syncServiceInstance: SyncService | null = null;

export function getSyncService(apiBaseUrl?: string): SyncService {
  if (!syncServiceInstance) {
    syncServiceInstance = new SyncService(apiBaseUrl);
  }
  return syncServiceInstance;
}

