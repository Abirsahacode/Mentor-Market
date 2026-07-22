USE mentor_market;


ALTER TABLE tutor_profiles
  ADD COLUMN IF NOT EXISTS available_days SET('mon','tue','wed','thu','fri','sat','sun') NULL AFTER availability;


UPDATE tutor_profiles SET available_days = 'sun,mon,tue,wed,thu' WHERE user_id = 5 AND available_days IS NULL; -- Sun-Thu, 5 PM-9 PM
UPDATE tutor_profiles SET available_days = 'fri,sat' WHERE user_id = 6 AND available_days IS NULL; -- Fri-Sat, 10 AM-6 PM
UPDATE tutor_profiles SET available_days = 'mon,tue,wed,thu,fri,sat,sun' WHERE user_id = 7 AND available_days IS NULL; -- Every day, 6 PM-10 PM
UPDATE tutor_profiles SET available_days = 'sat,sun,mon,tue,wed,thu' WHERE user_id = 8 AND available_days IS NULL; -- Sat-Thu, 7 PM-10 PM


ALTER TABLE tutor_profiles
  ADD INDEX IF NOT EXISTS idx_tutor_profiles_recommended (profile_completion, is_verified, average_rating);


ALTER TABLE tutor_profiles
  ADD FULLTEXT INDEX IF NOT EXISTS ft_tutor_profiles_bio (qualifications, bio);

ALTER TABLE tutor_posts
  ADD FULLTEXT INDEX IF NOT EXISTS ft_tutor_posts_text (title, subject, description);
