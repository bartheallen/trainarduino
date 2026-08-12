-- Add circuit instructions support to exercises
ALTER TABLE exercises
  ADD COLUMN IF NOT EXISTS circuit_instructions TEXT;
