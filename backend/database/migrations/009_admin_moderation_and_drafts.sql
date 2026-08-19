USE mentor_market;

ALTER TABLE tutor_posts MODIFY COLUMN status ENUM('draft', 'active', 'inactive') NOT NULL DEFAULT 'active';

CREATE TABLE IF NOT EXISTS moderation_logs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  admin_id BIGINT UNSIGNED NOT NULL,
  action VARCHAR(60) NOT NULL,
  target_type VARCHAR(60) NOT NULL,
  target_id BIGINT UNSIGNED NOT NULL,
  reason TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_moderation_logs_admins FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_moderation_logs_target (target_type, target_id),
  INDEX idx_moderation_logs_created (created_at)
) ENGINE=InnoDB;
