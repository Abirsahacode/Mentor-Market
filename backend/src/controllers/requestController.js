import db from "../config/db.js";
import StudentRequest from "../models/StudentRequest.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { getPagination } from "../utils/pagination.js";
import { sendSuccess } from "../utils/respond.js";

const editableRequestFields = [
  "subject", "class_level", "budget", "location", "teaching_mode", "preferred_time",
  "required_experience", "description", "status",
];
const pickEditableRequest = (payload) => Object.fromEntries(
  editableRequestFields.filter((field) => payload[field] !== undefined).map((field) => [field, payload[field]]),
);

export const listRequests = asyncHandler(async (req, res) => {
  const { page, limit, offset } = getPagination(req.query);
  const filters = {};
  ["subject", "teaching_mode", "status", "student_id"].forEach((field) => {
    if (req.query[field]) filters[field] = req.query[field];
  });
  const result = await StudentRequest.findAll({ filters, q: req.query.q, limit, offset });
  const studentIds = [...new Set(result.rows.map((request) => request.student_id))];
  let students = [];
  if (studentIds.length) {
    [students] = await db.query(
      `SELECT id, SUBSTRING_INDEX(full_name, ' ', 1) AS full_name, avatar_url
       FROM users WHERE id IN (${studentIds.map(() => "?").join(",")})`, studentIds,
    );
  }
  const byId = Object.fromEntries(students.map((student) => [student.id, student]));
  sendSuccess(res, result.rows.map((request) => ({ ...request, student: byId[request.student_id] })), "Student requests loaded", 200, { page, limit, total: result.total, pages: Math.ceil(result.total / limit) });
});

export const getRequest = asyncHandler(async (req, res) => {
  const request = await StudentRequest.findById(req.params.id);
  if (!request) throw new ApiError(404, "request_not_found", "Student request was not found");
  sendSuccess(res, request, "Student request loaded");
});

export const createRequest = asyncHandler(async (req, res) => {
  const request = await StudentRequest.create({ ...req.body, student_id: req.user.id });
  sendSuccess(res, request, "Tutor request created", 201);
});

const assertRequestOwner = async (req) => {
  const request = await StudentRequest.findById(req.params.id);
  if (!request) throw new ApiError(404, "request_not_found", "Student request was not found");
  if (req.user.role !== "admin" && request.student_id !== req.user.id) throw new ApiError(403, "forbidden", "You cannot modify this request");
  return request;
};

export const updateRequest = asyncHandler(async (req, res) => {
  await assertRequestOwner(req);
  sendSuccess(res, await StudentRequest.update(req.params.id, pickEditableRequest(req.body)), "Tutor request updated");
});

export const deleteRequest = asyncHandler(async (req, res) => {
  await assertRequestOwner(req);
  await StudentRequest.remove(req.params.id);
  res.status(204).send();
});
