-- Kyroo App — Database Schema

CREATE TABLE IF NOT EXISTS users (
  id              SERIAL PRIMARY KEY,
  email           VARCHAR(255) UNIQUE NOT NULL,
  password_hash   VARCHAR(255),
  name            VARCHAR(100) NOT NULL DEFAULT 'Kyroo User',
  is_premium      BOOLEAN NOT NULL DEFAULT false,
  email_verified  BOOLEAN NOT NULL DEFAULT false,
  verify_token    VARCHAR(255),
  created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS plans (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  description TEXT,
  tag         VARCHAR(50),
  category    VARCHAR(50),
  icon        VARCHAR(50),
  color       VARCHAR(20),
  sort_order  INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS questionnaires (
  id                 SERIAL PRIMARY KEY,
  user_id            INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_id            INT REFERENCES plans(id),
  gender             VARCHAR(50),
  age                INT,
  weight_kg          DECIMAL(5,1),
  height_cm          DECIMAL(5,1),
  fitness_level      VARCHAR(50),
  training_frequency VARCHAR(50),
  session_duration   VARCHAR(50),
  primary_goal       VARCHAR(100),
  created_at         TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS programs (
  id                SERIAL PRIMARY KEY,
  user_id           INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_id           INT REFERENCES plans(id),
  questionnaire_id  INT REFERENCES questionnaires(id),
  total_weeks       INT NOT NULL DEFAULT 16,
  current_week      INT NOT NULL DEFAULT 1,
  created_at        TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS program_days (
  id         SERIAL PRIMARY KEY,
  program_id INT NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  day_name   VARCHAR(20) NOT NULL,
  focus      VARCHAR(100),
  exercises  JSONB NOT NULL DEFAULT '[]',
  sort_order INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS habits (
  id   SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS habit_logs (
  id          SERIAL PRIMARY KEY,
  user_id     INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  habit_id    INT NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  logged_date DATE NOT NULL DEFAULT CURRENT_DATE,
  UNIQUE (user_id, habit_id, logged_date)
);

CREATE TABLE IF NOT EXISTS mood_logs (
  id          SERIAL PRIMARY KEY,
  user_id     INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mood_index  INT NOT NULL,
  logged_date DATE NOT NULL DEFAULT CURRENT_DATE,
  UNIQUE (user_id, logged_date)
);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id         SERIAL PRIMARY KEY,
  user_id    INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token      VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  used       BOOLEAN NOT NULL DEFAULT false
);
