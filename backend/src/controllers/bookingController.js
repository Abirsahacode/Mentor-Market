import db from "../config/db.js";
import Booking from "../models/Booking.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { notify } from "../utils/notifications.js";
import { sendSuccess } from "../utils/respond.js";
import { generateAvailabilitySlots } from "../utils/availabilityCalendar.js";

const today = () => new Date().toISOString().slice(0, 10);

export const listBookings = asyncHandler(async (req, res) => {
  const clauses = [];
  const values = [];
  if (req.user.role === "student") { clauses.push("b.student_id = ?"); values.push(req.user.id); }
  if (req.user.role === "tutor") { clauses.push("b.tutor_id = ?"); values.push(req.user.id); }
  if (req.query.status) { clauses.push("b.status = ?"); values.push(req.query.status); }
  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  const [rows] = await db.query(
    `SELECT b.*, student.full_name AS student_name, tutor.full_name AS tutor_name,
      COALESCE(post.price, accepted.expected_fee, tutor_profile.hourly_rate) AS payable_amount
     FROM bookings b
     JOIN users student ON student.id = b.student_id
     JOIN users tutor ON tutor.id = b.tutor_id
     LEFT JOIN tutor_posts post ON post.id = b.tutor_post_id
     LEFT JOIN applications accepted ON accepted.student_request_id = b.student_request_id
       AND accepted.tutor_id = b.tutor_id AND accepted.status = 'accepted'
     LEFT JOIN tutor_profiles tutor_profile ON tutor_profile.user_id = b.tutor_id
     ${where} ORDER BY b.class_date DESC, b.class_time DESC`, values,
  );
  sendSuccess(res, rows, "Bookings loaded");
});

export const listAvailability = asyncHandler(async (req, res) => {
  const tutorId = Number(req.query.tutor_id);
  if (!tutorId) throw new ApiError(422, "invalid_tutor", "Choose a tutor before loading availability");
  const fromDate = req.query.from_date || today();
  const toDate = req.query.to_date || fromDate;

  const [[tutor]] = await db.query(
    `SELECT u.id, tp.availability, tp.teaching_mode FROM users u
     LEFT JOIN tutor_profiles tp ON tp.user_id = u.id
     WHERE u.id = ? AND u.role = 'tutor' AND u.is_active = TRUE`,
    [tutorId],
  );
  if (!tutor) throw new ApiError(404, "tutor_not_found", "An active tutor was not found");

  const [existingBookings] = await db.query(
    `SELECT class_date, class_time FROM bookings
     WHERE tutor_id = ? AND class_date BETWEEN ? AND ? AND status IN ('pending', 'confirmed', 'rescheduled')`,
    [tutorId, fromDate, toDate],
  );

  const availabilityText = tutor.availability || "";
  const slots = generateAvailabilitySlots({ availabilityText, fromDate, toDate, existingBookings });
  sendSuccess(res, slots, "Availability loaded");
});

export const createBooking = asyncHandler(async (req, res) => {
  const tutorId = Number(req.body.tutor_id);
  const [[tutor]] = await db.query(
    `SELECT u.id, tp.teaching_mode, tp.availability FROM users u
     LEFT JOIN tutor_profiles tp ON tp.user_id = u.id
     WHERE u.id = ? AND u.role = 'tutor' AND u.is_active = TRUE`,
    [tutorId],
  );
  if (!tutor) throw new ApiError(404, "tutor_not_found", "An active tutor was not found");

  const classTypes = ["trial", "one-time", "weekly", "monthly"];
  const modes = ["online", "offline"];
  const duration = Number(req.body.duration_minutes || 60);
  if (!classTypes.includes(req.body.class_type)) throw new ApiError(422, "invalid_class_type", "Choose a valid class type");
  if (!modes.includes(req.body.mode)) throw new ApiError(422, "invalid_mode", "Choose online or offline teaching");
  if (![30, 60, 90, 120].includes(duration)) throw new ApiError(422, "invalid_duration", "Class duration must be 30, 60, 90, or 120 minutes");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(req.body.class_date)) throw new ApiError(422, "invalid_date", "Choose a valid class date");
  if (!/^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/.test(req.body.class_time)) throw new ApiError(422, "invalid_time", "Choose a valid class time");
  const today = new Date().toISOString().slice(0, 10);
  if (req.body.class_date < today) throw new ApiError(422, "past_class_date", "Class date must be today or later");

  let post = null;
  if (req.body.tutor_post_id) {
    [[post]] = await db.query(
      "SELECT id, tutor_id, teaching_mode, has_trial, status, availability FROM tutor_posts WHERE id = ?",
      [req.body.tutor_post_id],
    );
    if (!post || post.tutor_id !== tutorId || post.status !== "active") {
      throw new ApiError(422, "invalid_tutor_post", "Choose an active class offered by this tutor");
    }
  }
  const supportedMode = post?.teaching_mode || tutor.teaching_mode;
  if (supportedMode && supportedMode !== "both" && req.body.mode !== supportedMode) {
    throw new ApiError(422, "unsupported_mode", `This class is available ${supportedMode} only`);
  }

  const availabilityText = post?.availability || tutor.availability || "";
  const [existingBookings] = await db.query(
    `SELECT class_date, class_time FROM bookings
     WHERE tutor_id = ? AND class_date = ? AND status IN ('pending', 'confirmed', 'rescheduled')`,
    [tutorId, req.body.class_date],
  );
  const normalizedTime = req.body.class_time?.slice(0, 5);
  const availabilitySlots = generateAvailabilitySlots({ availabilityText, fromDate: req.body.class_date, toDate: req.body.class_date, existingBookings });
  const slotIsAvailable = !availabilityText || availabilitySlots.some((slot) => slot.date === req.body.class_date && slot.time === normalizedTime);
  if (!slotIsAvailable) {
    throw new ApiError(422, "slot_unavailable", "Choose one of the tutor's available calendar slots");
  }
  if (req.body.class_type === "trial" && !post?.has_trial) {
    throw new ApiError(422, "trial_unavailable", "The selected class does not offer a trial");
  }
  if (req.body.class_type === "trial") {
    const [[existingTrial]] = await db.query(
      `SELECT id FROM bookings WHERE student_id = ? AND tutor_id = ? AND class_type = 'trial'
       AND status <> 'cancelled' LIMIT 1`,
      [req.user.id, tutorId],
    );
    if (existingTrial) {
      throw new ApiError(409, "trial_already_used", "You already have a trial class with this tutor. Book a regular class instead.");
    }
  }

  const [[duplicate]] = await db.query(
    `SELECT id FROM bookings WHERE student_id = ? AND tutor_id = ? AND class_date = ? AND class_time = ?
     AND status IN ('pending', 'confirmed', 'rescheduled') LIMIT 1`,
    [req.user.id, tutorId, req.body.class_date, req.body.class_time],
  );
  if (duplicate) throw new ApiError(409, "booking_conflict", "You already have an active request with this tutor at that time");

  const booking = await Booking.create({
    student_id: req.user.id,
    tutor_id: tutorId,
    tutor_post_id: post?.id || null,
    class_type: req.body.class_type,
    class_date: req.body.class_date,
    class_time: req.body.class_time,
    duration_minutes: duration,
    mode: req.body.mode,
    meeting_link_or_location: req.body.meeting_link_or_location,
    status: "pending",
  });
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
