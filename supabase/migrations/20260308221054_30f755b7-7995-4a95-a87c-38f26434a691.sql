-- Fix privilege escalation: users cannot modify approval fields
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles AS PERMISSIVE
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND is_approved = (SELECT is_approved FROM public.profiles WHERE id = auth.uid())
    AND approval_status = (SELECT approval_status FROM public.profiles WHERE id = auth.uid())
  );