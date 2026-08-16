-- ============================================================================
-- MIGRATION: Fix username slugification in handle_new_user trigger
-- Date: 2026-08-16
-- Purpose: Ensure database trigger matches JavaScript buildGoogleProfileIdentity()
--          logic for proper username generation with accent removal and deduplication
-- ============================================================================

-- Enable unaccent extension for accent removal
CREATE EXTENSION IF NOT EXISTS unaccent;

-- Drop existing trigger and function to recreate with corrected logic
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create corrected handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_username TEXT;
  v_base_username TEXT;
  v_final_username TEXT;
  v_suffix INT := 2;
  v_raw_display_name TEXT;
  v_candidate_base TEXT;
  v_given_name TEXT;
  v_family_name TEXT;
  v_full_name TEXT;
  v_username_from_meta TEXT;
  v_preferred_username TEXT;
  v_email_local TEXT;
BEGIN
  -- Extract metadata fields with type checking
  v_preferred_username := NULLIF(TRIM(NEW.raw_user_meta_data->>'preferred_username'), '');
  v_given_name := NULLIF(TRIM(NEW.raw_user_meta_data->>'given_name'), '');
  v_family_name := NULLIF(TRIM(NEW.raw_user_meta_data->>'family_name'), '');
  v_full_name := NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), '');
  IF v_full_name IS NULL THEN
    v_full_name := NULLIF(TRIM(NEW.raw_user_meta_data->>'name'), '');
  END IF;
  v_username_from_meta := NULLIF(TRIM(NEW.raw_user_meta_data->>'username'), '');
  
  -- Extract email local part (before @)
  IF NEW.email IS NOT NULL AND NEW.email LIKE '%@%' THEN
    v_email_local := SPLIT_PART(NEW.email, '@', 1);
  END IF;
  
  -- Build raw display name (for display_name column)
  v_raw_display_name := COALESCE(
    v_full_name,
    v_username_from_meta,
    v_preferred_username,
    (CASE WHEN v_given_name IS NOT NULL AND v_family_name IS NOT NULL 
      THEN v_given_name || ' ' || v_family_name 
      ELSE COALESCE(v_given_name, v_family_name) END),
    v_email_local,
    'Utilisateur'
  );
  
  -- Build candidate base for username slugification
  -- Priority: preferred_username > given_name+family_name > full_name > name > email_local
  v_candidate_base := COALESCE(
    v_preferred_username,
    (CASE WHEN v_given_name IS NOT NULL AND v_family_name IS NOT NULL 
      THEN v_given_name || ' ' || v_family_name 
      ELSE COALESCE(v_given_name, v_family_name, v_full_name, v_username_from_meta, v_raw_display_name, v_email_local) END),
    v_email_local,
    'Utilisateur'
  );
  
  -- Slugify: normalize accents, lowercase, replace non-alphanumeric with underscores
  v_base_username := SUBSTRING(
    REGEXP_REPLACE(
      REGEXP_REPLACE(
        REGEXP_REPLACE(
          LOWER(
            UNACCENT(TRIM(v_candidate_base))
          ),
          '[^a-z0-9_]+'::text,
          '_'::text,
          'g'
        ),
        '^_+|_+$'::text,
        ''::text,
        'g'
      ),
      '_+'::text,
      '_'::text,
      'g'
    ),
    1,
    24
  );
  
  -- Fallback if slugified is empty
  IF v_base_username = '' OR v_base_username IS NULL THEN
    v_base_username := 'user_' || SUBSTRING(NEW.id::TEXT, 1, 8);
  END IF;
  
  -- Initialize final username
  v_final_username := v_base_username;
  
  -- Check for uniqueness and deduplicate with numeric suffix if needed
  WHILE EXISTS(SELECT 1 FROM public.profiles WHERE username = v_final_username AND id != NEW.id) LOOP
    v_final_username := v_base_username || '_' || v_suffix;
    v_suffix := v_suffix + 1;
  END LOOP;
  
  -- Insert the profile with all fields
  INSERT INTO public.profiles (
    id,
    username,
    display_name,
    avatar_url,
    biography,
    country,
    preferred_language,
    theme_preference,
    timezone,
    public_profile,
    privacy_settings,
    learning_preferences,
    notification_preferences,
    xp_total,
    niveau_actuel,
    module_actuel_id,
    streak,
    achievements,
    modules_unlocked,
    statistics,
    is_admin
  )
  VALUES (
    NEW.id,
    v_final_username,
    TRIM(v_raw_display_name),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture'),
    NULL,
    NULLIF(TRIM(NEW.raw_user_meta_data->>'country'), ''),
    COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'preferred_language'), ''), 'fr'),
    'system',
    NULLIF(TRIM(NEW.raw_user_meta_data->>'timezone'), ''),
    TRUE,
    '{}'::jsonb,
    '{}'::jsonb,
    '{}'::jsonb,
    0,
    NULL,
    NULL,
    0,
    '[]'::jsonb,
    (CASE WHEN (SELECT id FROM modules ORDER BY ordre LIMIT 1) IS NOT NULL
      THEN jsonb_build_array((SELECT id FROM modules ORDER BY ordre LIMIT 1))
      ELSE '[]'::jsonb END),
    '{}'::jsonb,
    FALSE
  );
  
  RETURN NEW;
END;
$$;

-- Recreate trigger
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- NOTES:
-- ============================================================================
-- This migration corrects the handle_new_user trigger to:
-- 1. Properly slugify usernames (remove accents, normalize to lowercase, replace non-alphanumeric)
-- 2. Match the JavaScript buildGoogleProfileIdentity() function logic exactly
-- 3. Handle deduplication with numeric suffixes
-- 4. Support extended profile fields (display_name, avatar_url, country, etc.)
-- 
-- The previous version (supabase-profiles-migration.sql) was a minimal schema
-- that didn't include these extended fields and had inconsistent username logic.
-- 
-- After applying this migration manually in Supabase SQL Editor:
-- 1. All NEW users will get properly slugified usernames
-- 2. Existing users' usernames will NOT be changed (trigger only runs on INSERT)
-- 3. If you need to fix existing usernames, a separate migration would be needed
-- ============================================================================
