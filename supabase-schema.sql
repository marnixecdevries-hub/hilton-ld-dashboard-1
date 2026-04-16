-- Hilton L&D Dashboard - Supabase Schema
-- Run this in the Supabase SQL Editor

-- 1. Hotels reference table
CREATE TABLE hotels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Seed hotels
INSERT INTO hotels (code, name) VALUES
  ('AMSCS', 'Conrad Amsterdam'),
  ('AMSAP', 'Waldorf Astoria Amsterdam'),
  ('AMSHI', 'Hilton Amsterdam'),
  ('AMSWA', 'DoubleTree Amsterdam Centraal Station'),
  ('AMSHH', 'Hampton by Hilton Amsterdam'),
  ('RTMHI', 'Hilton Rotterdam'),
  ('SPLSO', 'Hilton Garden Inn Leiden'),
  ('ANRHI', 'Hilton Antwerp');

-- 2. Evaluations table
CREATE TABLE evaluations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_code text NOT NULL REFERENCES hotels(code),
  trainer_name text NOT NULL,
  trainer_department text NOT NULL,
  manager_name text NOT NULL,
  manager_department text NOT NULL,
  evaluation_date date NOT NULL,
  score_work_area smallint NOT NULL CHECK (score_work_area BETWEEN 1 AND 5),
  score_appearance smallint NOT NULL CHECK (score_appearance BETWEEN 1 AND 5),
  score_body_language smallint NOT NULL CHECK (score_body_language BETWEEN 1 AND 5),
  score_voice smallint NOT NULL CHECK (score_voice BETWEEN 1 AND 5),
  score_attention smallint NOT NULL CHECK (score_attention BETWEEN 1 AND 5),
  score_preparation smallint NOT NULL CHECK (score_preparation BETWEEN 1 AND 5),
  score_demonstration smallint NOT NULL CHECK (score_demonstration BETWEEN 1 AND 5),
  score_practice smallint NOT NULL CHECK (score_practice BETWEEN 1 AND 5),
  score_follow_through smallint NOT NULL CHECK (score_follow_through BETWEEN 1 AND 5),
  score_question_techniques smallint NOT NULL CHECK (score_question_techniques BETWEEN 1 AND 5),
  avg_presentation numeric(3,2) NOT NULL,
  avg_delivery numeric(3,2) NOT NULL,
  avg_coaching numeric(3,2) NOT NULL,
  avg_overall numeric(3,2) NOT NULL,
  strengths text NOT NULL,
  development_areas text NOT NULL,
  notes_work_area text,
  notes_appearance text,
  notes_body_language text,
  notes_voice text,
  notes_attention text,
  notes_preparation text,
  notes_demonstration text,
  notes_practice text,
  notes_follow_through text,
  notes_question_techniques text,
  created_at timestamptz DEFAULT now()
);

-- 3. Indexes
CREATE INDEX idx_evaluations_hotel ON evaluations(hotel_code);
CREATE INDEX idx_evaluations_trainer ON evaluations(trainer_name);
CREATE INDEX idx_evaluations_date ON evaluations(evaluation_date);
CREATE INDEX idx_evaluations_hotel_date ON evaluations(hotel_code, evaluation_date);

-- 4. Row Level Security (public access, no auth)
ALTER TABLE hotels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read hotels" ON hotels FOR SELECT USING (true);

ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read evaluations" ON evaluations FOR SELECT USING (true);
CREATE POLICY "Allow public insert evaluations" ON evaluations FOR INSERT WITH CHECK (true);
