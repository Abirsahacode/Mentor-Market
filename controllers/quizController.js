import db from "../config/db.js";
import Quiz from "../models/Quiz.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/respond.js";

const parseQuestions = (questions) => typeof questions === "string" ? JSON.parse(questions) : questions;
const hideAnswers = (quiz) => ({
  ...quiz,
  questions: parseQuestions(quiz.questions).map(({ correctAnswer: _answer, ...question }) => question),
});

export const listQuizzes = asyncHandler(async (req, res) => {
  const filters = req.user.role === "tutor" ? { tutor_id: req.user.id } : {};
  const { rows } = await Quiz.findAll({ filters, q: req.query.q, limit: 100 });
  sendSuccess(res, req.user.role === "student" ? rows.map(hideAnswers) : rows, "Quizzes loaded");
});

export const getQuiz = asyncHandler(async (req, res) => {
  const quiz = await Quiz.findById(req.params.id);
  if (!quiz) throw new ApiError(404, "quiz_not_found", "Quiz was not found");
  sendSuccess(res, req.user.role === "student" ? hideAnswers(quiz) : quiz, "Quiz loaded");
});

export const createQuiz = asyncHandler(async (req, res) => {
  const questions = parseQuestions(req.body.questions || []);
  if (!questions.length || questions.some((question) => !question.prompt || !Array.isArray(question.options) || question.correctAnswer === undefined)) {
    throw new ApiError(422, "invalid_questions", "Each quiz question needs a prompt, options, and correctAnswer");
  }
  const total_score = questions.reduce((sum, question) => sum + Number(question.points || 1), 0);
  const quiz = await Quiz.create({ ...req.body, tutor_id: req.user.id, questions, total_score });
  sendSuccess(res, quiz, "Quiz created", 201);
});

export const attemptQuiz = asyncHandler(async (req, res) => {
  const quiz = await Quiz.findById(req.params.id);
  if (!quiz) throw new ApiError(404, "quiz_not_found", "Quiz was not found");
  const questions = parseQuestions(quiz.questions);
  const answers = req.body.answers || [];
  const earned = questions.reduce((score, question, index) =>
    score + (String(answers[index]) === String(question.correctAnswer) ? Number(question.points || 1) : 0), 0);
  const percentage = Number(((earned / quiz.total_score) * 100).toFixed(2));
  await db.query(
    `INSERT INTO quiz_attempts (quiz_id, student_id, answers, score) VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE answers = VALUES(answers), score = VALUES(score), attempted_at = CURRENT_TIMESTAMP`,
    [quiz.id, req.user.id, JSON.stringify(answers), percentage],
  );
  sendSuccess(res, { score: percentage, earned, total: quiz.total_score }, "Quiz submitted");
});

export const listAttempts = asyncHandler(async (req, res) => {
  const clauses = [];
  const values = [];
  if (req.user.role === "student") { clauses.push("qa.student_id = ?"); values.push(req.user.id); }
  if (req.user.role === "tutor") { clauses.push("q.tutor_id = ?"); values.push(req.user.id); }
  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  const [rows] = await db.query(
    `SELECT qa.*, q.title, q.subject, u.full_name AS student_name FROM quiz_attempts qa
     JOIN quizzes q ON q.id = qa.quiz_id JOIN users u ON u.id = qa.student_id ${where}
     ORDER BY qa.attempted_at DESC`, values,
  );
  sendSuccess(res, rows, "Quiz attempts loaded");
});

export const deleteQuiz = asyncHandler(async (req, res) => {
  const quiz = await Quiz.findById(req.params.id);
  if (!quiz || (req.user.role !== "admin" && quiz.tutor_id !== req.user.id)) throw new ApiError(404, "quiz_not_found", "Quiz was not found");
  await Quiz.remove(quiz.id);
  res.status(204).send();
});

