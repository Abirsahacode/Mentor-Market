import db from "../config/db.js";
import Booking from "../models/Booking.js";
import Review from "../models/Review.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { logModeration } from "../utils/moderationLog.js";
import { notify } from "../utils/notifications.js";
import { sendSuccess } from "../utils/respond.js";

export const listFeatured = asyncHandler(async (req, res) => {
  const [rows] = await db.query(
    `SELECT r.id, r.rating, r.comment, r.created_at, u.full_name AS reviewer_name, receiver.full_name AS receiver_name
     FROM reviews r
     JOIN users u ON u.id = r.reviewer_id
     JOIN users receiver ON receiver.id = r.receiver_id
     WHERE r.rating >= 4 AND CHAR_LENGTH(TRIM(r.comment)) >= 20
     ORDER BY r.rating DESC, r.created_at DESC LIMIT 6`,
  );
  sendSuccess(res, rows, "Featured reviews loaded");
});

export const listReviews = asyncHandler(async (req, res) => {
  const receiverId = req.query.receiver_id || req.user.id;
  const [rows] = await db.query(
    `SELECT r.*, u.full_name AS reviewer_name, u.avatar_url AS reviewer_avatar FROM reviews r
     JOIN users u ON u.id = r.reviewer_id WHERE r.receiver_id = ? ORDER BY r.created_at DESC`, [receiverId],
  );
  sendSuccess(res, rows, "Reviews loaded");
});

export const createReview = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.body.booking_id);
  if (!booking || booking.status !== "completed") throw new ApiError(409, "booking_not_completed", "Reviews require a completed booking");
  if (![booking.student_id, booking.tutor_id].includes(req.user.id)) throw new ApiError(403, "forbidden", "You did not participate in this booking");
  const receiverId = req.user.id === booking.student_id ? booking.tutor_id : booking.student_id;
  const review = await Review.create({ ...req.body, reviewer_id: req.user.id, receiver_id: receiverId });
  if (receiverId === booking.tutor_id) {
    await db.query(
      `UPDATE tutor_profiles SET average_rating = (SELECT ROUND(AVG(rating), 2) FROM reviews WHERE receiver_id = ?) WHERE user_id = ?`,
      [receiverId, receiverId],
    );
  }
  await notify(receiverId, "New review", `${req.user.full_name} left you a ${review.rating}-star review.`, "new_review");
  sendSuccess(res, review, "Review added", 201);
});

export const deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) throw new ApiError(404, "review_not_found", "Review was not found");
  if (req.user.role !== "admin" && review.reviewer_id !== req.user.id) throw new ApiError(403, "forbidden", "You cannot delete this review");
  await Review.remove(review.id);
  await db.query(
    `UPDATE tutor_profiles SET average_rating = COALESCE((SELECT ROUND(AVG(rating), 2) FROM reviews WHERE receiver_id = ?), 0) WHERE user_id = ?`,
    [review.receiver_id, review.receiver_id],
  );
  if (req.user.role === "admin") await logModeration(req.user.id, "delete_review", "review", review.id, req.body.reason);
  res.status(204).send();
});
