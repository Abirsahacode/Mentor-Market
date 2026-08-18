USE mentor_market;

CREATE TABLE IF NOT EXISTS booking_waitlists (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  student_id BIGINT UNSIGNED NOT NULL,
  tutor_id BIGINT UNSIGNED NOT NULL,
  class_date DATE NOT NULL,
  class_time TIME NOT NULL,
  status ENUM('waiting', 'notified', 'cancelled', 'fulfilled') NOT NULL DEFAULT 'waiting',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_waitlists_students FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_waitlists_tutors FOREIGN KEY (tutor_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT uq_waitlists_student_slot UNIQUE (student_id, tutor_id, class_date, class_time),
  INDEX idx_waitlists_tutor_status (tutor_id, status),
  INDEX idx_waitlists_student (student_id)
) ENGINE=InnoDB;
