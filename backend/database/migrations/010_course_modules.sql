USE mentor_market;

CREATE TABLE IF NOT EXISTS course_modules (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  tutor_post_id BIGINT UNSIGNED NOT NULL,
  title VARCHAR(160) NOT NULL,
  description TEXT,
  items JSON,
  position SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_course_modules_posts FOREIGN KEY (tutor_post_id) REFERENCES tutor_posts(id) ON DELETE CASCADE,
  INDEX idx_course_modules_post_position (tutor_post_id, position)
) ENGINE=InnoDB;
