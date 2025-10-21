-- Add sync_to_sheet flag to track if changes should be written back
ALTER TABLE leads ADD COLUMN IF NOT EXISTS sync_to_sheet boolean DEFAULT true;

-- Add last_synced_at to track sync status
ALTER TABLE leads ADD COLUMN IF NOT EXISTS last_synced_at timestamp with time zone;

-- Add activity tracking columns
ALTER TABLE activity_logs ADD COLUMN IF NOT EXISTS duration_seconds integer;
ALTER TABLE activity_logs ADD COLUMN IF NOT EXISTS call_status text;