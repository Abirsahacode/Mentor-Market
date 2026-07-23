import db from "../config/db.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { getPagination } from "../utils/pagination.js";
import { sendSuccess } from "../utils/respond.js";

const manageableTables = new Set([
  "tutor_posts", "student_requests", "applications", "bookings", "payments", "reviews", "reports", "withdrawal_requests",
]);

export const dashboard = asyncHandler(async (_req, res) => {
  const [[users]] = await db.query(
    `SELECT COUNT(*) AS total_users, SUM(role = 'student') AS total_students, SUM(role = 'tutor') AS total_tutors FROM users`,
  );
  const [[counts]] = await db.query(
    `SELECT (SELECT COUNT(*) FROM tutor_posts) AS total_tutor_posts,
      (SELECT COUNT(*) FROM student_requests) AS total_student_requests,
      (SELECT COUNT(*) FROM applications) AS total_applications,
      (SELECT COUNT(*) FROM bookings) AS total_bookings,
      (SELECT COUNT(*) FROM payments) AS total_payments,
      (SELECT COALESCE(SUM(commission), 0) FROM payments WHERE status = 'paid') AS total_revenue,
      (SELECT COUNT(*) FROM verifications WHERE status = 'pending') AS pending_verifications,
      (SELECT COUNT(*) FROM reports WHERE status IN ('open', 'investigating')) AS open_reports`,
  );
  const [popularSubjects] = await db.query(
    `SELECT subject, SUM(total) AS total FROM (
       SELECT subject, COUNT(*) AS total FROM tutor_posts GROUP BY subject
       UNION ALL SELECT subject, COUNT(*) AS total FROM student_requests GROUP BY subject
     ) subjects GROUP BY subject ORDER BY total DESC LIMIT 5`,
  );
  sendSuccess(res, { ...users, ...counts, popular_subjects: popularSubjects }, "Admin analytics loaded");
});

export const listUsers = asyncHandler(async (req, res) => {
  const { page, limit, offset } = getPagination(req.query);
  const clauses = [];
  const values = [];
  if (req.query.role) { clauses.push("role = ?"); values.push(req.query.role); }
  if (req.query.q) { clauses.push("(full_name LIKE ? OR email LIKE ?)"); values.push(`%${req.query.q}%`, `%${req.query.q}%`); }
  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  const [rows] = await db.query(
    `SELECT id, full_name, email, role, phone, avatar_url, is_active, last_login_at, created_at FROM users ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    [...values, limit, offset],
  );
  const [[{ total }]] = await db.query(`SELECT COUNT(*) AS total FROM users ${where}`, values);
  sendSuccess(res, rows, "Users loaded", 200, { page, limit, total, pages: Math.ceil(total / limit) });
});

export const updateUserStatus = asyncHandler(async (req, res) => {
  if (Number(req.params.id) === req.user.id) throw new ApiError(409, "cannot_suspend_self", "Administrators cannot suspend their own account");
  if (typeof req.body.is_active !== "boolean") {
    throw new ApiError(422, "invalid_active_status", "is_active must be true or false");
  }
  await db.query("UPDATE users SET is_active = ? WHERE id = ?", [req.body.is_active, req.params.id]);
  const [[user]] = await db.query("SELECT id, full_name, email, role, is_active FROM users WHERE id = ?", [req.params.id]);
  if (!user) throw new ApiError(404, "user_not_found", "User was not found");
  sendSuccess(res, user, user.is_active ? "User activated" : "User suspended");
});

export const listResource = asyncHandler(async (req, res) => {
  const table = req.params.resource;
  if (!manageableTables.has(table)) throw new ApiError(404, "resource_not_found", "Admin resource was not found");
  const [rows] = await db.query(`SELECT * FROM \`${table}\` ORDER BY created_at DESC LIMIT 200`);
  sendSuccess(res, rows, `${table.replaceAll("_", " ")} loaded`);
});

export const updateWithdrawal = asyncHandler(async (req, res) => {
  if (!["approved", "rejected", "paid"].includes(req.body.status)) throw new ApiError(422, "invalid_status", "Invalid withdrawal status");
  await db.query("UPDATE withdrawal_requests SET status = ?, admin_feedback = ? WHERE id = ?", [req.body.status, req.body.admin_feedback || null, req.params.id]);
  const [[row]] = await db.query("SELECT * FROM withdrawal_requests WHERE id = ?", [req.params.id]);
  if (!row) throw new ApiError(404, "withdrawal_not_found", "Withdrawal request was not found");
  sendSuccess(res, row, "Withdrawal updated");
});
