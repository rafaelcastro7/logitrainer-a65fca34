
-- Referral system tables
CREATE TABLE public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL,
  referred_id uuid,
  referral_code text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'pending',
  reward_claimed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  converted_at timestamptz
);

-- Create unique referral code per user
CREATE UNIQUE INDEX idx_referrals_referrer_code ON public.referrals (referrer_id, referral_code);

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- Users can read their own referrals
CREATE POLICY "Users read own referrals" ON public.referrals
  FOR SELECT TO authenticated
  USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

-- Users can create referrals
CREATE POLICY "Users create referrals" ON public.referrals
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = referrer_id);

-- Users can update own referrals
CREATE POLICY "Users update own referrals" ON public.referrals
  FOR UPDATE TO authenticated
  USING (auth.uid() = referrer_id);

-- Admins manage all
CREATE POLICY "Admins manage referrals" ON public.referrals
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Function to get or create referral code
CREATE OR REPLACE FUNCTION public.get_or_create_referral_code(p_user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_code text;
BEGIN
  SELECT referral_code INTO v_code FROM public.referrals
  WHERE referrer_id = p_user_id AND referred_id IS NULL
  LIMIT 1;
  
  IF v_code IS NULL THEN
    v_code := substr(md5(p_user_id::text || now()::text), 1, 8);
    INSERT INTO public.referrals (referrer_id, referral_code)
    VALUES (p_user_id, v_code);
  END IF;
  
  RETURN v_code;
END;
$$;

-- Function to apply referral
CREATE OR REPLACE FUNCTION public.apply_referral(p_code text, p_referred_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_referral_id uuid;
BEGIN
  SELECT id INTO v_referral_id FROM public.referrals
  WHERE referral_code = p_code AND referred_id IS NULL AND referrer_id != p_referred_id
  LIMIT 1;
  
  IF v_referral_id IS NULL THEN
    RETURN false;
  END IF;
  
  UPDATE public.referrals
  SET referred_id = p_referred_id, status = 'converted', converted_at = now()
  WHERE id = v_referral_id;
  
  -- Create a new pending referral for the referrer
  INSERT INTO public.referrals (referrer_id, referral_code)
  VALUES (
    (SELECT referrer_id FROM public.referrals WHERE id = v_referral_id),
    substr(md5(v_referral_id::text || now()::text), 1, 8)
  );
  
  RETURN true;
END;
$$;
