USE mentor_market;

-- The "Search Tutor" feature has always advertised an availability filter,
-- but tutor_profiles.availability is free text ("Sun-Thu, 5 PM-9 PM",
-- "Every day, 6 PM-10 PM"). Free text can be displayed but cannot be
-- filtered reliably, so we add a structured, filterable column alongside
-- it. The original text column is kept as-is for human-readable display.
ALTER TABLE tutor_profiles
  ADD COLUMN IF NOT EXISTS available_days SET('mon','tue','wed','thu','fri','sat','sun') NULL AFTER availability;

-- Backfill the bundled demo tutors so the new filter has real, correct data
-- out of the box. New/edited profiles populate this column going forward
-- through the profile form (see TutorProfile.upsert).
UPDATE tutor_profiles SET available_days = 'sun,mon,tue,wed,thu' WHERE user_id = 5 AND available_days IS NULL; -- Sun-Thu, 5 PM-9 PM
UPDATE tutor_profiles SET available_days = 'fri,sat' WHERE user_id = 6 AND available_days IS NULL; -- Fri-Sat, 10 AM-6 PM
UPDATE tutor_profiles SET available_days = 'mon,tue,wed,thu,fri,sat,sun' WHERE user_id = 7 AND available_days IS NULL; -- Every day, 6 PM-10 PM
UPDATE tutor_profiles SET available_days = 'sat,sun,mon,tue,wed,thu' WHERE user_id = 8 AND available_days IS NULL; -- Sat-Thu, 7 PM-10 PM

-- The search's default "recommended" ordering (and the always-applied
-- profile_completion >= 60 gate) previously had no supporting index, so
-- every directory visit fell back to a filesort over the full table.
ALTER TABLE tutor_profiles
  ADD INDEX IF NOT EXISTS idx_tutor_profiles_recommended (profile_completion, is_verified, average_rating);

-- Free-text search (the "q" parameter) previously ran unindexed LIKE '%..%'
-- scans across bio/qualifications on every request. FULLTEXT lets MySQL/
-- MariaDB use its inverted index and relevance ranking for these longer
-- text fields instead of a full table scan.
ALTER TABLE tutor_profiles
  ADD FULLTEXT INDEX IF NOT EXISTS ft_tutor_profiles_bio (qualifications, bio);

ALTER TABLE tutor_posts
  ADD FULLTEXT INDEX IF NOT EXISTS ft_tutor_posts_text (title, subject, description);
