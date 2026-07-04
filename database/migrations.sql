-- ============================================================================
-- PROFILES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  pseudo VARCHAR(255) NOT NULL UNIQUE,
  xp_total INTEGER DEFAULT 0,
  niveau_actuel INTEGER DEFAULT 1,
  module_actuel_id INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS profiles_pseudo_idx ON profiles(pseudo);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

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
