import db from "../config/db.js";
import Booking from "../models/Booking.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { notify } from "../utils/notifications.js";
import { sendSuccess } from "../utils/respond.js";

export const listBookings = asyncHandler(async (req, res) => {
  const clauses = [];
  const values = [];
  if (req.user.role === "student") { clauses.push("b.student_id = ?"); values.push(req.user.id); }
  if (req.user.role === "tutor") { clauses.push("b.tutor_id = ?"); values.push(req.user.id); }
  if (req.query.status) { clauses.push("b.status = ?"); values.push(req.query.status); }
  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  const [rows] = await db.query(
    `SELECT b.*, student.full_name AS student_name, tutor.full_name AS tutor_name
     FROM bookings b JOIN users student ON student.id = b.student_id JOIN users tutor ON tutor.id = b.tutor_id
     ${where} ORDER BY b.class_date DESC, b.class_time DESC`, values,
  );
  sendSuccess(res, rows, "Bookings loaded");
});

export const createBooking = asyncHandler(async (req, res) => {
  const [[tutor]] = await db.query("SELECT id FROM users WHERE id = ? AND role = 'tutor' AND is_active = TRUE", [req.body.tutor_id]);
  if (!tutor) throw new ApiError(404, "tutor_not_found", "An active tutor was not found");
  const booking = await Booking.create({ ...req.body, student_id: req.user.id, status: "pending" });
  await notify(booking.tutor_id, "New class booking", `You received a ${booking.class_type} class request.`, "new_booking");
  sendSuccess(res, booking, "Booking requested", 201);
});

export const updateBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) throw new ApiError(404, "booking_not_found", "Booking was not found");
  const isParticipant = [booking.student_id, booking.tutor_id].includes(req.user.id);
  if (req.user.role !== "admin" && !isParticipant) throw new ApiError(403, "forbidden", "You cannot update this booking");

  const nextStatus = req.body.status;
  const allowedStatuses = ["confirmed", "completed", "cancelled", "rescheduled"];
  if (nextStatus && !allowedStatuses.includes(nextStatus)) throw new ApiError(422, "invalid_status", "Invalid booking status");
  if (["confirmed", "completed"].includes(nextStatus) && req.user.role === "student") {
    throw new ApiError(403, "forbidden", "Only the tutor can confirm or complete a class");
  }
  const allowedBody = {
    status: nextStatus,
    ...(req.body.class_date ? { class_date: req.body.class_date } : {}),
    ...(req.body.class_time ? { class_time: req.body.class_time } : {}),
    ...(req.body.meeting_link_or_location ? { meeting_link_or_location: req.body.meeting_link_or_location } : {}),
  };
  const updated = await Booking.update(booking.id, allowedBody);
  const recipientId = req.user.id === booking.student_id ? booking.tutor_id : booking.student_id;
  await notify(recipientId, "Booking updated", `Booking #${booking.id} is now ${updated.status}.`, `booking_${updated.status}`);
  sendSuccess(res, updated, "Booking updated");
});

