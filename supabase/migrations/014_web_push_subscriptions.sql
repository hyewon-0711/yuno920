-- Web Push subscription storage.
-- Apply this migration manually in the Supabase SQL editor.
BEGIN;

CREATE TABLE public.web_push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  expiration_time DOUBLE PRECISION,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX web_push_subscriptions_user_id
  ON public.web_push_subscriptions(user_id);

ALTER TABLE public.web_push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY web_push_subscriptions_select_own
  ON public.web_push_subscriptions FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY web_push_subscriptions_insert_own
  ON public.web_push_subscriptions FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY web_push_subscriptions_update_own
  ON public.web_push_subscriptions FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY web_push_subscriptions_delete_own
  ON public.web_push_subscriptions FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.web_push_subscriptions TO authenticated;
GRANT ALL ON public.web_push_subscriptions TO service_role;

CREATE OR REPLACE FUNCTION public.set_web_push_subscription_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER web_push_subscriptions_updated_at
  BEFORE UPDATE ON public.web_push_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.set_web_push_subscription_updated_at();

COMMIT;
