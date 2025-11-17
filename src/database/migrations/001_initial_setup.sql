-- Migration: Initial setup and indexes
-- This migration is applied after the main schema.sql

-- Additional indexes for performance
CREATE INDEX IF NOT EXISTS idx_jobs_customer_id ON jobs(customer_id);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at);
CREATE INDEX IF NOT EXISTS idx_sync_queue_table_record ON sync_queue(table_name, record_id);

-- Sample settings
INSERT OR IGNORE INTO app_settings (key, value) VALUES
  ('app_version', '0.1.0'),
  ('db_version', '1');

