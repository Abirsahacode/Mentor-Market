USE mentor_market;

-- Expand the bundled discovery catalog without touching user-created posts.
-- Explicit sample IDs plus INSERT IGNORE make this safe on fresh and existing
-- project databases, including databases where seed.sql already inserted them.
INSERT IGNORE INTO tutor_posts
  (id, tutor_id, title, subject, level, price, teaching_mode, location, availability, has_trial, thumbnail_url, demo_video_url, description, status)
VALUES
  (6, 5, 'Advanced Calculus, Visualized', 'Mathematics', 'A Level / University', 950, 'online', NULL, 'Tuesday and Thursday', TRUE, '/media/math-studio.svg', '/media/math-demo.mp4', 'Build intuition for limits, derivatives, and integrals with visual models before tackling exam questions.', 'active'),
  (7, 6, 'Organic Chemistry Reaction Studio', 'Chemistry', 'HSC / A Level', 780, 'online', NULL, 'Friday afternoons', TRUE, '/media/chemistry-studio.svg', '/media/chemistry-demo.mp4', 'Learn reaction mechanisms as connected stories using maps, patterns, and short recall drills.', 'active'),
  (8, 7, 'Academic Writing Lab', 'English', 'College / University', 900, 'both', 'Uttara, Dhaka', 'Sunday and Tuesday', TRUE, '/media/english-studio.svg', '/media/english-demo.mp4', 'Plan sharper arguments, edit with confidence, and receive line-by-line feedback on real assignments.', 'active'),
  (9, 8, 'React Frontend from Zero', 'Programming', 'Beginner', 950, 'online', NULL, 'Saturday to Wednesday', TRUE, '/media/code-studio.svg', '/media/code-demo.mp4', 'Build a complete responsive interface while learning components, state, routing, and API calls.', 'active'),
  (10, 5, 'Mechanics Exam Sprint', 'Physics', 'SSC / HSC', 820, 'both', 'Dhanmondi, Dhaka', 'Weekend mornings', FALSE, '/media/physics-studio.svg', '/media/physics-demo.mp4', 'A focused mechanics revision track with diagrams, timed problems, and exam-day shortcuts.', 'active'),
  (11, 7, 'Spoken English Confidence Club', 'English', 'Beginner to Intermediate', 650, 'online', NULL, 'Monday, Wednesday and Friday', TRUE, '/media/english-studio.svg', '/media/english-demo.mp4', 'Low-pressure conversation practice that develops natural vocabulary, pronunciation, and confidence.', 'active'),
  (12, 8, 'Python Automation Workshop', 'Programming', 'School / University', 880, 'online', NULL, 'Thursday and Saturday', TRUE, '/media/code-studio.svg', '/media/code-demo.mp4', 'Automate useful everyday tasks with Python through small scripts you can understand and reuse.', 'active');
