-- Fix infinite recursion in RLS policies by creating separate user_roles table

-- 1. Create user_roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    UNIQUE (user_id, role)
);

-- 2. Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 3. Create security definer function to check roles without recursion
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- 4. Create function to check if user is approved
CREATE OR REPLACE FUNCTION public.is_user_approved(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT is_approved FROM public.profiles WHERE id = _user_id),
    FALSE
  )
$$;

-- 5. Migrate existing roles from profiles to user_roles
INSERT INTO public.user_roles (user_id, role)
SELECT id, role
FROM public.profiles
WHERE role IS NOT NULL
ON CONFLICT (user_id, role) DO NOTHING;

-- 6. Drop old problematic policies
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- 7. Create new safe policies for profiles
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (
    auth.uid() = id OR 
    (public.has_role(auth.uid(), 'admin') AND public.is_user_approved(auth.uid()))
  );

CREATE POLICY "Admins can update all profiles"
  ON public.profiles FOR UPDATE
  USING (
    auth.uid() = id OR 
    (public.has_role(auth.uid(), 'admin') AND public.is_user_approved(auth.uid()))
  );

-- 8. Update leads policies
DROP POLICY IF EXISTS "Consultants can view their assigned leads" ON public.leads;
DROP POLICY IF EXISTS "Admins can manage all leads" ON public.leads;

CREATE POLICY "Consultants can view their assigned leads"
  ON public.leads FOR SELECT
  USING (
    consultant_id = auth.uid() OR
    (public.has_role(auth.uid(), 'admin') AND public.is_user_approved(auth.uid()))
  );

CREATE POLICY "Admins can manage all leads"
  ON public.leads FOR ALL
  USING (
    public.has_role(auth.uid(), 'admin') AND public.is_user_approved(auth.uid())
  );

-- 9. Update activity_logs policies
DROP POLICY IF EXISTS "Users can view their activity logs" ON public.activity_logs;

CREATE POLICY "Users can view their activity logs"
  ON public.activity_logs FOR SELECT
  USING (
    consultant_id = auth.uid() OR
    (public.has_role(auth.uid(), 'admin') AND public.is_user_approved(auth.uid()))
  );

-- 10. Update reminders policies
DROP POLICY IF EXISTS "Users can view their reminders" ON public.reminders;

CREATE POLICY "Users can view their reminders"
  ON public.reminders FOR SELECT
  USING (
    consultant_id = auth.uid() OR
    (public.has_role(auth.uid(), 'admin') AND public.is_user_approved(auth.uid()))
  );

-- 11. Update settings policies
DROP POLICY IF EXISTS "Admins can view settings" ON public.settings;
DROP POLICY IF EXISTS "Admins can update settings" ON public.settings;

CREATE POLICY "Admins can view settings"
  ON public.settings FOR SELECT
  USING (
    public.has_role(auth.uid(), 'admin') AND public.is_user_approved(auth.uid())
  );

CREATE POLICY "Admins can update settings"
  ON public.settings FOR ALL
  USING (
    public.has_role(auth.uid(), 'admin') AND public.is_user_approved(auth.uid())
  );

-- 12. Create RLS policies for user_roles (admins can manage)
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage all roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));