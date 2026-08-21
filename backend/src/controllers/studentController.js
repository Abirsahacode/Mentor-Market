import db from "../config/db.js";
import StudentProfile from "../models/StudentProfile.js";
import SavedTutor from "../models/SavedTutor.js";
import asyncHandler from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/respond.js";

export const getProfile = asyncHandler(async (req, res) => {
  const profile = await StudentProfile.findByUserId(req.user.id);
  sendSuccess(res, { ...req.user, profile }, "Student profile loaded");
});

export const updateProfile = asyncHandler(async (req, res) => {
  const profile = await StudentProfile.upsert(req.user.id, req.body);
  sendSuccess(res, profile, "Student profile updated");
});

export const getProgress = asyncHandler(async (req, res) => {
  const studentId = req.user.id;
  const [[classes]] = await db.query(
    `SELECT COUNT(*) AS total_classes, SUM(status = 'completed') AS completed_classes,
      ROUND(100 * SUM(status = 'completed') / NULLIF(COUNT(*), 0), 1) AS attendance_percentage
     FROM bookings
     WHERE student_id = ? AND status <> 'cancelled'
       AND TIMESTAMP(class_date, class_time) <= CURRENT_TIMESTAMP`, [studentId],
  );
  const [[assignments]] = await db.query(
    `SELECT COUNT(*) AS total_assignments, SUM(status IN ('submitted', 'graded')) AS completed_assignments,
      ROUND(100 * SUM(status IN ('submitted', 'graded')) / NULLIF(COUNT(*), 0), 1) AS completion_percentage,
      ROUND(AVG(marks), 1) AS average_marks FROM assignments WHERE student_id = ?`, [studentId],
  );
  const [[quizzes]] = await db.query(
    "SELECT COUNT(*) AS quizzes_attempted, ROUND(AVG(score), 1) AS average_quiz_score FROM quiz_attempts WHERE student_id = ?", [studentId],
  );
  const [feedback] = await db.query(
    "SELECT feedback, title FROM assignments WHERE student_id = ? AND feedback IS NOT NULL ORDER BY graded_at DESC LIMIT 5", [studentId],
  );
  const [weakSubjects] = await db.query(
    `SELECT qz.subject, ROUND(AVG(qa.score / qz.total_score * 100), 1) AS average_percentage
     FROM quiz_attempts qa JOIN quizzes qz ON qz.id = qa.quiz_id
     WHERE qa.student_id = ?
     GROUP BY qz.subject
     HAVING average_percentage < 60
     ORDER BY average_percentage ASC
     LIMIT 3`, [studentId],
  );
  const averages = [assignments.average_marks, quizzes.average_quiz_score].filter((value) => value !== null);
  const averagePerformance = averages.length
    ? Math.round(averages.reduce((sum, value) => sum + Number(value), 0) / averages.length)
    : 0;
  sendSuccess(res, {
    ...classes,
    ...assignments,
    ...quizzes,
    average_performance: averagePerformance,
    tutor_feedback: feedback,
    weak_topics: weakSubjects.map((row) => `${row.subject} (${row.average_percentage}%)`),
  }, "Progress loaded");
});

export const listSavedTutors = asyncHandler(async (req, res) => {
  sendSuccess(res, await SavedTutor.list(req.user.id), "Saved tutors loaded");
});

export const saveTutor = asyncHandler(async (req, res) => {
  await SavedTutor.save(req.user.id, req.params.tutorId);
  sendSuccess(res, null, "Tutor saved", 201);
});

export const removeSavedTutor = asyncHandler(async (req, res) => {
  await SavedTutor.remove(req.user.id, req.params.tutorId);
  res.status(204).send();
});
