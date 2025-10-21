-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'consultant');

-- Create enum for lead status
CREATE TYPE public.lead_status AS ENUM ('new', 'contacted', 'qualified', 'proposal_sent', 'negotiation', 'won', 'lost');

-- Create enum for lead priority
CREATE TYPE public.lead_priority AS ENUM ('high', 'medium', 'low');

-- Create enum for hotel category
CREATE TYPE public.hotel_category AS ENUM ('budget', 'standard', 'premium', 'luxury');

-- Create enum for meal plan
CREATE TYPE public.meal_plan AS ENUM ('ep', 'cp', 'map', 'ap');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role app_role,
  is_approved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create leads table
CREATE TABLE public.leads (
  trip_id TEXT PRIMARY KEY,
  date_time TIMESTAMPTZ NOT NULL,
  consultant_id UUID REFERENCES public.profiles(id),
  lead_status lead_status DEFAULT 'new',
  traveller_name TEXT NOT NULL,
  travel_date DATE,
  travel_state TEXT,
  remark_by_consultant TEXT,
  nights INTEGER,
  pax INTEGER,
  hotel_category hotel_category,
  meal_plan meal_plan,
  phone_number TEXT,
  email_id TEXT,
  priority lead_priority DEFAULT 'medium',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create activity log table for tracking calls and WhatsApp
CREATE TABLE public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id TEXT REFERENCES public.leads(trip_id) ON DELETE CASCADE,
  consultant_id UUID REFERENCES public.profiles(id),
  activity_type TEXT NOT NULL, -- 'call', 'whatsapp', 'email'
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create reminders table
CREATE TABLE public.reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id TEXT REFERENCES public.leads(trip_id) ON DELETE CASCADE,
  consultant_id UUID REFERENCES public.profiles(id),
  reminder_date TIMESTAMPTZ NOT NULL,
  message TEXT,
  is_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create settings table for Google Sheets and logo
CREATE TABLE public.settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  google_sheet_url TEXT,
  google_sheet_api_key TEXT,
  logo_url TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin' AND is_approved = TRUE
    )
  );

CREATE POLICY "Admins can update all profiles"
  ON public.profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin' AND is_approved = TRUE
    )
  );

-- Leads policies
CREATE POLICY "Consultants can view their assigned leads"
  ON public.leads FOR SELECT
  USING (
    consultant_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin' AND is_approved = TRUE
    )
  );

CREATE POLICY "Consultants can update their assigned leads"
  ON public.leads FOR UPDATE
  USING (consultant_id = auth.uid());

CREATE POLICY "Admins can manage all leads"
  ON public.leads FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin' AND is_approved = TRUE
    )
  );

-- Activity logs policies
CREATE POLICY "Users can view their activity logs"
  ON public.activity_logs FOR SELECT
  USING (
    consultant_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin' AND is_approved = TRUE
    )
  );

CREATE POLICY "Consultants can insert activity logs"
  ON public.activity_logs FOR INSERT
  WITH CHECK (consultant_id = auth.uid());

-- Reminders policies
CREATE POLICY "Users can view their reminders"
  ON public.reminders FOR SELECT
  USING (
    consultant_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin' AND is_approved = TRUE
    )
  );

CREATE POLICY "Consultants can manage their reminders"
  ON public.reminders FOR ALL
  USING (consultant_id = auth.uid());

-- Settings policies (admin only)
CREATE POLICY "Admins can view settings"
  ON public.settings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin' AND is_approved = TRUE
    )
  );

CREATE POLICY "Admins can update settings"
  ON public.settings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin' AND is_approved = TRUE
    )
  );

-- Create function to handle new user signups
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default settings row
INSERT INTO public.settings (id) VALUES (gen_random_uuid());

-- Enable realtime for leads and reminders
ALTER PUBLICATION supabase_realtime ADD TABLE public.leads;
ALTER PUBLICATION supabase_realtime ADD TABLE public.reminders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_logs;