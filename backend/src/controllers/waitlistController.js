import db from "../config/db.js";
import BookingWaitlist, { findByStudentAndSlot, findByStudentId, findByTutorId } from "../models/BookingWaitlist.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { normalizeDateOnly } from "../utils/availabilityCalendar.js";
import { notify } from "../utils/notifications.js";
import { sendSuccess } from "../utils/respond.js";

const today = () => new Date().toISOString().slice(0, 10);
const timeRegex = /^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/;

export const joinWaitlist = asyncHandler(async (req, res) => {
  const tutorId = Number(req.body.tutor_id);
  if (!Number.isSafeInteger(tutorId) || tutorId < 1) {
    throw new ApiError(422, "invalid_tutor", "Select a valid tutor");
  }

  const [[tutor]] = await db.query(
    "SELECT id, full_name FROM users WHERE id = ? AND role = 'tutor' AND is_active = TRUE",
    [tutorId],
  );
  if (!tutor) throw new ApiError(404, "tutor_not_found", "An active tutor was not found");

  const classDate = normalizeDateOnly(req.body.class_date);
  const classTime = req.body.class_time?.slice(0, 5);

  if (!classDate) throw new ApiError(422, "invalid_date", "Choose a valid date");
  if (classDate < today()) throw new ApiError(422, "past_date", "Date must be today or in the future");
  if (!classTime || !timeRegex.test(classTime)) throw new ApiError(422, "invalid_time", "Choose a valid time");

  if (req.user.id === tutorId) {
    throw new ApiError(403, "forbidden", "You cannot join the waitlist for your own class");
  }

  // Check if student is already on the waitlist for this slot
  const existingWaitlist = await findByStudentAndSlot(req.user.id, tutorId, classDate, classTime);
  if (existingWaitlist) {
    throw new ApiError(409, "already_on_waitlist", "You are already on the waitlist for this class slot");
  }

  // Check if student already has a booking for this slot
  const [[existingBooking]] = await db.query(
    `SELECT id FROM bookings
     WHERE student_id = ? AND tutor_id = ? AND class_date = ? AND DATE_FORMAT(class_time, '%H:%i') = ?
       AND status IN ('pending', 'confirmed', 'rescheduled') LIMIT 1`,
    [req.user.id, tutorId, classDate, classTime],
  );
  if (existingBooking) {
    throw new ApiError(409, "already_booked", "You already have an active booking for this slot");
  }

  const entry = await BookingWaitlist.create({
    student_id: req.user.id,
    tutor_id: tutorId,
    class_date: classDate,
    class_time: classTime,
    status: "waiting",
  });

  await notify(
    tutorId,
    "New Waitlist Entry",
    `A student joined the waitlist for your booked slot on ${classDate} at ${classTime}.`,
    "waitlist_joined",
  );

  sendSuccess(res, entry, "Successfully joined class waitlist", 201);
});

export const getMentorWaitlist = asyncHandler(async (req, res) => {
  const waitlist = await findByTutorId(req.user.id);
  sendSuccess(res, waitlist, "Mentor waitlist loaded");
});

export const getStudentWaitlist = asyncHandler(async (req, res) => {
  const waitlist = await findByStudentId(req.user.id);
  sendSuccess(res, waitlist, "Student waitlist loaded");
});

export const cancelWaitlistEntry = asyncHandler(async (req, res) => {
  const entryId = Number(req.params.id);
  if (!Number.isSafeInteger(entryId) || entryId < 1) {
    throw new ApiError(422, "invalid_id", "Invalid waitlist entry ID");
  }

  const entry = await BookingWaitlist.findById(entryId);
  if (!entry) throw new ApiError(404, "entry_not_found", "Waitlist entry was not found");

  const canCancel = [entry.student_id, entry.tutor_id].includes(req.user.id) || req.user.role === "admin";
  if (!canCancel) {
    throw new ApiError(403, "forbidden", "You cannot cancel this waitlist entry");
  }

  await BookingWaitlist.remove(entryId);
  sendSuccess(res, { id: entryId }, "Waitlist entry removed");
});
