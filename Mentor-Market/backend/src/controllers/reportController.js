import Report from "../models/Report.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/respond.js";

export const listReports = asyncHandler(async (req, res) => {
  const filters = req.user.role === "admin" ? {} : { reporter_id: req.user.id };
  if (req.query.status) filters.status = req.query.status;
  const { rows } = await Report.findAll({ filters, limit: 100 });
  sendSuccess(res, rows, "Reports loaded");
});

export const createReport = asyncHandler(async (req, res) => {
  const report = await Report.create({
    reporter_id: req.user.id,
    reported_user_id: req.body.reported_user_id,
    tutor_post_id: req.body.tutor_post_id,
    student_request_id: req.body.student_request_id,
    category: req.body.category,
    description: req.body.description,
    status: "open",
  });
  sendSuccess(res, report, "Report submitted", 201);
});

export const resolveReport = asyncHandler(async (req, res) => {
  const report = await Report.findById(req.params.id);
  if (!report) throw new ApiError(404, "report_not_found", "Report was not found");
  const updated = await Report.update(report.id, {
    status: req.body.status,
    admin_notes: req.body.admin_notes,
    resolved_by: req.user.id,
    resolved_at: ["resolved", "dismissed"].includes(req.body.status) ? new Date() : null,
  });
  sendSuccess(res, updated, "Report updated");
});
