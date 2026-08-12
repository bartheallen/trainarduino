-- Add capstone support to modules
ALTER TABLE modules
  ADD COLUMN IF NOT EXISTS is_capstone BOOLEAN NOT NULL DEFAULT false;

-- Mark the final project module as capstone if it exists.
UPDATE modules
SET is_capstone = true
WHERE titre = 'Projet final : Feu tricolore avec bouton piéton';
