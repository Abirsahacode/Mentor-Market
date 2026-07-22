import db from "../config/db.js";
import Verification from "../models/Verification.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { notify } from "../utils/notifications.js";
import { sendSuccess } from "../utils/respond.js";

export const getVerification = asyncHandler(async (req, res) => {
  const verification = await Verification.findOneBy("tutor_id", req.user.id);
  sendSuccess(res, verification, "Verification loaded");
});

export const submitVerification = asyncHandler(async (req, res) => {
  const existing = await Verification.findOneBy("tutor_id", req.user.id);
  const payload = {
    tutor_id: req.user.id,
    certificate_name: req.body.certificate_name,
    institution: req.body.institution,
    experience_proof: req.body.experience_proof,
    demo_video_url: req.body.demo_video_url,
    status: "pending",
    admin_feedback: null,
    reviewed_by: null,
    reviewed_at: null,
    submitted_at: new Date(),
  };
  const verification = existing
    ? await Verification.update(existing.id, payload)
    : await Verification.create(payload);
  sendSuccess(res, verification, "Verification submitted", existing ? 200 : 201);
});

export const listVerifications = asyncHandler(async (req, res) => {
  const filters = req.query.status ? { status: req.query.status } : {};
  const { rows } = await Verification.findAll({ filters, limit: 100 });
  sendSuccess(res, rows, "Verifications loaded");
});

export const decideVerification = asyncHandler(async (req, res) => {
  if (!["verified", "rejected"].includes(req.body.status)) throw new ApiError(422, "invalid_status", "Status must be verified or rejected");
  const verification = await Verification.findById(req.params.id);
  if (!verification) throw new ApiError(404, "verification_not_found", "Verification was not found");
  const updated = await Verification.update(verification.id, {
    status: req.body.status,
    admin_feedback: req.body.admin_feedback,
    reviewed_by: req.user.id,
    reviewed_at: new Date(),
  });
  await db.query("UPDATE tutor_profiles SET is_verified = ? WHERE user_id = ?", [req.body.status === "verified", verification.tutor_id]);
  await notify(verification.tutor_id, `Verification ${req.body.status}`, req.body.admin_feedback || `Your mentor verification was ${req.body.status}.`, `verification_${req.body.status}`);
  sendSuccess(res, updated, `Tutor verification ${req.body.status}`);
});
