import db from "../config/db.js";
import TutorAvailability, { findByTutorAndDateRange, findByTutorId } from "../models/TutorAvailability.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { normalizeDateOnly } from "../utils/availabilityCalendar.js";
import { sendSuccess } from "../utils/respond.js";

const today = () => new Date().toISOString().slice(0, 10);
const timeRegex = /^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/;

const normalizeTimeStr = (t) => {
  if (!t) return null;
  const str = String(t).trim();
  const match = str.match(/^([01]\d|2[0-3]):([0-5]\d)/);
  return match ? `${match[1]}:${match[2]}` : null;
};

export const createAvailability = asyncHandler(async (req, res) => {
  const { date, start_time, end_time } = req.body;
  const normalizedDate = normalizeDateOnly(date);
  const startTime = normalizeTimeStr(start_time);
  const endTime = normalizeTimeStr(end_time);

  if (!normalizedDate) throw new ApiError(422, "invalid_date", "Provide a valid date (YYYY-MM-DD)");
  if (normalizedDate < today()) throw new ApiError(422, "past_date", "Availability date must be today or in the future");
  if (!startTime || !timeRegex.test(startTime)) throw new ApiError(422, "invalid_start_time", "Provide a valid start time (HH:MM)");
  if (!endTime || !timeRegex.test(endTime)) throw new ApiError(422, "invalid_end_time", "Provide a valid end time (HH:MM)");

  if (startTime >= endTime) {
    throw new ApiError(422, "invalid_time_range", "End time must be after start time");
  }

  // Check for exact unique slot constraint or overlapping slots for this tutor on this date
  const [[existing]] = await db.query(
    `SELECT id FROM tutor_availabilities
     WHERE tutor_id = ? AND date = ? AND start_time = ? LIMIT 1`,
    [req.user.id, normalizedDate, startTime],
  );
  if (existing) {
    throw new ApiError(409, "slot_already_exists", "An availability slot starting at this time already exists for this date");
  }

  const slot = await TutorAvailability.create({
    tutor_id: req.user.id,
    date: normalizedDate,
    start_time: startTime,
    end_time: endTime,
  });

  sendSuccess(res, slot, "Availability slot created", 201);
});

export const deleteAvailability = asyncHandler(async (req, res) => {
  const slotId = Number(req.params.id);
  if (!Number.isSafeInteger(slotId) || slotId < 1) {
    throw new ApiError(422, "invalid_id", "Invalid availability slot ID");
  }

  const slot = await TutorAvailability.findById(slotId);
  if (!slot) throw new ApiError(404, "slot_not_found", "Availability slot was not found");
  if (slot.tutor_id !== req.user.id) {
    throw new ApiError(403, "forbidden", "You can only delete your own availability slots");
  }

  // Check if there is an active booking on this slot
  const normalizedTime = String(slot.start_time).slice(0, 5);
  const [[activeBooking]] = await db.query(
    `SELECT id FROM bookings
     WHERE tutor_id = ? AND class_date = ? AND DATE_FORMAT(class_time, '%H:%i') = ?
       AND status IN ('pending', 'confirmed', 'rescheduled') LIMIT 1`,
    [req.user.id, slot.date, normalizedTime],
  );

  if (activeBooking) {
    throw new ApiError(409, "slot_has_booking", "Cannot delete an availability slot with an active booking");
  }

  await TutorAvailability.remove(slotId);
  sendSuccess(res, { id: slotId }, "Availability slot deleted");
});

export const getMentorAvailability = asyncHandler(async (req, res) => {
  const slots = await findByTutorId(req.user.id);
  
  // Cross reference with active bookings to annotate slots
  const [bookings] = await db.query(
    `SELECT b.id, b.class_date, DATE_FORMAT(b.class_time, '%H:%i') AS class_time, b.status, u.full_name AS student_name
     FROM bookings b
     JOIN users u ON u.id = b.student_id
     WHERE b.tutor_id = ? AND b.status IN ('pending', 'confirmed', 'rescheduled')`,
    [req.user.id],
  );

  const bookingMap = new Map();
  bookings.forEach((b) => {
    const key = `${normalizeDateOnly(b.class_date)}:${b.class_time}`;
    bookingMap.set(key, b);
  });

  const annotatedSlots = slots.map((slot) => {
    const dateStr = normalizeDateOnly(slot.date);
    const startTimeStr = String(slot.start_time).slice(0, 5);
    const key = `${dateStr}:${startTimeStr}`;
    const booking = bookingMap.get(key);
    return {
      ...slot,
      date: dateStr,
      start_time: startTimeStr,
      end_time: String(slot.end_time).slice(0, 5),
      is_booked: Boolean(booking),
      booking: booking || null,
    };
  });

  sendSuccess(res, annotatedSlots, "Mentor availability slots loaded");
});
