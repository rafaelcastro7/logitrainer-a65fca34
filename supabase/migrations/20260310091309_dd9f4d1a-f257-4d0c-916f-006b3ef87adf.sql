
-- Drop ALL existing RESTRICTIVE policies and recreate as PERMISSIVE

-- ===== PROFILES =====
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can read own profile" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile safe" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND is_approved = (SELECT p.is_approved FROM public.profiles p WHERE p.id = auth.uid())
    AND approval_status = (SELECT p.approval_status FROM public.profiles p WHERE p.id = auth.uid())
  );

CREATE POLICY "Admins can read all profiles" ON public.profiles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all profiles" ON public.profiles
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ===== PROJECTS =====
DROP POLICY IF EXISTS "Users can CRUD own projects" ON public.projects;
DROP POLICY IF EXISTS "Public projects readable by anyone" ON public.projects;

CREATE POLICY "Users can CRUD own projects" ON public.projects
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Public projects readable by anyone" ON public.projects
  FOR SELECT TO anon, authenticated
  USING (is_public = true);

-- ===== USER_API_KEYS =====
DROP POLICY IF EXISTS "Users can manage own API keys" ON public.user_api_keys;

CREATE POLICY "Users can manage own API keys" ON public.user_api_keys
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ===== USER_ROLES =====
DROP POLICY IF EXISTS "Users can read own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;

CREATE POLICY "Users can read own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
