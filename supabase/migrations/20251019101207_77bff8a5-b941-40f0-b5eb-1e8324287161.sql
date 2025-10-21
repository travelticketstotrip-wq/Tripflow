-- Add google_service_account_json column to settings table
ALTER TABLE public.settings 
ADD COLUMN IF NOT EXISTS google_service_account_json TEXT;

-- Add comment for clarity
COMMENT ON COLUMN public.settings.google_service_account_json IS 'Stores the Google Service Account JSON credentials for API access';