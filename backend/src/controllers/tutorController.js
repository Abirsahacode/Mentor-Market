import db from "../config/db.js";
import TutorProfile from "../models/TutorProfile.js";
import WithdrawalRequest from "../models/WithdrawalRequest.js";
import { DAY_TOKENS } from "../utils/availability.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { getPagination } from "../utils/pagination.js";
import { sendSuccess } from "../utils/respond.js";

const parseCsv = (value) => (value ? String(value).split(",").map((item) => item.trim()).filter(Boolean) : []);

export const searchTutors = asyncHandler(async (req, res) => {
  const { page, limit, offset } = getPagination(req.query);
  const filters = {
    subjects: parseCsv(req.query.subject),
    location: req.query.location || "",
    mode: req.query.mode,
    minPrice: req.query.minPrice,
    maxPrice: req.query.maxPrice,
    minRating: req.query.minRating,
    days: parseCsv(req.query.days).map((day) => day.toLowerCase()).filter((day) => DAY_TOKENS.includes(day)),
    q: req.query.q || "",
    sort: req.query.sort,
    limit,
    offset,
  };
  const { rows, total } = await TutorProfile.search(filters);
  sendSuccess(res, rows, "Tutors loaded", 200, { page, limit, total, pages: Math.max(Math.ceil(total / limit), 1) });
});

export const listSubjects = asyncHandler(async (req, res) => {
  sendSuccess(res, await TutorProfile.listDistinctSubjects(), "Subjects loaded");
});

export const getTutor = asyncHandler(async (req, res) => {
  const profile = await TutorProfile.findByUserId(req.params.id);
  if (!profile) throw new ApiError(404, "tutor_not_found", "Tutor profile was not found");
  const [posts] = await db.query("SELECT * FROM tutor_posts WHERE tutor_id = ? AND status = 'active' ORDER BY created_at DESC", [req.params.id]);
  const [reviews] = await db.query(
    `SELECT r.*, u.full_name AS reviewer_name FROM reviews r JOIN users u ON u.id = r.reviewer_id
     WHERE r.receiver_id = ? ORDER BY r.created_at DESC LIMIT 10`, [req.params.id],
  );
  sendSuccess(res, { ...profile, posts, reviews }, "Tutor profile loaded");
});

export const getProfile = asyncHandler(async (req, res) => {
  sendSuccess(res, await TutorProfile.findByUserId(req.user.id), "Tutor profile loaded");
});

export const updateProfile = asyncHandler(async (req, res) => {
  const profile = await TutorProfile.upsert(req.user.id, req.body);
  sendSuccess(res, profile, "Tutor profile updated");
});

export const getEarnings = asyncHandler(async (req, res) => {
  const [[summary]] = await db.query(
    `SELECT COALESCE(SUM(CASE WHEN status = 'paid' THEN tutor_earning ELSE 0 END), 0) AS total_earnings,
      COALESCE(SUM(CASE WHEN status = 'pending' THEN tutor_earning ELSE 0 END), 0) AS pending_earnings,
      COUNT(*) AS payment_count FROM payments WHERE tutor_id = ?`, [req.user.id],
  );
  const [payments] = await db.query("SELECT * FROM payments WHERE tutor_id = ? ORDER BY created_at DESC LIMIT 20", [req.user.id]);
  const [withdrawals] = await db.query("SELECT * FROM withdrawal_requests WHERE tutor_id = ? ORDER BY created_at DESC", [req.user.id]);
  sendSuccess(res, { ...summary, payments, withdrawals }, "Earnings loaded");
});

export const requestWithdrawal = asyncHandler(async (req, res) => {
  const amount = Number(req.body.amount);
  if (!amount || amount <= 0) throw new ApiError(422, "invalid_amount", "Withdrawal amount must be greater than zero");
  const [[{ available }]] = await db.query(
    `SELECT GREATEST(COALESCE((SELECT SUM(tutor_earning) FROM payments WHERE tutor_id = ? AND status = 'paid'), 0)
      - COALESCE((SELECT SUM(amount) FROM withdrawal_requests WHERE tutor_id = ? AND status IN ('pending', 'approved', 'paid')), 0), 0) AS available`,
    [req.user.id, req.user.id],
  );
  if (amount > available) throw new ApiError(409, "insufficient_earnings", "Withdrawal exceeds available earnings");
  const withdrawal = await WithdrawalRequest.create({
    tutor_id: req.user.id,
    amount,
    method: req.body.method,
    account_details: req.body.account_details,
    status: "pending",
  });
  sendSuccess(res, withdrawal, "Withdrawal requested", 201);
});
