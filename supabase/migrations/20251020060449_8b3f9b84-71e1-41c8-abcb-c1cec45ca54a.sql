-- Remove foreign key constraints that reference auth.users
-- This allows custom authentication from Google Sheets without Supabase Auth

ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_id_fkey;

ALTER TABLE public.user_roles 
DROP CONSTRAINT IF EXISTS user_roles_user_id_fkey;

-- Insert default admin user for initial login (works before first sync)
-- Email: ticketstotrip.com@gmail.com
-- Password: 123456
-- Role: admin

INSERT INTO public.profiles (id, email, full_name, phone, password_hash, is_approved)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'ticketstotrip.com@gmail.com',
  'Default Admin',
  '',
  '123456',
  true
)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  password_hash = EXCLUDED.password_hash,
  is_approved = EXCLUDED.is_approved;

-- Create default admin role
INSERT INTO public.user_roles (user_id, role)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'admin'
)
ON CONFLICT (user_id, role) DO NOTHING;

COMMENT ON TABLE public.profiles IS 'User profiles with custom authentication. Default admin: ticketstotrip.com@gmail.com / 123456 (works in all remixed projects)';
