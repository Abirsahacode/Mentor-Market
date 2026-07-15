import db from "../config/db.js";
import Application from "../models/Application.js";
import StudentRequest from "../models/StudentRequest.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { notify } from "../utils/notifications.js";
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
  if (!['accepted', 'rejected'].includes(req.body.status)) {
    throw new ApiError(422, "invalid_status", "Status must be accepted or rejected");
  }
  const application = await Application.findById(req.params.id);
  if (!application) throw new ApiError(404, "application_not_found", "Application was not found");
  const request = await StudentRequest.findById(application.student_request_id);
  if (req.user.role !== "admin" && request.student_id !== req.user.id) {
    throw new ApiError(403, "forbidden", "Only the request owner can decide this application");
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    await connection.query("UPDATE applications SET status = ? WHERE id = ?", [req.body.status, application.id]);
    if (req.body.status === "accepted") {
      await connection.query("UPDATE applications SET status = 'rejected' WHERE student_request_id = ? AND id <> ?", [request.id, application.id]);
      await connection.query("UPDATE student_requests SET status = 'hired' WHERE id = ?", [request.id]);
    }
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
  await notify(application.tutor_id, `Application ${req.body.status}`, `Your proposal for ${request.subject} was ${req.body.status}.`, `application_${req.body.status}`);
  sendSuccess(res, await Application.findById(application.id), `Application ${req.body.status}`);
});

export const deleteApplication = asyncHandler(async (req, res) => {
  const application = await Application.findById(req.params.id);
  if (!application) throw new ApiError(404, "application_not_found", "Application was not found");
  if (req.user.role !== "admin" && application.tutor_id !== req.user.id) throw new ApiError(403, "forbidden", "You cannot withdraw this application");
  if (application.status !== "pending") throw new ApiError(409, "application_decided", "A decided application cannot be withdrawn");
  await Application.remove(application.id);
  res.status(204).send();
});
