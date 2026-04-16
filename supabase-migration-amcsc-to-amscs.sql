-- Migration: rename hotel code AMCSC → AMSCS
-- Run this ONCE in the Supabase SQL Editor

BEGIN;

-- Step 1: insert the new hotel code (so FK has somewhere to point)
INSERT INTO hotels (code, name) VALUES ('AMSCS', 'Conrad Amsterdam')
ON CONFLICT (code) DO NOTHING;

-- Step 2: update existing evaluations that referenced the old code
UPDATE evaluations SET hotel_code = 'AMSCS' WHERE hotel_code = 'AMCSC';

-- Step 3: remove the old hotel row
DELETE FROM hotels WHERE code = 'AMCSC';

COMMIT;

-- Verify
SELECT code, name FROM hotels ORDER BY code;
