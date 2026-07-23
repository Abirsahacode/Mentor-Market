USE mentor_market;

-- Additive media fields. The IF NOT EXISTS clauses make this safe to run on
-- both fresh and previously initialized local databases.
ALTER TABLE tutor_posts
  ADD COLUMN IF NOT EXISTS thumbnail_url VARCHAR(500) NULL AFTER has_trial,
  ADD COLUMN IF NOT EXISTS demo_video_url VARCHAR(500) NULL AFTER thumbnail_url;

-- Backfill only the bundled sample records. User-created media is untouched.
UPDATE tutor_posts SET thumbnail_url = '/media/math-studio.svg', demo_video_url = '/media/math-demo.mp4' WHERE id = 1 AND thumbnail_url IS NULL;
UPDATE tutor_posts SET thumbnail_url = '/media/chemistry-studio.svg', demo_video_url = '/media/chemistry-demo.mp4' WHERE id = 2 AND thumbnail_url IS NULL;
UPDATE tutor_posts SET thumbnail_url = '/media/english-studio.svg', demo_video_url = '/media/english-demo.mp4' WHERE id = 3 AND thumbnail_url IS NULL;
UPDATE tutor_posts SET thumbnail_url = '/media/code-studio.svg', demo_video_url = '/media/code-demo.mp4' WHERE id = 4 AND thumbnail_url IS NULL;
UPDATE tutor_posts SET thumbnail_url = '/media/physics-studio.svg', demo_video_url = '/media/physics-demo.mp4' WHERE id = 5 AND thumbnail_url IS NULL;
