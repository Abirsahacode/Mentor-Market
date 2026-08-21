import db from "../config/db.js";
import Booking from "../models/Booking.js";
import { processWaitlistOnSlotFreed } from "../models/BookingWaitlist.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { notify } from "../utils/notifications.js";
import { sendSuccess } from "../utils/respond.js";
import { generateAvailabilitySlots, normalizeDateOnly } from "../utils/availabilityCalendar.js";

const MAX_AVAILABILITY_DAYS = 31;
const DAY_IN_MS = 24 * 60 * 60 * 1000;
const today = () => new Date().toISOString().slice(0, 10);
const terminalBookingStatuses = ["completed", "cancelled"];
const bookingTransitions = {
  student: {
    pending: ["cancelled", "rescheduled"],
    confirmed: ["cancelled", "rescheduled"],
    rescheduled: ["cancelled", "rescheduled"],
  },
  tutor: {
    pending: ["confirmed", "cancelled", "rescheduled"],
    confirmed: ["completed", "cancelled", "rescheduled"],
    rescheduled: ["confirmed", "completed", "cancelled", "rescheduled"],
  },
  admin: {
    pending: ["cancelled"],
    confirmed: ["cancelled"],
    rescheduled: ["cancelled"],
  },
};

export const canTransitionBooking = ({ role, currentStatus, nextStatus }) => (
  Boolean(nextStatus) && (bookingTransitions[role]?.[currentStatus] || []).includes(nextStatus)
);

const findBookingConflict = async ({
  tutorId,
  studentId,
  classDate,
  classTime,
  durationMinutes,
  excludeBookingId,
}) => {
  const values = [
    classDate,
    tutorId,
    studentId,
    classTime,
    durationMinutes,
    classTime,
  ];
  const exclude = excludeBookingId ? "AND id <> ?" : "";
  if (excludeBookingId) values.push(excludeBookingId);
  const [[conflict]] = await db.query(
    `SELECT id FROM bookings
     WHERE class_date = ?
       AND (tutor_id = ? OR student_id = ?)
       AND status IN ('pending', 'confirmed', 'rescheduled')
       AND TIME_TO_SEC(class_time) < TIME_TO_SEC(?) + (? * 60)
       AND TIME_TO_SEC(class_time) + (duration_minutes * 60) > TIME_TO_SEC(?)
       ${exclude}
     LIMIT 1`,
    values,
  );
  return conflict || null;
};

const readAvailabilityRange = (query) => {
  const fromDate = query.from_date || today();
  const toDate = query.to_date || fromDate;
  const normalizedFrom = normalizeDateOnly(fromDate);
  const normalizedTo = normalizeDateOnly(toDate);
  if (normalizedFrom !== fromDate || normalizedTo !== toDate) {
    throw new ApiError(422, "invalid_date_range", "Availability dates must use valid YYYY-MM-DD values");
  }
  const dayCount = Math.floor(
    (Date.parse(`${toDate}T00:00:00.000Z`) - Date.parse(`${fromDate}T00:00:00.000Z`)) / DAY_IN_MS,
  ) + 1;
  if (dayCount < 1) {
    throw new ApiError(422, "invalid_date_range", "The availability end date must be on or after the start date");
  }
  if (dayCount > MAX_AVAILABILITY_DAYS) {
    throw new ApiError(422, "availability_range_too_large", `Availability can be loaded for at most ${MAX_AVAILABILITY_DAYS} days`);
  }
  return { fromDate, toDate };
};

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
  if (!Number.isSafeInteger(tutorId) || tutorId < 1) {
    throw new ApiError(422, "invalid_tutor", "Choose a tutor before loading availability");
  }
  const { fromDate, toDate } = readAvailabilityRange(req.query);

  const [[tutor]] = await db.query(
    `SELECT u.id, tp.availability, tp.teaching_mode FROM users u
     LEFT JOIN tutor_profiles tp ON tp.user_id = u.id
     WHERE u.id = ? AND u.role = 'tutor' AND u.is_active = TRUE`,
    [tutorId],
  );
  if (!tutor) throw new ApiError(404, "tutor_not_found", "An active tutor was not found");

  const [existingBookings] = await db.query(
    `SELECT class_date, DATE_FORMAT(class_time, '%H:%i') AS class_time FROM bookings
     WHERE tutor_id = ? AND class_date BETWEEN ? AND ? AND status IN ('pending', 'confirmed', 'rescheduled')`,
    [tutorId, fromDate, toDate],
  );

  const [explicitSlots] = await db.query(
    `SELECT id, date, DATE_FORMAT(start_time, '%H:%i') AS start_time, DATE_FORMAT(end_time, '%H:%i') AS end_time
     FROM tutor_availabilities
     WHERE tutor_id = ? AND date BETWEEN ? AND ?
     ORDER BY date ASC, start_time ASC`,
    [tutorId, fromDate, toDate],
  );

  let slots = [];
  const bookedSet = new Set(
    existingBookings.map((b) => `${normalizeDateOnly(b.class_date)}:${b.class_time}`),
  );

  if (explicitSlots.length > 0) {
    slots = explicitSlots.map((slot) => {
      const dateKey = normalizeDateOnly(slot.date);
      const timeKey = slot.start_time;
      const isBooked = bookedSet.has(`${dateKey}:${timeKey}`);
      return {
        id: slot.id,
        date: dateKey,
        time: timeKey,
        end_time: slot.end_time,
        label: `${dateKey} · ${timeKey}`,
        is_booked: isBooked,
        status: isBooked ? "booked" : "available",
      };
    });
  } else {
    const availabilityText = tutor.availability || "";
    const generated = generateAvailabilitySlots({ availabilityText, fromDate, toDate, existingBookings });
    slots = generated.map((slot) => ({
      ...slot,
      is_booked: false,
      status: "available",
    }));
  }

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
  if (normalizeDateOnly(req.body.class_date) !== req.body.class_date) throw new ApiError(422, "invalid_date", "Choose a valid class date");
  if (!/^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/.test(req.body.class_time)) throw new ApiError(422, "invalid_time", "Choose a valid class time");
  if (req.body.class_date < today()) throw new ApiError(422, "past_class_date", "Class date must be today or later");

  let post = null;
  if (req.body.tutor_post_id) {
    [[post]] = await db.query(
      "SELECT id, tutor_id, teaching_mode, has_trial, status FROM tutor_posts WHERE id = ?",
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

  const availabilityText = tutor.availability || "";
  const [existingBookings] = await db.query(
    `SELECT class_date, DATE_FORMAT(class_time, '%H:%i') AS class_time FROM bookings
     WHERE tutor_id = ? AND class_date = ? AND status IN ('pending', 'confirmed', 'rescheduled')`,
    [tutorId, req.body.class_date],
  );
  const normalizedTime = req.body.class_time?.slice(0, 5);

  const [explicitSlots] = await db.query(
    `SELECT id, date, DATE_FORMAT(start_time, '%H:%i') AS start_time FROM tutor_availabilities
     WHERE tutor_id = ? AND date = ?`,
    [tutorId, req.body.class_date],
  );

  let slotIsAvailable = false;
  if (explicitSlots.length > 0) {
    const matchingSlot = explicitSlots.find((slot) => slot.start_time === normalizedTime);
    if (matchingSlot) {
      const isBooked = existingBookings.some(
        (b) => normalizeDateOnly(b.class_date) === req.body.class_date && b.class_time === normalizedTime,
      );
      if (!isBooked) slotIsAvailable = true;
    }
  } else {
    const availabilitySlots = generateAvailabilitySlots({ availabilityText, fromDate: req.body.class_date, toDate: req.body.class_date, existingBookings });
    slotIsAvailable = availabilitySlots.some((slot) => slot.date === req.body.class_date && slot.time === normalizedTime);
  }

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

  const conflict = await findBookingConflict({
    tutorId,
    studentId: req.user.id,
    classDate: req.body.class_date,
    classTime: normalizedTime,
    durationMinutes: duration,
  });
  if (conflict) throw new ApiError(409, "booking_conflict", "This time overlaps another active class for you or the tutor");

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
  if (terminalBookingStatuses.includes(booking.status)) {
    throw new ApiError(409, "booking_finalized", "Completed or cancelled bookings cannot be changed");
  }

  const nextStatus = req.body.status;
  const allowedStatuses = ["confirmed", "completed", "cancelled", "rescheduled"];
  if (nextStatus && !allowedStatuses.includes(nextStatus)) throw new ApiError(422, "invalid_status", "Invalid booking status");
  if (nextStatus && !canTransitionBooking({ role: req.user.role, currentStatus: booking.status, nextStatus })) {
    throw new ApiError(409, "invalid_booking_transition", `${req.user.role} cannot move a ${booking.status} booking to ${nextStatus}`);
  }

  const hasScheduleChange = req.body.class_date !== undefined || req.body.class_time !== undefined;
  if (hasScheduleChange && nextStatus && nextStatus !== "rescheduled") {
    throw new ApiError(422, "invalid_reschedule_status", "Schedule changes must use the rescheduled status");
  }
  let classDate = normalizeDateOnly(booking.class_date);
  let classTime = String(booking.class_time || "").slice(0, 5);
  if (hasScheduleChange) {
    if (req.user.role === "admin") {
      throw new ApiError(403, "forbidden", "Administrators can cancel bookings but cannot choose participant schedules");
    }
    classDate = req.body.class_date ?? classDate;
    classTime = String(req.body.class_time ?? classTime).slice(0, 5);
    if (normalizeDateOnly(classDate) !== classDate) throw new ApiError(422, "invalid_date", "Choose a valid class date");
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(classTime)) throw new ApiError(422, "invalid_time", "Choose a valid class time");
    if (classDate < today()) throw new ApiError(422, "past_class_date", "Class date must be today or later");

    const [[tutor]] = await db.query(
      "SELECT availability FROM tutor_profiles WHERE user_id = ?",
      [booking.tutor_id],
    );
    const [existingBookings] = await db.query(
      `SELECT class_date, class_time FROM bookings
       WHERE tutor_id = ? AND class_date = ? AND id <> ?
         AND status IN ('pending', 'confirmed', 'rescheduled')`,
      [booking.tutor_id, classDate, booking.id],
    );
    const available = generateAvailabilitySlots({
      availabilityText: tutor?.availability || "",
      fromDate: classDate,
      toDate: classDate,
      existingBookings,
    }).some((slot) => slot.date === classDate && slot.time === classTime);
    if (!available) throw new ApiError(422, "slot_unavailable", "Choose one of the tutor's available calendar slots");

    const conflict = await findBookingConflict({
      tutorId: booking.tutor_id,
      studentId: booking.student_id,
      classDate,
      classTime,
      durationMinutes: booking.duration_minutes,
      excludeBookingId: booking.id,
    });
    if (conflict) throw new ApiError(409, "booking_conflict", "This time overlaps another active class for the student or tutor");
  }

  if (req.body.meeting_link_or_location !== undefined && req.user.role === "student") {
    throw new ApiError(403, "forbidden", "Only the tutor can set class access details");
  }
  if (nextStatus === "completed") {
    const scheduledAt = new Date(`${classDate}T${classTime}:00`).getTime();
    if (Number.isFinite(scheduledAt) && scheduledAt > Date.now()) {
      throw new ApiError(409, "class_not_started", "A future class cannot be marked completed");
    }
  }
  const allowedBody = {
    ...(nextStatus || hasScheduleChange ? { status: hasScheduleChange ? "rescheduled" : nextStatus } : {}),
    ...(hasScheduleChange ? { class_date: classDate, class_time: classTime } : {}),
    ...(req.body.meeting_link_or_location !== undefined
      ? { meeting_link_or_location: req.body.meeting_link_or_location }
      : {}),
  };
  if (!Object.keys(allowedBody).length) {
    throw new ApiError(422, "no_booking_changes", "Add a status, schedule, or class access update");
  }
  const updated = await Booking.update(booking.id, allowedBody);

  if (nextStatus === "cancelled" || hasScheduleChange) {
    await processWaitlistOnSlotFreed(booking.tutor_id, booking.class_date, booking.class_time);
  }

  const recipients = req.user.role === "admin"
    ? [booking.student_id, booking.tutor_id]
    : [req.user.id === booking.student_id ? booking.tutor_id : booking.student_id];
  await Promise.all(recipients.map((recipientId) => notify(
    recipientId,
    "Booking updated",
    `Booking #${booking.id} is now ${updated.status}.`,
    `booking_${updated.status}`,
  )));
  sendSuccess(res, updated, "Booking updated");
});
