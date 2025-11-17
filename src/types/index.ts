// ============================================================================
// Job Types
// ============================================================================

// Match Supabase database status values (using underscores, not hyphens)
export type JobStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'on-hold' | string;
export type JobPriority = 'high' | 'medium' | 'low';

export interface Job {
  id: string;
  job_number: string;
  title: string;
  description?: string;
  status: string; // Allow any status value from Supabase
  division?: string;
  location?: string;
  address?: string;
  start_date?: string;
  due_date?: string;
  completed_date?: string;
  budget?: number;
  priority?: JobPriority;
  customer_id?: string;
  customer_name?: string;
  customer_company?: string;
  customer_email?: string;
  customer_phone?: string;
  customer_address?: string;
  assigned_to?: string;
  notes?: string;
  is_dirty?: boolean;
  last_sync_at?: string;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Report Types
// ============================================================================

export type ReportStatus = 
  | 'draft' 
  | 'ready_to_sync' 
  | 'synced' 
  | 'submitted' 
  | 'approved' 
  | 'rejected';

export interface Report {
  id: string;
  job_id: string;
  title: string;
  report_type: string;
  status: ReportStatus;
  report_data: Record<string, any>;
  submitted_by?: string;
  submitted_at?: string;
  current_version: number;
  revision_history?: RevisionHistory[];
  is_dirty?: boolean;
  last_sync_at?: string;
  created_at: string;
  updated_at: string;
}

export interface RevisionHistory {
  version: number;
  timestamp: string;
  user_id: string;
  user_name?: string;
  status: ReportStatus;
  comments?: string;
}

export interface ReportTemplate {
  id: string;
  name: string;
  report_type: string;
  template_schema: Record<string, any>;
  version: number;
  is_active: boolean;
  last_sync_at?: string;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Equipment Types
// ============================================================================

export type EquipmentStatus = 'available' | 'in-use' | 'maintenance' | 'retired';

export interface Equipment {
  id: string;
  name: string;
  description?: string;
  category?: string;
  status: EquipmentStatus;
  serial_number?: string;
  model?: string;
  purchase_date?: string;
  last_service_date?: string;
  next_service_date?: string;
  condition_rating?: number;
  notes?: string;
  division?: string;
  assigned_to?: string;
  is_dirty?: boolean;
  last_sync_at?: string;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Asset Types
// ============================================================================

export type AssetStatus = 'pending_upload' | 'uploaded' | 'synced';

export interface Asset {
  id: string;
  name: string;
  file_path?: string;
  file_url?: string;
  file_type?: string;
  file_size?: number;
  mime_type?: string;
  status: AssetStatus;
  user_id?: string;
  is_dirty?: boolean;
  last_sync_at?: string;
  created_at: string;
  updated_at: string;
}

export interface JobAsset {
  id: string;
  job_id: string;
  asset_id: string;
  user_id?: string;
  is_dirty?: boolean;
  created_at: string;
}

// ============================================================================
// User Types
// ============================================================================

export interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role?: string;
  division?: string;
  phone?: string;
  last_sync_at?: string;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Customer Types
// ============================================================================

export interface Customer {
  id: string;
  name?: string;
  company_name?: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
  last_sync_at?: string;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Sync Types
// ============================================================================

export type SyncOperation = 'create' | 'update' | 'delete';
export type SyncDirection = 'up' | 'down' | 'both';

export interface SyncQueueItem {
  id: string;
  table_name: string;
  record_id: string;
  operation: SyncOperation;
  data?: Record<string, any>;
  created_at: string;
  retry_count: number;
  last_error?: string;
}

export interface SyncMetadata {
  id: number;
  table_name: string;
  last_sync_at?: string;
  sync_direction?: SyncDirection;
  total_records: number;
  updated_at: string;
}

export interface SyncConflict {
  id: string;
  table_name: string;
  record_id: string;
  local_data: Record<string, any>;
  remote_data: Record<string, any>;
  conflict_type: string;
  resolution_strategy?: string;
  resolved: boolean;
  created_at: string;
  resolved_at?: string;
}

// ============================================================================
// App Settings Types
// ============================================================================

export interface AppSettings {
  last_full_sync?: string;
  sync_interval_minutes: number;
  auto_sync_enabled: boolean;
  offline_mode: boolean;
  current_user_id?: string;
  api_base_url?: string;
}

// ============================================================================
// Network Status
// ============================================================================

export interface NetworkStatus {
  online: boolean;
  lastChecked: Date;
  apiReachable: boolean;
}

