USE mentor_market;

-- Student course bookmarks are intentionally separate from saved tutors: a
-- student can follow a mentor broadly while bookmarking only specific lessons.
CREATE TABLE IF NOT EXISTS saved_courses (
  student_id BIGINT UNSIGNED NOT NULL,
  course_id BIGINT UNSIGNED NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (student_id, course_id),
  CONSTRAINT fk_saved_courses_students FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_saved_courses_courses FOREIGN KEY (course_id) REFERENCES tutor_posts(id) ON DELETE CASCADE,
  INDEX idx_saved_courses_student_created (student_id, created_at),
  INDEX idx_saved_courses_course (course_id)
) ENGINE=InnoDB;

-- One row per student/course keeps history compact. Repeated views increment
-- view_count and move last_viewed_at, which powers the recent-course rail.
CREATE TABLE IF NOT EXISTS course_views (
  student_id BIGINT UNSIGNED NOT NULL,
  course_id BIGINT UNSIGNED NOT NULL,
  view_count INT UNSIGNED NOT NULL DEFAULT 1,
  first_viewed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_viewed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (student_id, course_id),
  CONSTRAINT fk_course_views_students FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_course_views_courses FOREIGN KEY (course_id) REFERENCES tutor_posts(id) ON DELETE CASCADE,
  INDEX idx_course_views_student_recent (student_id, last_viewed_at),
  INDEX idx_course_views_course (course_id)
) ENGINE=InnoDB;

-- Demonstration history for the bundled student account. INSERT IGNORE makes
-- this safe when migrations run repeatedly or after seed.sql on a fresh setup.
INSERT IGNORE INTO saved_courses (student_id, course_id, created_at) VALUES
  (2, 1, '2026-07-12 20:15:00'),
  (2, 9, '2026-07-13 18:30:00'),
  (2, 11, '2026-07-14 01:45:00');

INSERT IGNORE INTO course_views (student_id, course_id, view_count, first_viewed_at, last_viewed_at) VALUES
  (2, 1, 4, '2026-07-10 19:00:00', '2026-07-14 23:30:00'),
  (2, 9, 2, '2026-07-13 18:25:00', '2026-07-14 21:10:00'),
  (2, 3, 1, '2026-07-14 20:00:00', '2026-07-14 20:00:00'),
  (2, 11, 3, '2026-07-12 16:00:00', '2026-07-14 19:20:00');

-- Correct timestamps from the first development revision only when the exact
-- untouched demonstration value is still present; genuine student activity is
-- never overwritten on subsequent starts.
UPDATE saved_courses SET created_at = '2026-07-13 18:30:00'
WHERE student_id = 2 AND course_id = 9 AND created_at = '2026-07-14 18:30:00';
UPDATE saved_courses SET created_at = '2026-07-14 01:45:00'
WHERE student_id = 2 AND course_id = 11 AND created_at = '2026-07-15 09:45:00';
UPDATE course_views SET last_viewed_at = '2026-07-14 23:30:00'
WHERE student_id = 2 AND course_id = 1 AND last_viewed_at = '2026-07-15 08:30:00';
UPDATE course_views SET first_viewed_at = '2026-07-13 18:25:00', last_viewed_at = '2026-07-14 21:10:00'
WHERE student_id = 2 AND course_id = 9 AND last_viewed_at = '2026-07-15 08:10:00';
UPDATE course_views SET first_viewed_at = '2026-07-14 20:00:00', last_viewed_at = '2026-07-14 20:00:00'
WHERE student_id = 2 AND course_id = 3 AND last_viewed_at = '2026-07-14 21:00:00';
