import db from "../config/db.js";
import Booking from "../models/Booking.js";
import RescheduleRequest, { findByBookingId, findPendingByBookingId, findPendingForUser } from "../models/RescheduleRequest.js";
import { processWaitlistOnSlotFreed } from "../models/BookingWaitlist.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { normalizeDateOnly } from "../utils/availabilityCalendar.js";
import { notify } from "../utils/notifications.js";
import { sendSuccess } from "../utils/respond.js";

const today = () => new Date().toISOString().slice(0, 10);
const timeRegex = /^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/;

export const createRescheduleRequest = asyncHandler(async (req, res) => {
  const bookingId = Number(req.params.id);
  if (!Number.isSafeInteger(bookingId) || bookingId < 1) {
    throw new ApiError(422, "invalid_booking_id", "Invalid booking ID");
  }

  const booking = await Booking.findById(bookingId);
  if (!booking) throw new ApiError(404, "booking_not_found", "Booking was not found");

  const isParticipant = [booking.student_id, booking.tutor_id].includes(req.user.id);
  if (!isParticipant) throw new ApiError(403, "forbidden", "You can only request a reschedule for your own classes");

  if (["completed", "cancelled"].includes(booking.status)) {
    throw new ApiError(409, "booking_finalized", "Cannot reschedule a completed or cancelled booking");
  }

  const newDate = normalizeDateOnly(req.body.new_date);
  const newTime = req.body.new_time?.slice(0, 5);

  if (!newDate) throw new ApiError(422, "invalid_date", "Choose a valid date");
  if (newDate < today()) throw new ApiError(422, "past_date", "New class date must be today or in the future");
  if (!newTime || !timeRegex.test(newTime)) throw new ApiError(422, "invalid_time", "Choose a valid start time");

  const existingPending = await findPendingByBookingId(bookingId);
  if (existingPending) {
    throw new ApiError(409, "reschedule_already_pending", "A reschedule request is already pending for this class");
  }

  const requestedToId = req.user.id === booking.student_id ? booking.tutor_id : booking.student_id;

  const request = await RescheduleRequest.create({
    booking_id: bookingId,
    requested_by_id: req.user.id,
    requested_to_id: requestedToId,
    new_date: newDate,
    new_time: newTime,
    reason: req.body.reason ? String(req.body.reason).trim() : null,
    status: "pending",
  });

  await notify(
    requestedToId,
    "Reschedule Requested",
    `${req.user.full_name} requested to reschedule Class #${bookingId} to ${newDate} at ${newTime}.`,
    "reschedule_requested",
  );

  sendSuccess(res, request, "Reschedule request submitted successfully", 201);
});

export const respondRescheduleRequest = asyncHandler(async (req, res) => {
  const requestId = Number(req.params.id);
  if (!Number.isSafeInteger(requestId) || requestId < 1) {
    throw new ApiError(422, "invalid_id", "Invalid reschedule request ID");
  }

  const reschedule = await RescheduleRequest.findById(requestId);
  if (!reschedule) throw new ApiError(404, "request_not_found", "Reschedule request was not found");

  if (reschedule.status !== "pending") {
    throw new ApiError(409, "request_processed", `This reschedule request has already been ${reschedule.status}`);
  }

  const isRecipient = req.user.id === reschedule.requested_to_id || req.user.role === "admin";
  if (!isRecipient) {
    throw new ApiError(403, "forbidden", "Only the recipient can approve or deny a reschedule request");
  }

  const status = req.body.status;
  if (!["accepted", "rejected"].includes(status)) {
    throw new ApiError(422, "invalid_status", "Status must be 'accepted' or 'rejected'");
  }

  const booking = await Booking.findById(reschedule.booking_id);
  if (!booking) throw new ApiError(404, "booking_not_found", "Associated booking was not found");

  const connection = await db.getConnection();
  let updatedReschedule;
  try {
    await connection.beginTransaction();

    if (status === "accepted") {
      const oldDate = normalizeDateOnly(booking.class_date);
      const oldTime = String(booking.class_time).slice(0, 5);
      const newDateStr = normalizeDateOnly(reschedule.new_date);
      const newTimeStr = String(reschedule.new_time).slice(0, 5);

      // Update the booking record with new date, time, and rescheduled status
      await connection.query(
        `UPDATE bookings
         SET class_date = ?, class_time = ?, status = 'rescheduled'
         WHERE id = ?`,
        [newDateStr, newTimeStr, reschedule.booking_id],
      );

      // Offer the freed original slot to the next waitlisted student
      await processWaitlistOnSlotFreed(booking.tutor_id, oldDate, oldTime, connection);
    }

    await connection.query(
      "UPDATE reschedule_requests SET status = ? WHERE id = ?",
      [status, requestId],
    );

    updatedReschedule = await RescheduleRequest.findById(requestId, connection);
    await connection.commit();
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }

  const notificationTitle = status === "accepted" ? "Reschedule Request Accepted" : "Reschedule Request Declined";
  const notificationMsg = status === "accepted"
    ? `Your request to reschedule Class #${reschedule.booking_id} was accepted.`
    : `Your request to reschedule Class #${reschedule.booking_id} was declined.`;

  await notify(reschedule.requested_by_id, notificationTitle, notificationMsg, `reschedule_${status}`);

  sendSuccess(res, updatedReschedule, `Reschedule request ${status}`);
});

export const getBookingRescheduleRequests = asyncHandler(async (req, res) => {
  const bookingId = Number(req.params.id);
  const requests = await findByBookingId(bookingId);
  sendSuccess(res, requests, "Reschedule requests loaded");
});

export const getMyPendingRescheduleRequests = asyncHandler(async (req, res) => {
  const requests = await findPendingForUser(req.user.id);
  sendSuccess(res, requests, "Pending reschedule requests loaded");
});
