USE mentor_market;

-- Every seeded account uses the password: Password123!
SET @password_hash = '$2b$12$05TEok9Dzq6jfFIgfmwBZedqqfpUxDrw2l0VLuWvwvXCZ5pyBj0S6';

INSERT INTO users (id, full_name, email, password_hash, role, phone, avatar_url, is_active) VALUES
  (1, 'Mentor Market Admin', 'admin@mentormarket.test', @password_hash, 'admin', '+8801700000001', NULL, TRUE),
  (2, 'Ayesha Rahman', 'ayesha@mentormarket.test', @password_hash, 'student', '+8801700000002', NULL, TRUE),
  (3, 'Rafi Hasan', 'rafi@mentormarket.test', @password_hash, 'student', '+8801700000003', NULL, TRUE),
  (4, 'Nusrat Jahan', 'nusrat@mentormarket.test', @password_hash, 'student', '+8801700000004', NULL, TRUE),
  (5, 'Farhan Ahmed', 'farhan@mentormarket.test', @password_hash, 'tutor', '+8801700000005', NULL, TRUE),
  (6, 'Mehjabin Chowdhury', 'mehjabin@mentormarket.test', @password_hash, 'tutor', '+8801700000006', NULL, TRUE),
  (7, 'Tanvir Hossain', 'tanvir@mentormarket.test', @password_hash, 'tutor', '+8801700000007', NULL, TRUE),
  (8, 'Sadia Islam', 'sadia@mentormarket.test', @password_hash, 'tutor', '+8801700000008', NULL, TRUE);

INSERT INTO student_profiles (user_id, class_level, institution, location, subjects, learning_goals, bio) VALUES
  (2, 'Class 10', 'Viqarunnisa Noon School', 'Dhanmondi, Dhaka', JSON_ARRAY('Mathematics', 'Physics'), 'Prepare confidently for SSC exams.', 'Curious science student who learns best with examples.'),
  (3, 'A Level', 'Scholastica', 'Uttara, Dhaka', JSON_ARRAY('Chemistry', 'Biology'), 'Improve problem solving and exam technique.', 'Preparing for university admission.'),
  (4, 'Class 8', 'Sunbeams School', 'Gulshan, Dhaka', JSON_ARRAY('English', 'Mathematics'), 'Build strong fundamentals.', 'Enjoys interactive lessons and quizzes.');

INSERT INTO tutor_profiles (user_id, qualifications, experience_years, subjects, teaching_mode, hourly_rate, location, availability, bio, profile_completion, average_rating, is_verified) VALUES
  (5, 'BSc in Mathematics, University of Dhaka', 6, JSON_ARRAY('Mathematics', 'Physics'), 'both', 800, 'Dhanmondi, Dhaka', 'Sun-Thu, 5 PM-9 PM', 'I turn difficult math concepts into simple visual steps.', 100, 4.80, TRUE),
  (6, 'MSc in Chemistry, BUET', 4, JSON_ARRAY('Chemistry', 'General Science'), 'online', 700, 'Mirpur, Dhaka', 'Fri-Sat, 10 AM-6 PM', 'Exam-focused lessons with practical examples and weekly feedback.', 90, 4.60, FALSE),
  (7, 'BA and MA in English, Jahangirnagar University', 8, JSON_ARRAY('English', 'IELTS'), 'both', 1000, 'Uttara, Dhaka', 'Every day, 6 PM-10 PM', 'Friendly IELTS and English mentor focused on confident communication.', 100, 4.90, TRUE),
  (8, 'BSc in CSE, North South University', 3, JSON_ARRAY('ICT', 'Programming', 'Mathematics'), 'online', 900, 'Bashundhara, Dhaka', 'Sat-Thu, 7 PM-10 PM', 'Project-based coding lessons for school and university students.', 85, 4.50, FALSE);

INSERT INTO tutor_posts (id, tutor_id, title, subject, level, price, teaching_mode, location, availability, has_trial, thumbnail_url, demo_video_url, description, status) VALUES
  (1, 5, 'SSC Mathematics Made Simple', 'Mathematics', 'Class 9-10 / SSC', 800, 'both', 'Dhanmondi, Dhaka', 'Sun-Thu evenings', TRUE, '/media/math-studio.svg', '/media/math-demo.mp4', 'Concept-first mathematics coaching with weekly practice tests and personal feedback.', 'active'),
  (2, 6, 'Chemistry Crash Course', 'Chemistry', 'HSC / A Level', 700, 'online', NULL, 'Friday and Saturday', TRUE, '/media/chemistry-studio.svg', '/media/chemistry-demo.mp4', 'Live problem solving, concise notes, and exam-focused revision for chemistry students.', 'active'),
  (3, 7, 'IELTS Speaking and Writing', 'IELTS', 'Beginner to Advanced', 1000, 'both', 'Uttara, Dhaka', 'Daily evenings', TRUE, '/media/english-studio.svg', '/media/english-demo.mp4', 'Structured IELTS preparation with mock speaking sessions and detailed writing feedback.', 'active'),
  (4, 8, 'Learn Programming by Building', 'Programming', 'Class 8 to University', 900, 'online', NULL, 'Sat-Thu nights', FALSE, '/media/code-studio.svg', '/media/code-demo.mp4', 'Beginner-friendly Python and web development through hands-on mini projects.', 'active'),
  (5, 5, 'Physics Problem Solving', 'Physics', 'Class 9-12', 850, 'online', NULL, 'Monday and Wednesday', FALSE, '/media/physics-studio.svg', '/media/physics-demo.mp4', 'Understand mechanics and electricity through diagrams, experiments, and guided problems.', 'active'),
  (6, 5, 'Advanced Calculus, Visualized', 'Mathematics', 'A Level / University', 950, 'online', NULL, 'Tuesday and Thursday', TRUE, '/media/math-studio.svg', '/media/math-demo.mp4', 'Build intuition for limits, derivatives, and integrals with visual models before tackling exam questions.', 'active'),
  (7, 6, 'Organic Chemistry Reaction Studio', 'Chemistry', 'HSC / A Level', 780, 'online', NULL, 'Friday afternoons', TRUE, '/media/chemistry-studio.svg', '/media/chemistry-demo.mp4', 'Learn reaction mechanisms as connected stories using maps, patterns, and short recall drills.', 'active'),
  (8, 7, 'Academic Writing Lab', 'English', 'College / University', 900, 'both', 'Uttara, Dhaka', 'Sunday and Tuesday', TRUE, '/media/english-studio.svg', '/media/english-demo.mp4', 'Plan sharper arguments, edit with confidence, and receive line-by-line feedback on real assignments.', 'active'),
  (9, 8, 'React Frontend from Zero', 'Programming', 'Beginner', 950, 'online', NULL, 'Saturday to Wednesday', TRUE, '/media/code-studio.svg', '/media/code-demo.mp4', 'Build a complete responsive interface while learning components, state, routing, and API calls.', 'active'),
  (10, 5, 'Mechanics Exam Sprint', 'Physics', 'SSC / HSC', 820, 'both', 'Dhanmondi, Dhaka', 'Weekend mornings', FALSE, '/media/physics-studio.svg', '/media/physics-demo.mp4', 'A focused mechanics revision track with diagrams, timed problems, and exam-day shortcuts.', 'active'),
  (11, 7, 'Spoken English Confidence Club', 'English', 'Beginner to Intermediate', 650, 'online', NULL, 'Monday, Wednesday and Friday', TRUE, '/media/english-studio.svg', '/media/english-demo.mp4', 'Low-pressure conversation practice that develops natural vocabulary, pronunciation, and confidence.', 'active'),
  (12, 8, 'Python Automation Workshop', 'Programming', 'School / University', 880, 'online', NULL, 'Thursday and Saturday', TRUE, '/media/code-studio.svg', '/media/code-demo.mp4', 'Automate useful everyday tasks with Python through small scripts you can understand and reuse.', 'active');

INSERT INTO student_requests (id, student_id, subject, class_level, budget, location, teaching_mode, preferred_time, required_experience, description, status) VALUES
  (1, 2, 'Physics', 'Class 10 / SSC', 750, 'Dhanmondi, Dhaka', 'both', 'Sun and Tue after 6 PM', 'At least 3 years', 'Need help with mechanics and regular exam practice.', 'open'),
  (2, 3, 'Chemistry', 'A Level', 900, 'Uttara, Dhaka', 'online', 'Friday afternoon', 'A Level teaching experience', 'Looking for structured organic chemistry revision.', 'hired'),
  (3, 4, 'English', 'Class 8', 600, 'Gulshan, Dhaka', 'offline', 'Saturday morning', 'Patient with younger students', 'Grammar, writing, and speaking practice needed.', 'open'),
  (4, 2, 'Mathematics', 'SSC', 800, 'Dhanmondi, Dhaka', 'online', 'Weekday evenings', 'SSC specialist', 'Weekly model tests and help with algebra.', 'open');

INSERT INTO applications (id, student_request_id, tutor_id, proposal_message, expected_fee, available_time, status) VALUES
  (1, 1, 5, 'I teach SSC physics with visual explanations and can follow your preferred schedule.', 750, 'Sun and Tue at 7 PM', 'pending'),
  (2, 2, 6, 'I can create a focused four-week organic chemistry revision plan.', 850, 'Friday at 3 PM', 'accepted'),
  (3, 3, 7, 'I have eight years of experience helping school students improve English.', 650, 'Saturday at 10 AM', 'pending');

INSERT INTO bookings (id, student_id, tutor_id, tutor_post_id, student_request_id, class_type, class_date, class_time, duration_minutes, mode, meeting_link_or_location, status) VALUES
  (1, 2, 5, 1, NULL, 'one-time', '2026-07-01', '18:00:00', 60, 'online', 'https://meet.example.com/math-class', 'completed'),
  (2, 3, 6, NULL, 2, 'weekly', '2026-07-18', '15:00:00', 90, 'online', 'https://meet.example.com/chemistry', 'confirmed'),
  (3, 4, 7, 3, NULL, 'trial', '2026-07-20', '10:00:00', 45, 'offline', 'Gulshan 2, Dhaka', 'pending'),
  (4, 2, 7, 3, NULL, 'trial', '2026-06-20', '19:00:00', 45, 'online', 'https://meet.example.com/ielts-trial', 'completed');

INSERT INTO messages (sender_id, receiver_id, booking_id, content, is_read, created_at) VALUES
  (2, 5, 1, 'Assalamu alaikum, should I review algebra before our class?', TRUE, '2026-06-30 18:00:00'),
  (5, 2, 1, 'Wa alaikum assalam. Yes, please review quadratic equations. I will share a worksheet.', FALSE, '2026-06-30 18:05:00'),
  (3, 6, 2, 'Could you send the topic list for our first chemistry class?', TRUE, '2026-07-12 10:00:00'),
  (6, 3, 2, 'Of course. We will begin with reaction mechanisms and isomerism.', FALSE, '2026-07-12 10:15:00');

INSERT INTO reviews (reviewer_id, receiver_id, booking_id, rating, comment) VALUES
  (2, 5, 1, 5, 'Very clear explanations and an excellent practice sheet.'),
  (5, 2, 1, 5, 'Ayesha was punctual, prepared, and asked thoughtful questions.');

INSERT INTO verifications (tutor_id, certificate_name, institution, experience_proof, demo_video_url, status, admin_feedback, reviewed_by, submitted_at, reviewed_at) VALUES
  (5, 'BSc Mathematics Certificate', 'University of Dhaka', 'Six years of tutoring references available.', '/media/math-demo.mp4', 'verified', 'Credentials reviewed and approved.', 1, '2026-06-10 09:00:00', '2026-06-11 11:00:00'),
  (6, 'MSc Chemistry Certificate', 'BUET', 'Four years at a coaching center.', '/media/chemistry-demo.mp4', 'pending', NULL, NULL, '2026-07-13 14:00:00', NULL),
  (7, 'MA English Certificate', 'Jahangirnagar University', 'Eight years of language coaching.', '/media/english-demo.mp4', 'verified', 'Strong qualifications and demo lesson.', 1, '2026-05-10 09:00:00', '2026-05-11 11:00:00');

INSERT INTO payments (student_id, tutor_id, booking_id, amount, commission, tutor_earning, status, payment_method, paid_at) VALUES
  (2, 5, 1, 800, 80, 720, 'paid', 'bKash', '2026-07-01 17:00:00'),
  (3, 6, 2, 3400, 340, 3060, 'pending', 'card', NULL);

INSERT INTO assignments (title, description, deadline, student_id, tutor_id, submission_text, status, marks, feedback, submitted_at, graded_at) VALUES
  ('Quadratic Equations Practice', 'Solve all ten problems and explain the steps for questions 8-10.', '2026-07-05 23:59:00', 2, 5, 'Completed all problems. The full working is in the attached link.', 'graded', 92, 'Excellent method. Recheck the sign in question 6.', '2026-07-04 20:00:00', '2026-07-05 18:00:00'),
  ('Organic Chemistry Mechanisms', 'Draw and explain the five reaction mechanisms discussed in class.', '2026-07-25 23:59:00', 3, 6, NULL, 'pending', NULL, NULL, NULL, NULL);

INSERT INTO quizzes (id, tutor_id, title, subject, questions, total_score) VALUES
  (1, 5, 'Algebra Foundations', 'Mathematics', JSON_ARRAY(
    JSON_OBJECT('prompt', 'What is x if 2x + 4 = 12?', 'options', JSON_ARRAY('2', '4', '6', '8'), 'correctAnswer', 1, 'points', 5),
    JSON_OBJECT('prompt', 'Which is a quadratic expression?', 'options', JSON_ARRAY('x + 2', 'x² + 2x + 1', '2/x', '√x'), 'correctAnswer', 1, 'points', 5)
  ), 10),
  (2, 6, 'Chemical Bonding Check', 'Chemistry', JSON_ARRAY(
    JSON_OBJECT('prompt', 'Which bond shares electrons?', 'options', JSON_ARRAY('Ionic', 'Covalent', 'Metallic', 'Hydrogen'), 'correctAnswer', 1, 'points', 10)
  ), 10);

INSERT INTO quiz_attempts (quiz_id, student_id, answers, score) VALUES
  (1, 2, JSON_ARRAY(1, 1), 100);

INSERT INTO study_materials (tutor_id, student_id, booking_id, title, description, file_url, subject) VALUES
  (5, 2, 1, 'Quadratic Equations Worksheet', 'Ten progressively challenging practice questions.', 'https://files.example.com/quadratic-worksheet.pdf', 'Mathematics'),
  (6, 3, 2, 'Organic Chemistry Topic Map', 'A visual overview for the first four lessons.', 'https://files.example.com/organic-topic-map.pdf', 'Chemistry');

INSERT INTO notifications (user_id, title, message, type, is_read) VALUES
  (2, 'New message', 'Farhan Ahmed sent you a message.', 'new_message', FALSE),
  (3, 'Booking confirmed', 'Your weekly chemistry booking was confirmed.', 'booking_confirmed', FALSE),
  (6, 'Verification received', 'Your verification is waiting for admin review.', 'verification_pending', TRUE),
  (5, 'Payment completed', 'Payment of ৳800 was marked paid.', 'payment_completed', TRUE);

INSERT INTO reports (reporter_id, reported_user_id, category, description, status) VALUES
  (4, NULL, 'spam', 'Received repeated promotional messages from an unknown account.', 'open');

INSERT INTO saved_tutors (student_id, tutor_id) VALUES (2, 5), (2, 7), (3, 6);

INSERT INTO saved_courses (student_id, course_id, created_at) VALUES
  (2, 1, '2026-07-12 20:15:00'),
  (2, 9, '2026-07-13 18:30:00'),
  (2, 11, '2026-07-14 01:45:00'),
  (3, 2, '2026-07-13 14:10:00');

INSERT INTO course_views (student_id, course_id, view_count, first_viewed_at, last_viewed_at) VALUES
  (2, 1, 4, '2026-07-10 19:00:00', '2026-07-14 23:30:00'),
  (2, 9, 2, '2026-07-13 18:25:00', '2026-07-14 21:10:00'),
  (2, 3, 1, '2026-07-14 20:00:00', '2026-07-14 20:00:00'),
  (2, 11, 3, '2026-07-12 16:00:00', '2026-07-14 19:20:00'),
  (3, 2, 2, '2026-07-13 14:00:00', '2026-07-14 11:20:00');
