-- ============================================================================
-- PROFILES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL UNIQUE,
  xp_total INTEGER NOT NULL DEFAULT 0,
  niveau_actuel INTEGER,
  module_actuel_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- New profile fields added for Profile Domain (backwards-compatible)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS display_name TEXT,
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS biography TEXT,
  ADD COLUMN IF NOT EXISTS country TEXT,
  ADD COLUMN IF NOT EXISTS preferred_language TEXT,
  ADD COLUMN IF NOT EXISTS theme_preference TEXT DEFAULT 'system',
  ADD COLUMN IF NOT EXISTS timezone TEXT,
  ADD COLUMN IF NOT EXISTS public_profile BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS privacy_settings JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS learning_preferences JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS streak INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS achievements JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS modules_unlocked JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS statistics JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;
CREATE INDEX IF NOT EXISTS profiles_username_idx ON profiles(username);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
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
    COALESCE(NEW.raw_user_meta_data->>'username', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'display_name', NULL),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NULL),
    NULL,
    COALESCE(NEW.raw_user_meta_data->>'country', NULL),
    COALESCE(NEW.raw_user_meta_data->>'preferred_language', NULL),
    'system',
    COALESCE(NEW.raw_user_meta_data->>'timezone', NULL),
    true,
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
    false
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- MODULES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS modules (
  id SERIAL PRIMARY KEY,
  titre VARCHAR(255) NOT NULL,
  description TEXT,
  ordre INTEGER NOT NULL,
  palier_test INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS modules_ordre_idx ON modules(ordre);
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;

-- Public read access for authenticated users
CREATE POLICY "Anyone authenticated can read modules" ON modules
  FOR SELECT USING (auth.role() = 'authenticated');

-- ============================================================================
-- LESSONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS lessons (
  id SERIAL PRIMARY KEY,
  module_id INTEGER NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  titre VARCHAR(255) NOT NULL,
  contenu TEXT NOT NULL,
  ordre INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS lessons_module_idx ON lessons(module_id);
CREATE INDEX IF NOT EXISTS lessons_ordre_idx ON lessons(ordre);
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;

-- Public read access for authenticated users
CREATE POLICY "Anyone authenticated can read lessons" ON lessons
  FOR SELECT USING (auth.role() = 'authenticated');

-- ============================================================================
-- EXERCISES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS exercises (
  id SERIAL PRIMARY KEY,
  module_id INTEGER NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  titre VARCHAR(255) NOT NULL,
  enonce TEXT NOT NULL,
  critere_correction TEXT,
  exemple_solution TEXT,
  xp_recompense INTEGER DEFAULT 50,
  difficulte VARCHAR(50) DEFAULT 'medium',
  wokwi_project_url TEXT,
  ordre INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS exercises_module_idx ON exercises(module_id);
CREATE INDEX IF NOT EXISTS exercises_difficulte_idx ON exercises(difficulte);
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;

-- Public read access for authenticated users
CREATE POLICY "Anyone authenticated can read exercises" ON exercises
  FOR SELECT USING (auth.role() = 'authenticated');

-- ============================================================================
-- SUBMISSIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS submissions (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_id INTEGER NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  code_soumis TEXT NOT NULL,
  feedback_ia TEXT,
  statut VARCHAR(50) DEFAULT 'pending',
  video_url TEXT,
  xp_gagne INTEGER DEFAULT 0,
  note NUMERIC(3,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, exercise_id)
);

CREATE INDEX IF NOT EXISTS submissions_user_idx ON submissions(user_id);
CREATE INDEX IF NOT EXISTS submissions_exercise_idx ON submissions(exercise_id);
CREATE INDEX IF NOT EXISTS submissions_statut_idx ON submissions(statut);
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

-- Users can view their own submissions
CREATE POLICY "Users can view their own submissions" ON submissions
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own submissions
CREATE POLICY "Users can insert their own submissions" ON submissions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own submissions
CREATE POLICY "Users can update their own submissions" ON submissions
  FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================================
-- AI EVALUATIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS ai_evaluations (
  id SERIAL PRIMARY KEY,
  submission_id INTEGER NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  model_name VARCHAR(100) NOT NULL,
  prompt_used TEXT,
  evaluation_result JSONB NOT NULL,
  score NUMERIC(5,4) DEFAULT 0,
  suggestions TEXT[] DEFAULT '{}',
  tokens_used INTEGER DEFAULT 0,
  cost_cents NUMERIC(8,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS ai_evaluations_submission_id_idx ON ai_evaluations(submission_id);
CREATE INDEX IF NOT EXISTS ai_evaluations_model_name_idx ON ai_evaluations(model_name);

ALTER TABLE ai_evaluations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own AI evaluations" ON ai_evaluations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM submissions WHERE submissions.id = ai_evaluations.submission_id AND submissions.user_id = auth.uid()
    )
  );

-- ============================================================================
-- LEARNING MEMORY RECORDS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS learning_memory_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_id INTEGER REFERENCES exercises(id) ON DELETE SET NULL,
  submission_id INTEGER REFERENCES submissions(id) ON DELETE SET NULL,
  record_type TEXT NOT NULL,
  content TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS learning_memory_records_user_idx ON learning_memory_records(user_id);
CREATE INDEX IF NOT EXISTS learning_memory_records_exercise_idx ON learning_memory_records(exercise_id);
CREATE INDEX IF NOT EXISTS learning_memory_records_submission_idx ON learning_memory_records(submission_id);
CREATE INDEX IF NOT EXISTS learning_memory_records_record_type_idx ON learning_memory_records(record_type);

ALTER TABLE learning_memory_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own learning memory records" ON learning_memory_records
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own learning memory records" ON learning_memory_records
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own learning memory records" ON learning_memory_records
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- AI CONVERSATIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  topic TEXT,
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS ai_conversations_user_idx ON ai_conversations(user_id);
CREATE INDEX IF NOT EXISTS ai_conversations_topic_idx ON ai_conversations(topic);

ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own AI conversations" ON ai_conversations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own AI conversations" ON ai_conversations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own AI conversations" ON ai_conversations
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- PROGRESS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS progress (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id INTEGER NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  statut VARCHAR(50) DEFAULT 'locked',
  score INTEGER DEFAULT 0,
  exercices_completes INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, module_id)
);

CREATE INDEX IF NOT EXISTS progress_user_idx ON progress(user_id);
CREATE INDEX IF NOT EXISTS progress_module_idx ON progress(module_id);
CREATE INDEX IF NOT EXISTS progress_statut_idx ON progress(statut);
ALTER TABLE progress ENABLE ROW LEVEL SECURITY;

-- Users can view their own progress
CREATE POLICY "Users can view their own progress" ON progress
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own progress
CREATE POLICY "Users can insert their own progress" ON progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own progress
CREATE POLICY "Users can update their own progress" ON progress
  FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================================
-- POSITIONING_TEST_RESULTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS positioning_test_results (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  palier_atteint INTEGER NOT NULL,
  score INTEGER,
  reponses_correctes INTEGER,
  total_questions INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS positioning_test_results_user_idx ON positioning_test_results(user_id);
CREATE INDEX IF NOT EXISTS positioning_test_results_palier_idx ON positioning_test_results(palier_atteint);
ALTER TABLE positioning_test_results ENABLE ROW LEVEL SECURITY;

-- Users can view their own test results
CREATE POLICY "Users can view their own test results" ON positioning_test_results
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own test results
CREATE POLICY "Users can insert their own test results" ON positioning_test_results
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- UTILITY FUNCTION: Update updated_at timestamp
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS: Auto-update updated_at on all tables
-- ============================================================================
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_modules_updated_at
  BEFORE UPDATE ON modules FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lessons_updated_at
  BEFORE UPDATE ON lessons FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_exercises_updated_at
  BEFORE UPDATE ON exercises FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_submissions_updated_at
  BEFORE UPDATE ON submissions FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_progress_updated_at
  BEFORE UPDATE ON progress FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- INDEXES FOR COMMON QUERIES
-- ============================================================================
CREATE INDEX IF NOT EXISTS submissions_exercise_user_idx ON submissions(exercise_id, user_id);
CREATE INDEX IF NOT EXISTS submissions_created_at_idx ON submissions(created_at);
CREATE INDEX IF NOT EXISTS progress_created_at_idx ON progress(created_at);
CREATE INDEX IF NOT EXISTS exercises_module_ordre_idx ON exercises(module_id, ordre);

-- ============================================================================
-- LEARNING ENGINE: Concepts, Skills, Experiences, Projects (additive)
-- ============================================================================

CREATE TABLE IF NOT EXISTS concepts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS concepts_slug_idx ON concepts(slug);

-- Per-concept prerequisites
CREATE TABLE IF NOT EXISTS concept_dependencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  concept_id UUID NOT NULL REFERENCES concepts(id) ON DELETE CASCADE,
  prerequisite_id UUID NOT NULL REFERENCES concepts(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Per-user concept state used by the memory engine
CREATE TABLE IF NOT EXISTS concept_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  concept_id UUID NOT NULL REFERENCES concepts(id) ON DELETE CASCADE,
  state TEXT DEFAULT 'UNKNOWN',
  mastery_score NUMERIC(5,2) DEFAULT 0,
  retention_score NUMERIC(6,4) DEFAULT 1,
  last_review TIMESTAMP WITH TIME ZONE,
  predicted_forget_date TIMESTAMP WITH TIME ZONE,
  review_urgency INTEGER DEFAULT 0,
  attempts INTEGER DEFAULT 0,
  successful_attempts INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, concept_id)
);

-- Mastery history for concepts
CREATE TABLE IF NOT EXISTS concept_mastery_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  concept_id UUID NOT NULL REFERENCES concepts(id) ON DELETE CASCADE,
  mastery_score NUMERIC(5,2) DEFAULT 0,
  retention_score NUMERIC(6,4) DEFAULT 1,
  source TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Per-user learning DNA
CREATE TABLE IF NOT EXISTS learning_dna (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  traits JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  concept_id UUID REFERENCES concepts(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS skills_slug_idx ON skills(slug);

CREATE TABLE IF NOT EXISTS skill_dependencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  depends_on_skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  weight INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS experiences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  summary TEXT,
  interactive_content JSONB DEFAULT '{}'::jsonb,
  estimated_minutes INTEGER DEFAULT 10,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS experiences_slug_idx ON experiences(slug);

-- Map exercises (existing) to experiences; preserve existing exercises table
ALTER TABLE exercises
  ADD COLUMN IF NOT EXISTS experience_id UUID REFERENCES experiences(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS xp_reward INTEGER DEFAULT 50,
  ADD COLUMN IF NOT EXISTS skills_learned JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS skills_required JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS skills_reused JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS is_boss BOOLEAN DEFAULT false;

CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  is_boss BOOLEAN DEFAULT false,
  required_skills JSONB DEFAULT '[]'::jsonb,
  transversal BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS projects_slug_idx ON projects(slug);

-- Map project dependencies to multiple laboratories/modules in future
CREATE TABLE IF NOT EXISTS project_skill_map (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  role TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Per-user skill mastery with forgetting metadata
CREATE TABLE IF NOT EXISTS skill_mastery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  mastery_percent NUMERIC(5,2) DEFAULT 0,
  xp_earned INTEGER DEFAULT 0,
  last_used TIMESTAMP WITH TIME ZONE,
  confidence_score NUMERIC(5,2) DEFAULT 0,
  forgetting_score NUMERIC(5,2) DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, skill_id)
);

CREATE INDEX IF NOT EXISTS skill_mastery_user_idx ON skill_mastery(user_id);

-- Events table for append-only domain events
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  type TEXT NOT NULL,
  payload JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- MISSION ENGINE: missions, steps, rewards, unlocks, progress
-- ============================================================================

CREATE TABLE IF NOT EXISTS missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  briefing TEXT,
  summary TEXT,
  concepts JSONB DEFAULT '[]'::jsonb,
  skills JSONB DEFAULT '[]'::jsonb,
  exercises JSONB DEFAULT '[]'::jsonb,
  rewards JSONB DEFAULT '[]'::jsonb,
  difficulty INTEGER DEFAULT 1,
  estimated_minutes INTEGER DEFAULT 15,
  prerequisites JSONB DEFAULT '[]'::jsonb,
  unlocked BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS missions_slug_idx ON missions(slug);

CREATE TABLE IF NOT EXISTS mission_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id UUID NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
  step_index INTEGER NOT NULL,
  title TEXT,
  description TEXT,
  type TEXT DEFAULT 'experience', -- experience|exercise|project
  meta JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS mission_steps_mission_idx ON mission_steps(mission_id);

CREATE TABLE IF NOT EXISTS mission_unlock_conditions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id UUID NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
  condition JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS mission_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mission_id UUID NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'not_started', -- not_started|in_progress|completed
  current_step INTEGER DEFAULT 0,
  progress JSONB DEFAULT '{}'::jsonb,
  rewards_granted JSONB DEFAULT '[]'::jsonb,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, mission_id)
);

CREATE INDEX IF NOT EXISTS mission_progress_user_idx ON mission_progress(user_id);

-- RLS: users can view/insert/update their own mission_progress
ALTER TABLE mission_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own mission progress" ON mission_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own mission progress" ON mission_progress
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert their own mission progress" ON mission_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- ADAPTIVE LEARNING: student learning profiles, recommendations, projections
-- ============================================================================

CREATE TABLE IF NOT EXISTS student_learning_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  concept_mastery JSONB DEFAULT '{}'::jsonb,
  skill_mastery JSONB DEFAULT '{}'::jsonb,
  avg_solving_time_ms INTEGER DEFAULT 0,
  retry_count INTEGER DEFAULT 0,
  review_history JSONB DEFAULT '[]'::jsonb,
  learning_velocity NUMERIC(6,3) DEFAULT 0,
  forgetting_rate NUMERIC(6,3) DEFAULT 0,
  preferred_exercise_type TEXT DEFAULT 'code',
  preferred_project_difficulty INTEGER DEFAULT 1,
  confidence_score NUMERIC(5,2) DEFAULT 0,
  weak_concepts JSONB DEFAULT '[]'::jsonb,
  strong_concepts JSONB DEFAULT '[]'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS slp_user_idx ON student_learning_profiles(user_id);

CREATE TABLE IF NOT EXISTS recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  type TEXT NOT NULL,
  payload JSONB DEFAULT '{}'::jsonb,
  score NUMERIC(5,2) DEFAULT 0,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  consumed BOOLEAN DEFAULT false
);

CREATE INDEX IF NOT EXISTS recommendations_user_idx ON recommendations(user_id);

CREATE TABLE IF NOT EXISTS dashboard_projections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  next_missions JSONB DEFAULT '[]'::jsonb,
  recommendations JSONB DEFAULT '[]'::jsonb,
  knowledge_to_review JSONB DEFAULT '[]'::jsonb,
  weak_skills JSONB DEFAULT '[]'::jsonb,
  learning_velocity NUMERIC(6,3) DEFAULT 0,
  weekly_progress JSONB DEFAULT '[]'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS dashboard_user_idx ON dashboard_projections(user_id);

-- Memory-engine specific dashboard projections (separate table used by memory engine)
CREATE TABLE IF NOT EXISTS memory_dashboard_projections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  knowledge_health NUMERIC(5,2) DEFAULT 0,
  mastery_percent NUMERIC(5,2) DEFAULT 0,
  weak_concepts JSONB DEFAULT '[]'::jsonb,
  strong_concepts JSONB DEFAULT '[]'::jsonb,
  todays_reviews JSONB DEFAULT '[]'::jsonb,
  upcoming_reviews JSONB DEFAULT '[]'::jsonb,
  heatmap JSONB DEFAULT '{}'::jsonb,
  learning_dna JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id)
);

-- Memory events table used by memory engine event sourcing
CREATE TABLE IF NOT EXISTS memory_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  concept_id UUID,
  event_type TEXT NOT NULL,
  payload JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS recommendation_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recommendation_id UUID REFERENCES recommendations(id),
  user_id UUID REFERENCES auth.users(id),
  event_type TEXT NOT NULL,
  payload JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- RECOMMENDATION ENGINE: decision history and feedback
-- ============================================================================

CREATE TABLE IF NOT EXISTS recommendation_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  recommendation_id UUID REFERENCES recommendations(id),
  type TEXT NOT NULL,
  payload JSONB DEFAULT '{}'::jsonb,
  score NUMERIC(6,3) DEFAULT 0,
  rationale JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS recommendation_history_user_idx ON recommendation_history(user_id);

CREATE TABLE IF NOT EXISTS recommendation_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recommendation_history_id UUID REFERENCES recommendation_history(id),
  user_id UUID REFERENCES auth.users(id),
  feedback TEXT,
  rating INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Recommendation learning: per-recommendation and per-concept weights
CREATE TABLE IF NOT EXISTS recommendation_weights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recommendation_id UUID,
  concept TEXT,
  value NUMERIC(5,3) DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS recommendation_weights_recommendation_idx ON recommendation_weights(recommendation_id);
CREATE INDEX IF NOT EXISTS recommendation_weights_concept_idx ON recommendation_weights(concept);




