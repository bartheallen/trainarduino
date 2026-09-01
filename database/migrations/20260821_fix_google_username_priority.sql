-- Ensure new Google profiles prefer explicit usernames over other metadata.
CREATE EXTENSION IF NOT EXISTS unaccent;

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
  v_full_name TEXT;
  v_username_from_meta TEXT;
  v_preferred_username TEXT;
  v_email_local TEXT;
BEGIN
  v_username_from_meta := NULLIF(TRIM(NEW.raw_user_meta_data->>'username'), '');
  v_preferred_username := NULLIF(TRIM(NEW.raw_user_meta_data->>'preferred_username'), '');
  v_full_name := NULLIF(TRIM(COALESCE(
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'full_name'
  )), '');

  IF NEW.email IS NOT NULL AND NEW.email LIKE '%@%' THEN
    v_email_local := SPLIT_PART(NEW.email, '@', 1);
  END IF;

  v_raw_display_name := COALESCE(v_full_name, v_username_from_meta, v_preferred_username, v_email_local, 'Utilisateur');
  v_candidate_base := COALESCE(v_username_from_meta, v_preferred_username, v_full_name, v_email_local, 'Utilisateur');

  v_base_username := SUBSTRING(
    REGEXP_REPLACE(
      REGEXP_REPLACE(
        REGEXP_REPLACE(LOWER(UNACCENT(TRIM(v_candidate_base))), '[^a-z0-9_]+', '_', 'g'),
        '^_+|_+$', '', 'g'
      ),
      '_+', '_', 'g'
    ),
    1,
    24
  );

  IF v_base_username = '' OR v_base_username IS NULL THEN
    v_base_username := 'user_' || SUBSTRING(NEW.id::TEXT, 1, 8);
  END IF;

  v_final_username := v_base_username;
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = v_final_username AND id != NEW.id) LOOP
    v_final_username := v_base_username || '_' || v_suffix;
    v_suffix := v_suffix + 1;
  END LOOP;

  INSERT INTO public.profiles (id, username, display_name, avatar_url, biography, country, preferred_language, theme_preference, timezone, public_profile, privacy_settings, learning_preferences, notification_preferences, xp_total, niveau_actuel, module_actuel_id, streak, achievements, modules_unlocked, statistics, is_admin)
  VALUES (
    NEW.id,
    v_final_username,
    TRIM(v_raw_display_name),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture'),
    NULL,
    NULL,
    'fr',
    'system',
    NULL,
    TRUE,
    '{}'::jsonb,
    '{}'::jsonb,
    '{}'::jsonb,
    0,
    NULL,
    NULL,
    0,
    '[]'::jsonb,
    '[]'::jsonb,
    '{}'::jsonb,
    FALSE
  );

  RETURN NEW;
END;
$$;
