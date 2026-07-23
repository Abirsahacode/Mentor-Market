import db from "../config/db.js";
import Application from "../models/Application.js";
import Booking from "../models/Booking.js";
import StudentRequest from "../models/StudentRequest.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { notify } from "../utils/notifications.js";
import { parsePreferredTime } from "../utils/scheduling.js";
import { sendSuccess } from "../utils/respond.js";

export const listApplications = asyncHandler(async (req, res) => {
  const clauses = [];
  const values = [];
  if (req.user.role === "tutor") {
    clauses.push("a.tutor_id = ?");
    values.push(req.user.id);
  } else if (req.user.role === "student") {
    clauses.push("sr.student_id = ?");
    values.push(req.user.id);
  }
  if (req.query.status) { clauses.push("a.status = ?"); values.push(req.query.status); }
  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  const [rows] = await db.query(
    `SELECT a.*, sr.subject, sr.class_level, sr.student_id, tutor.full_name AS tutor_name,
      student.full_name AS student_name FROM applications a
     JOIN student_requests sr ON sr.id = a.student_request_id
     JOIN users tutor ON tutor.id = a.tutor_id JOIN users student ON student.id = sr.student_id
     ${where} ORDER BY a.created_at DESC`, values,
  );
  sendSuccess(res, rows, "Applications loaded");
});

export const createApplication = asyncHandler(async (req, res) => {
  const request = await StudentRequest.findById(req.body.student_request_id);
  if (!request || request.status !== "open") throw new ApiError(409, "request_not_open", "This tutor request is no longer open");
  const application = await Application.create({ ...req.body, tutor_id: req.user.id, status: "pending" });
  await notify(request.student_id, "New tutor application", `A tutor applied to your ${request.subject} request.`, "new_application");
  sendSuccess(res, application, "Application submitted", 201);
});

export const updateApplicationStatus = asyncHandler(async (req, res) => {
  if (!["accepted", "rejected"].includes(req.body.status)) {
    throw new ApiError(422, "invalid_status", "Status must be accepted or rejected");
  }

  let booking = null;
  let application;
  let request;
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // Lock the parent request before the individual proposal. Every decision
    // for the same request then takes locks in the same order, preventing two
    // concurrent accepts from hiring different tutors.
    const [[applicationSnapshot]] = await connection.query(
      "SELECT * FROM applications WHERE id = ? LIMIT 1",
      [req.params.id],
    );
    if (!applicationSnapshot) throw new ApiError(404, "application_not_found", "Application was not found");

    [[request]] = await connection.query(
      "SELECT * FROM student_requests WHERE id = ? FOR UPDATE",
      [applicationSnapshot.student_request_id],
    );
    [[application]] = await connection.query(
      "SELECT * FROM applications WHERE id = ? FOR UPDATE",
      [req.params.id],
    );
    if (!request || !application) throw new ApiError(404, "application_not_found", "Application was not found");
    if (application.status !== "pending") {
      throw new ApiError(409, "application_already_decided", "This application has already been decided");
    }
    if (req.user.role !== "admin" && request.student_id !== req.user.id) {
      throw new ApiError(403, "forbidden", "Only the request owner can decide this application");
    }
    if (req.body.status === "accepted" && request.status !== "open") {
      throw new ApiError(409, "request_not_open", "This tutor request has already been filled or closed");
    }

    const [decision] = await connection.query(
      "UPDATE applications SET status = ? WHERE id = ? AND status = 'pending'",
      [req.body.status, application.id],
    );
    if (decision.affectedRows !== 1) {
      throw new ApiError(409, "application_already_decided", "This application has already been decided");
    }

    if (req.body.status === "accepted") {
      await connection.query(
        "UPDATE applications SET status = 'rejected' WHERE student_request_id = ? AND id <> ? AND status = 'pending'",
        [request.id, application.id],
      );
      const [requestUpdate] = await connection.query(
        "UPDATE student_requests SET status = 'hired' WHERE id = ? AND status = 'open'",
        [request.id],
      );
      if (requestUpdate.affectedRows !== 1) {
        throw new ApiError(409, "request_not_open", "This tutor request has already been filled or closed");
      }

      // Accepting a proposal is a commitment to a class, so the booking that
      // both dashboards rely on is created right here instead of leaving the
      // student to separately re-book the same tutor from scratch. The exact
      // date/time is a best-effort read of the tutor's proposed availability;
      // either side can still adjust it with PATCH /bookings/:id.
      const { class_date, class_time } = parsePreferredTime(application.available_time || request.preferred_time);
      const mode = request.teaching_mode === "both" ? "online" : request.teaching_mode;
      booking = await Booking.create({
        student_id: request.student_id,
        tutor_id: application.tutor_id,
        student_request_id: request.id,
        class_type: "one-time",
        class_date,
        class_time,
        duration_minutes: 60,
        mode,
        meeting_link_or_location: `Proposed time from application: ${application.available_time}`,
        status: "pending",
      }, connection);
    }
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
  await notify(application.tutor_id, `Application ${req.body.status}`, `Your proposal for ${request.subject} was ${req.body.status}.`, `application_${req.body.status}`);
  if (booking) {
    await notify(
      request.student_id,
      "Class booking created",
      `Your accepted request with ${request.subject} was scheduled for ${String(booking.class_date).slice(0, 10)} at ${String(booking.class_time).slice(0, 5)}. Review or adjust it from your bookings page.`,
      "new_booking",
    );
  }
  sendSuccess(res, { ...(await Application.findById(application.id)), booking }, `Application ${req.body.status}`);
});

export const deleteApplication = asyncHandler(async (req, res) => {
  const application = await Application.findById(req.params.id);
  if (!application) throw new ApiError(404, "application_not_found", "Application was not found");
  if (req.user.role !== "admin" && application.tutor_id !== req.user.id) throw new ApiError(403, "forbidden", "You cannot withdraw this application");
  if (application.status !== "pending") throw new ApiError(409, "application_decided", "A decided application cannot be withdrawn");
  await Application.remove(application.id);
  res.status(204).send();
});
