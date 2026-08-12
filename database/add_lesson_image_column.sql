-- Add image support to lessons
ALTER TABLE lessons
  ADD COLUMN IF NOT EXISTS image_url TEXT;
