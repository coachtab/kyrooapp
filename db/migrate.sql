-- Kyroo App — Migration
-- Safe to run multiple times (uses IF NOT EXISTS / DO NOTHING)

-- Plans: add display metadata
ALTER TABLE plans ADD COLUMN IF NOT EXISTS difficulty      VARCHAR(20) DEFAULT 'intermediate';
ALTER TABLE plans ADD COLUMN IF NOT EXISTS duration_weeks  INT         DEFAULT 16;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS frequency_per_week INT      DEFAULT 4;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS total_weeks     INT         DEFAULT 16;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS details         TEXT;

-- Questionnaires: add fields matching the mobile onboarding form
ALTER TABLE questionnaires ADD COLUMN IF NOT EXISTS experience   VARCHAR(100);
ALTER TABLE questionnaires ADD COLUMN IF NOT EXISTS days_per_week INT;
ALTER TABLE questionnaires ADD COLUMN IF NOT EXISTS session_mins  INT;
ALTER TABLE questionnaires ADD COLUMN IF NOT EXISTS equipment     VARCHAR(100);
ALTER TABLE questionnaires ADD COLUMN IF NOT EXISTS injuries      VARCHAR(100);
ALTER TABLE questionnaires ADD COLUMN IF NOT EXISTS motivation    VARCHAR(100);
ALTER TABLE questionnaires ADD COLUMN IF NOT EXISTS commitment    INT;

-- Programs: add human-readable name
ALTER TABLE programs ADD COLUMN IF NOT EXISTS name VARCHAR(100);

-- Habits: unique constraint so seed ON CONFLICT works
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'habits_name_unique'
  ) THEN
    ALTER TABLE habits ADD CONSTRAINT habits_name_unique UNIQUE (name);
  END IF;
END$$;
