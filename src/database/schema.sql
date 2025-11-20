-- Field Technician Desktop App - Local SQLite Schema
-- This schema is designed for offline-first operations with eventual consistency

-- ============================================================================
-- SYNC METADATA
-- ============================================================================

-- Track sync operations and conflicts
CREATE TABLE IF NOT EXISTS sync_queue (
  id TEXT PRIMARY KEY,
  table_name TEXT NOT NULL,
  record_id TEXT NOT NULL,
  operation TEXT NOT NULL CHECK(operation IN ('create', 'update', 'delete')),
  data JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  retry_count INTEGER DEFAULT 0,
  last_error TEXT
);

CREATE TABLE IF NOT EXISTS sync_metadata (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  table_name TEXT NOT NULL UNIQUE,
  last_sync_at TIMESTAMP,
  sync_direction TEXT CHECK(sync_direction IN ('up', 'down', 'both')),
  total_records INTEGER DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- JOBS
-- ============================================================================

CREATE TABLE IF NOT EXISTS jobs (
  id TEXT PRIMARY KEY,
  job_number TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT, -- Allow any status value from Supabase
  division TEXT,
  location TEXT,
  address TEXT,
  start_date TEXT,
  due_date TEXT,
  completed_date TEXT,
  budget REAL,
  priority TEXT CHECK(priority IN ('high', 'medium', 'low')),
  customer_id TEXT,
  customer_name TEXT,
  customer_company TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  customer_address TEXT,
  assigned_to TEXT,
  notes TEXT,
  is_dirty BOOLEAN DEFAULT 0,
  last_sync_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_assigned_to ON jobs(assigned_to);
CREATE INDEX IF NOT EXISTS idx_jobs_is_dirty ON jobs(is_dirty);

-- ============================================================================
-- TECHNICAL REPORTS (Matches web app neta_ops.technical_reports structure)
-- ============================================================================

CREATE TABLE IF NOT EXISTS technical_reports (
  id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL,
  title TEXT NOT NULL,
  report_type TEXT NOT NULL,
  status TEXT CHECK(status IN ('draft', 'submitted', 'in-review', 'approved', 'rejected', 'archived', 'sent')) DEFAULT 'draft',
  report_data JSON NOT NULL DEFAULT '{}',
  submitted_by TEXT,
  submitted_at TIMESTAMP,
  reviewed_by TEXT,
  reviewed_at TIMESTAMP,
  revision_history JSON DEFAULT '[]',
  current_version INTEGER DEFAULT 1,
  review_comments TEXT,
  approved_at TIMESTAMP,
  issued_at TIMESTAMP,
  sent_at TIMESTAMP,
  is_dirty BOOLEAN DEFAULT 0,
  last_sync_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_technical_reports_job_id ON technical_reports(job_id);
CREATE INDEX IF NOT EXISTS idx_technical_reports_status ON technical_reports(status);
CREATE INDEX IF NOT EXISTS idx_technical_reports_is_dirty ON technical_reports(is_dirty);
CREATE INDEX IF NOT EXISTS idx_technical_reports_submitted_by ON technical_reports(submitted_by);

-- ============================================================================
-- EQUIPMENT & RESOURCES
-- ============================================================================

CREATE TABLE IF NOT EXISTS equipment (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  status TEXT CHECK(status IN ('available', 'in-use', 'maintenance', 'retired')),
  serial_number TEXT,
  model TEXT,
  purchase_date TEXT,
  last_service_date TEXT,
  next_service_date TEXT,
  condition_rating INTEGER,
  notes TEXT,
  division TEXT,
  assigned_to TEXT,
  is_dirty BOOLEAN DEFAULT 0,
  last_sync_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_equipment_status ON equipment(status);
CREATE INDEX IF NOT EXISTS idx_equipment_assigned_to ON equipment(assigned_to);

-- ============================================================================
-- ASSETS (Photos, Documents, etc.)
-- ============================================================================

CREATE TABLE IF NOT EXISTS assets (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  file_path TEXT,
  file_url TEXT,
  file_type TEXT,
  file_size INTEGER,
  mime_type TEXT,
  status TEXT, -- Allow any status from web app: 'not started', 'in_progress', 'ready_for_review', 'approved', 'sent', 'issue', 'archived'
  approved_at TIMESTAMP,
  sent_at TIMESTAMP,
  user_id TEXT,
  is_dirty BOOLEAN DEFAULT 0,
  last_sync_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_assets_status ON assets(status);
CREATE INDEX IF NOT EXISTS idx_assets_user_id ON assets(user_id);

-- ============================================================================
-- JOB_ASSETS (Link between jobs and assets)
-- ============================================================================

CREATE TABLE IF NOT EXISTS job_assets (
  id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL,
  asset_id TEXT NOT NULL,
  user_id TEXT,
  is_dirty BOOLEAN DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
  FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_job_assets_job_id ON job_assets(job_id);
CREATE INDEX IF NOT EXISTS idx_job_assets_asset_id ON job_assets(asset_id);

-- ============================================================================
-- REPORT TEMPLATES
-- ============================================================================

CREATE TABLE IF NOT EXISTS report_templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  report_type TEXT NOT NULL,
  template_schema JSON NOT NULL,
  version INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT 1,
  last_sync_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_report_templates_type ON report_templates(report_type);
CREATE INDEX IF NOT EXISTS idx_report_templates_active ON report_templates(is_active);

-- ============================================================================
-- USERS (Cached for offline reference)
-- ============================================================================

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  first_name TEXT,
  last_name TEXT,
  role TEXT,
  division TEXT,
  phone TEXT,
  last_sync_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_division ON users(division);

-- ============================================================================
-- CUSTOMERS (Cached for offline reference)
-- ============================================================================

CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY,
  name TEXT,
  company_name TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  notes TEXT,
  last_sync_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_customers_company ON customers(company_name);

-- ============================================================================
-- APP SETTINGS
-- ============================================================================

CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default settings
INSERT OR IGNORE INTO app_settings (key, value) VALUES
  ('last_full_sync', NULL),
  ('sync_interval_minutes', '15'),
  ('auto_sync_enabled', 'true'),
  ('offline_mode', 'false'),
  ('current_user_id', NULL),
  ('api_base_url', NULL);

-- ============================================================================
-- CUSTOM FORM TEMPLATES (Report schemas with field configs, dropdowns, etc.)
-- ============================================================================

CREATE TABLE IF NOT EXISTS custom_form_templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  neta_section TEXT,
  created_by TEXT,
  structure JSON NOT NULL,  -- Contains sections with field types, dropdown options, validation
  is_active BOOLEAN DEFAULT 1,
  last_sync_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_custom_form_templates_active ON custom_form_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_custom_form_templates_name ON custom_form_templates(name);

-- ============================================================================
-- CONFLICT RESOLUTION
-- ============================================================================

CREATE TABLE IF NOT EXISTS sync_conflicts (
  id TEXT PRIMARY KEY,
  table_name TEXT NOT NULL,
  record_id TEXT NOT NULL,
  local_data JSON NOT NULL,
  remote_data JSON NOT NULL,
  conflict_type TEXT NOT NULL,
  resolution_strategy TEXT,
  resolved BOOLEAN DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sync_conflicts_resolved ON sync_conflicts(resolved);
CREATE INDEX IF NOT EXISTS idx_sync_conflicts_table ON sync_conflicts(table_name);

