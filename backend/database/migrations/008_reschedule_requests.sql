USE mentor_market;

CREATE TABLE IF NOT EXISTS reschedule_requests (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  booking_id BIGINT UNSIGNED NOT NULL,
  requested_by_id BIGINT UNSIGNED NOT NULL,
  requested_to_id BIGINT UNSIGNED NOT NULL,
  new_date DATE NOT NULL,
  new_time TIME NOT NULL,
  reason TEXT,
  status ENUM('pending', 'accepted', 'rejected') NOT NULL DEFAULT 'pending',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_reschedules_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
  CONSTRAINT fk_reschedules_requested_by FOREIGN KEY (requested_by_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_reschedules_requested_to FOREIGN KEY (requested_to_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_reschedules_booking (booking_id),
  INDEX idx_reschedules_recipient_status (requested_to_id, status)
) ENGINE=InnoDB;
