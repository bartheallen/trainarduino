-- Remove the deprecated streak system from existing deployments.
ALTER TABLE public.profiles
  DROP COLUMN IF EXISTS streak,
  DROP COLUMN IF EXISTS last_active_at;
