CREATE DATABASE IF NOT EXISTS mentor_market CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE mentor_market;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS referral_rewards, course_views, saved_courses, saved_tutors, withdrawal_requests, reports, notifications, study_materials,
  quiz_attempts, quizzes, assignments, payments, verifications, reviews, messages, reschedule_requests, booking_waitlists, bookings,
  applications, student_requests, tutor_posts, tutor_availabilities, tutor_profiles, student_profiles, users;
SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE users (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(191) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('student', 'tutor', 'admin') NOT NULL,
  phone VARCHAR(30),
  avatar_url VARCHAR(500),
  referral_code VARCHAR(30) UNIQUE,
  referred_by_id BIGINT UNSIGNED NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_login_at DATETIME,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT uq_users_email UNIQUE (email),
  CONSTRAINT fk_users_referred_by FOREIGN KEY (referred_by_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_users_role_active (role, is_active),
  INDEX idx_users_referral_code (referral_code)
) ENGINE=InnoDB;

CREATE TABLE student_profiles (
  user_id BIGINT UNSIGNED PRIMARY KEY,
  class_level VARCHAR(80),
  institution VARCHAR(150),
  location VARCHAR(150),
  subjects JSON,
  learning_goals TEXT,
  bio TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_student_profiles_users FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE tutor_profiles (
  user_id BIGINT UNSIGNED PRIMARY KEY,
  qualifications TEXT,
  experience_years DECIMAL(4,1) NOT NULL DEFAULT 0,
  subjects JSON,
  teaching_mode ENUM('online', 'offline', 'both') NOT NULL DEFAULT 'both',
  hourly_rate DECIMAL(10,2) NOT NULL DEFAULT 0,
  location VARCHAR(150),
  availability VARCHAR(255),
  available_days SET('mon','tue','wed','thu','fri','sat','sun'),
  bio TEXT,
  profile_completion TINYINT UNSIGNED NOT NULL DEFAULT 20,
  average_rating DECIMAL(3,2) NOT NULL DEFAULT 0,
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_tutor_profiles_users FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_tutor_profiles_search (teaching_mode, location, hourly_rate, average_rating),
  INDEX idx_tutor_profiles_recommended (profile_completion, is_verified, average_rating),
  FULLTEXT INDEX ft_tutor_profiles_bio (qualifications, bio)
) ENGINE=InnoDB;

CREATE TABLE tutor_availabilities (
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

CREATE TABLE tutor_posts (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  tutor_id BIGINT UNSIGNED NOT NULL,
  title VARCHAR(160) NOT NULL,
  subject VARCHAR(100) NOT NULL,
  level VARCHAR(100) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  teaching_mode ENUM('online', 'offline', 'both') NOT NULL,
  location VARCHAR(150),
  availability VARCHAR(255) NOT NULL,
  has_trial BOOLEAN NOT NULL DEFAULT FALSE,
  thumbnail_url VARCHAR(500),
  demo_video_url VARCHAR(500),
  description TEXT NOT NULL,
  status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_tutor_posts_users FOREIGN KEY (tutor_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_tutor_posts_subject_status (subject, status),
  INDEX idx_tutor_posts_tutor (tutor_id),
  FULLTEXT INDEX ft_tutor_posts_text (title, subject, description)
) ENGINE=InnoDB;

CREATE TABLE student_requests (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  student_id BIGINT UNSIGNED NOT NULL,
  subject VARCHAR(100) NOT NULL,
  class_level VARCHAR(100) NOT NULL,
  budget DECIMAL(10,2) NOT NULL,
  location VARCHAR(150),
  teaching_mode ENUM('online', 'offline', 'both') NOT NULL,
  preferred_time VARCHAR(150) NOT NULL,
  required_experience VARCHAR(150),
  description TEXT NOT NULL,
  status ENUM('open', 'closed', 'hired') NOT NULL DEFAULT 'open',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_student_requests_users FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_student_requests_subject_status (subject, status),
  INDEX idx_student_requests_student (student_id)
) ENGINE=InnoDB;

CREATE TABLE applications (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  student_request_id BIGINT UNSIGNED NOT NULL,
  tutor_id BIGINT UNSIGNED NOT NULL,
  proposal_message TEXT NOT NULL,
  expected_fee DECIMAL(10,2) NOT NULL,
  available_time VARCHAR(150) NOT NULL,
  status ENUM('pending', 'accepted', 'rejected') NOT NULL DEFAULT 'pending',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_applications_requests FOREIGN KEY (student_request_id) REFERENCES student_requests(id) ON DELETE CASCADE,
  CONSTRAINT fk_applications_tutors FOREIGN KEY (tutor_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT uq_applications_request_tutor UNIQUE (student_request_id, tutor_id),
  INDEX idx_applications_tutor_status (tutor_id, status)
) ENGINE=InnoDB;

CREATE TABLE bookings (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  student_id BIGINT UNSIGNED NOT NULL,
  tutor_id BIGINT UNSIGNED NOT NULL,
  tutor_post_id BIGINT UNSIGNED,
  student_request_id BIGINT UNSIGNED,
  class_type ENUM('trial', 'one-time', 'weekly', 'monthly') NOT NULL,
  class_date DATE NOT NULL,
  class_time TIME NOT NULL,
  duration_minutes SMALLINT UNSIGNED NOT NULL DEFAULT 60,
  mode ENUM('online', 'offline') NOT NULL,
  meeting_link_or_location VARCHAR(500),
  status ENUM('pending', 'confirmed', 'completed', 'cancelled', 'rescheduled') NOT NULL DEFAULT 'pending',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_bookings_students FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE RESTRICT,
  CONSTRAINT fk_bookings_tutors FOREIGN KEY (tutor_id) REFERENCES users(id) ON DELETE RESTRICT,
  CONSTRAINT fk_bookings_posts FOREIGN KEY (tutor_post_id) REFERENCES tutor_posts(id) ON DELETE SET NULL,
  CONSTRAINT fk_bookings_requests FOREIGN KEY (student_request_id) REFERENCES student_requests(id) ON DELETE SET NULL,
  UNIQUE INDEX uq_bookings_student_request (student_request_id),
  INDEX idx_bookings_student_date (student_id, class_date),
  INDEX idx_bookings_tutor_date (tutor_id, class_date)
) ENGINE=InnoDB;

CREATE TABLE booking_waitlists (
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

CREATE TABLE reschedule_requests (
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

CREATE TABLE messages (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  sender_id BIGINT UNSIGNED NOT NULL,
  receiver_id BIGINT UNSIGNED NOT NULL,
  booking_id BIGINT UNSIGNED,
  content TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  is_reported BOOLEAN NOT NULL DEFAULT FALSE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_messages_senders FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_messages_receivers FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_messages_bookings FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL,
  INDEX idx_messages_conversation (sender_id, receiver_id, created_at),
  INDEX idx_messages_unread (receiver_id, is_read)
) ENGINE=InnoDB;

CREATE TABLE reviews (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  reviewer_id BIGINT UNSIGNED NOT NULL,
  receiver_id BIGINT UNSIGNED NOT NULL,
  booking_id BIGINT UNSIGNED NOT NULL,
  rating TINYINT UNSIGNED NOT NULL,
  comment TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_reviews_reviewers FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_reviews_receivers FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_reviews_bookings FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
  CONSTRAINT uq_reviews_booking_reviewer UNIQUE (booking_id, reviewer_id),
  CONSTRAINT ck_reviews_rating CHECK (rating BETWEEN 1 AND 5),
  INDEX idx_reviews_receiver (receiver_id, created_at)
) ENGINE=InnoDB;

CREATE TABLE verifications (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  tutor_id BIGINT UNSIGNED NOT NULL,
  certificate_name VARCHAR(200),
  institution VARCHAR(200),
  experience_proof VARCHAR(500),
  demo_video_url VARCHAR(500),
  status ENUM('not_submitted', 'pending', 'verified', 'rejected') NOT NULL DEFAULT 'not_submitted',
  admin_feedback TEXT,
  reviewed_by BIGINT UNSIGNED,
  submitted_at DATETIME,
  reviewed_at DATETIME,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT uq_verifications_tutor UNIQUE (tutor_id),
  CONSTRAINT fk_verifications_tutors FOREIGN KEY (tutor_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_verifications_admins FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_verifications_status (status)
) ENGINE=InnoDB;

CREATE TABLE payments (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  student_id BIGINT UNSIGNED NOT NULL,
  tutor_id BIGINT UNSIGNED NOT NULL,
  booking_id BIGINT UNSIGNED NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  commission DECIMAL(12,2) NOT NULL,
  tutor_earning DECIMAL(12,2) NOT NULL,
  status ENUM('pending', 'paid', 'refunded') NOT NULL DEFAULT 'pending',
  payment_method ENUM('card', 'bKash', 'Nagad', 'Rocket', 'cash') NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  paid_at DATETIME,
  CONSTRAINT fk_payments_students FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE RESTRICT,
  CONSTRAINT fk_payments_tutors FOREIGN KEY (tutor_id) REFERENCES users(id) ON DELETE RESTRICT,
  CONSTRAINT fk_payments_bookings FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE RESTRICT,
  CONSTRAINT uq_payments_booking UNIQUE (booking_id),
  INDEX idx_payments_tutor_status (tutor_id, status)
) ENGINE=InnoDB;

CREATE TABLE assignments (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(180) NOT NULL,
  description TEXT NOT NULL,
  deadline DATETIME NOT NULL,
  student_id BIGINT UNSIGNED NOT NULL,
  tutor_id BIGINT UNSIGNED NOT NULL,
  submission_text TEXT,
  submission_file_url VARCHAR(500),
  status ENUM('pending', 'submitted', 'graded') NOT NULL DEFAULT 'pending',
  marks DECIMAL(6,2),
  feedback TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  submitted_at DATETIME,
  graded_at DATETIME,
  CONSTRAINT fk_assignments_students FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_assignments_tutors FOREIGN KEY (tutor_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_assignments_student_status (student_id, status),
  INDEX idx_assignments_tutor (tutor_id)
) ENGINE=InnoDB;

CREATE TABLE quizzes (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  tutor_id BIGINT UNSIGNED NOT NULL,
  title VARCHAR(180) NOT NULL,
  subject VARCHAR(100) NOT NULL,
  questions JSON NOT NULL,
  total_score SMALLINT UNSIGNED NOT NULL DEFAULT 10,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_quizzes_tutors FOREIGN KEY (tutor_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_quizzes_tutor_subject (tutor_id, subject)
) ENGINE=InnoDB;

CREATE TABLE quiz_attempts (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  quiz_id BIGINT UNSIGNED NOT NULL,
  student_id BIGINT UNSIGNED NOT NULL,
  answers JSON NOT NULL,
  score DECIMAL(6,2) NOT NULL,
  attempted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_quiz_attempts_quizzes FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE,
  CONSTRAINT fk_quiz_attempts_students FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT uq_quiz_attempts_quiz_student UNIQUE (quiz_id, student_id),
  INDEX idx_quiz_attempts_student (student_id)
) ENGINE=InnoDB;

CREATE TABLE study_materials (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  tutor_id BIGINT UNSIGNED NOT NULL,
  student_id BIGINT UNSIGNED,
  booking_id BIGINT UNSIGNED,
  title VARCHAR(180) NOT NULL,
  description TEXT,
  file_url VARCHAR(500) NOT NULL,
  subject VARCHAR(100) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_materials_tutors FOREIGN KEY (tutor_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_materials_students FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_materials_bookings FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL,
  INDEX idx_materials_student (student_id),
  INDEX idx_materials_tutor (tutor_id)
) ENGINE=InnoDB;

CREATE TABLE notifications (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  title VARCHAR(180) NOT NULL,
  message VARCHAR(500) NOT NULL,
  type VARCHAR(60) NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_notifications_users FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_notifications_user_unread (user_id, is_read, created_at)
) ENGINE=InnoDB;

CREATE TABLE reports (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  reporter_id BIGINT UNSIGNED NOT NULL,
  reported_user_id BIGINT UNSIGNED,
  tutor_post_id BIGINT UNSIGNED,
  student_request_id BIGINT UNSIGNED,
  category ENUM('fake_tutor', 'fake_student', 'payment_issue', 'inappropriate_behavior', 'fake_post', 'spam', 'review_abuse') NOT NULL,
  description TEXT NOT NULL,
  status ENUM('open', 'investigating', 'resolved', 'dismissed') NOT NULL DEFAULT 'open',
  admin_notes TEXT,
  resolved_by BIGINT UNSIGNED,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  resolved_at DATETIME,
  CONSTRAINT fk_reports_reporters FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_reports_reported_users FOREIGN KEY (reported_user_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_reports_posts FOREIGN KEY (tutor_post_id) REFERENCES tutor_posts(id) ON DELETE SET NULL,
  CONSTRAINT fk_reports_requests FOREIGN KEY (student_request_id) REFERENCES student_requests(id) ON DELETE SET NULL,
  CONSTRAINT fk_reports_admins FOREIGN KEY (resolved_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_reports_status (status)
) ENGINE=InnoDB;

CREATE TABLE withdrawal_requests (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  tutor_id BIGINT UNSIGNED NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  method ENUM('bank', 'bKash', 'Nagad', 'Rocket') NOT NULL,
  account_details VARCHAR(255) NOT NULL,
  status ENUM('pending', 'approved', 'rejected', 'paid') NOT NULL DEFAULT 'pending',
  admin_feedback TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_withdrawals_tutors FOREIGN KEY (tutor_id) REFERENCES users(id) ON DELETE RESTRICT,
  INDEX idx_withdrawals_tutor_status (tutor_id, status)
) ENGINE=InnoDB;

CREATE TABLE saved_tutors (
  student_id BIGINT UNSIGNED NOT NULL,
  tutor_id BIGINT UNSIGNED NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (student_id, tutor_id),
  CONSTRAINT fk_saved_tutors_students FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_saved_tutors_tutors FOREIGN KEY (tutor_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_saved_tutors_tutor (tutor_id)
) ENGINE=InnoDB;

CREATE TABLE saved_courses (
  student_id BIGINT UNSIGNED NOT NULL,
  course_id BIGINT UNSIGNED NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (student_id, course_id),
  CONSTRAINT fk_saved_courses_students FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_saved_courses_courses FOREIGN KEY (course_id) REFERENCES tutor_posts(id) ON DELETE CASCADE,
  INDEX idx_saved_courses_student_created (student_id, created_at),
  INDEX idx_saved_courses_course (course_id)
) ENGINE=InnoDB;

CREATE TABLE course_views (
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

CREATE TABLE referral_rewards (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  badge_key VARCHAR(50) NOT NULL,
  badge_name VARCHAR(100) NOT NULL,
  reward_description VARCHAR(255) NOT NULL,
  unlocked_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_referral_rewards_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT uq_user_badge UNIQUE (user_id, badge_key),
  INDEX idx_referral_rewards_user (user_id)
) ENGINE=InnoDB;
