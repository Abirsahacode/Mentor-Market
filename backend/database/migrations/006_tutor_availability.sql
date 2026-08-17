CREATE TABLE IF NOT EXISTS tutor_availabilities (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  tutor_id BIGINT UNSIGNED NOT NULL,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_tutor_availabilities_tutor FOREIGN KEY (tutor_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT uq_tutor_availability_slot UNIQUE (tutor_id, date, start_time),
  INDEX idx_tutor_availabilities_tutor_date (tutor_id, date)
) ENGINE=InnoDB;
