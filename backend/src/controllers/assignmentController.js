import Assignment from "../models/Assignment.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { notify } from "../utils/notifications.js";
import { sendSuccess } from "../utils/respond.js";
import { requireTeachingRelationship } from "../utils/teachingRelationship.js";

export const listAssignments = asyncHandler(async (req, res) => {
  const field = req.user.role === "student" ? "student_id" : "tutor_id";
  const filters = req.user.role === "admin" ? {} : { [field]: req.user.id };
  if (req.query.status) filters.status = req.query.status;
  const { rows } = await Assignment.findAll({ filters, q: req.query.q, limit: 100 });
  sendSuccess(res, rows, "Assignments loaded");
});

export const createAssignment = asyncHandler(async (req, res) => {
  const relationship = await requireTeachingRelationship({
    tutorId: req.user.id,
    studentId: Number(req.body.student_id),
  });
  const assignment = await Assignment.create({
    title: req.body.title,
    description: req.body.description,
    deadline: req.body.deadline,
    student_id: relationship.student_id,
    tutor_id: req.user.id,
    status: "pending",
  });
  await notify(assignment.student_id, "New assignment", `${assignment.title} is due on ${new Date(assignment.deadline).toLocaleDateString()}.`, "assignment_created");
  sendSuccess(res, assignment, "Assignment created", 201);
});

export const submitAssignment = asyncHandler(async (req, res) => {
  const assignment = await Assignment.findById(req.params.id);
  if (!assignment || assignment.student_id !== req.user.id) throw new ApiError(404, "assignment_not_found", "Assignment was not found");
  if (assignment.status === "graded") throw new ApiError(409, "assignment_graded", "A graded assignment cannot be resubmitted");
  const updated = await Assignment.update(assignment.id, {
    submission_text: req.body.submission_text,
    submission_file_url: req.body.submission_file_url,
    status: "submitted",
    submitted_at: new Date(),
  });
  await notify(assignment.tutor_id, "Assignment submitted", `${req.user.full_name} submitted ${assignment.title}.`, "assignment_submitted");
  sendSuccess(res, updated, "Assignment submitted");
});

export const gradeAssignment = asyncHandler(async (req, res) => {
  const assignment = await Assignment.findById(req.params.id);
  if (!assignment || (req.user.role !== "admin" && assignment.tutor_id !== req.user.id)) throw new ApiError(404, "assignment_not_found", "Assignment was not found");
  if (assignment.status !== "submitted") throw new ApiError(409, "assignment_not_submitted", "Only submitted assignments can be graded");
  const updated = await Assignment.update(assignment.id, {
    marks: req.body.marks,
    feedback: req.body.feedback,
    status: "graded",
    graded_at: new Date(),
  });
  await notify(assignment.student_id, "Assignment graded", `${assignment.title} has been graded.`, "assignment_graded");
  sendSuccess(res, updated, "Assignment graded");
});

export const deleteAssignment = asyncHandler(async (req, res) => {
  const assignment = await Assignment.findById(req.params.id);
  if (!assignment || (req.user.role !== "admin" && assignment.tutor_id !== req.user.id)) throw new ApiError(404, "assignment_not_found", "Assignment was not found");
  await Assignment.remove(assignment.id);
  res.status(204).send();
});
