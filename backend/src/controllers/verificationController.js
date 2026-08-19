import db from "../config/db.js";
import Verification from "../models/Verification.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { logModeration } from "../utils/moderationLog.js";
import { notify } from "../utils/notifications.js";
import { sendSuccess } from "../utils/respond.js";

export const getVerification = asyncHandler(async (req, res) => {
  const verification = await Verification.findOneBy("tutor_id", req.user.id);
  sendSuccess(res, verification, "Verification loaded");
});

export const submitVerification = asyncHandler(async (req, res) => {
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
  const connection = await db.getConnection();
  let verification;
  let existing;
  try {
    await connection.beginTransaction();
    [[existing]] = await connection.query(
      "SELECT * FROM verifications WHERE tutor_id = ? FOR UPDATE",
      [req.user.id],
    );
    verification = existing
      ? await Verification.update(existing.id, payload, connection)
      : await Verification.create(payload, connection);
    // Resubmitted evidence requires a fresh admin decision; never leave a
    // stale verified badge visible while the new evidence is pending.
    await connection.query(
      "UPDATE tutor_profiles SET is_verified = FALSE WHERE user_id = ?",
      [req.user.id],
    );
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
  sendSuccess(res, verification, "Verification submitted", existing ? 200 : 201);
});

export const listVerifications = asyncHandler(async (req, res) => {
  const values = [];
  const where = req.query.status ? "WHERE v.status = ?" : "";
  if (req.query.status) values.push(req.query.status);
  const [rows] = await db.query(
    `SELECT v.*, u.full_name AS tutor_name, u.email AS tutor_email, u.avatar_url AS tutor_avatar_url
     FROM verifications v JOIN users u ON u.id = v.tutor_id
     ${where} ORDER BY v.submitted_at DESC, v.created_at DESC LIMIT 100`,
    values,
  );
  sendSuccess(res, rows, "Verifications loaded");
});

export const decideVerification = asyncHandler(async (req, res) => {
  if (!["verified", "rejected"].includes(req.body.status)) throw new ApiError(422, "invalid_status", "Status must be verified or rejected");
  const connection = await db.getConnection();
  let verification;
  let updated;
  try {
    await connection.beginTransaction();
    [[verification]] = await connection.query(
      "SELECT * FROM verifications WHERE id = ? FOR UPDATE",
      [req.params.id],
    );
    if (!verification) throw new ApiError(404, "verification_not_found", "Verification was not found");
    updated = await Verification.update(verification.id, {
      status: req.body.status,
      admin_feedback: req.body.admin_feedback,
      reviewed_by: req.user.id,
      reviewed_at: new Date(),
    }, connection);
    await connection.query(
      "UPDATE tutor_profiles SET is_verified = ? WHERE user_id = ?",
      [req.body.status === "verified", verification.tutor_id],
    );
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
  await notify(verification.tutor_id, `Verification ${req.body.status}`, req.body.admin_feedback || `Your mentor verification was ${req.body.status}.`, `verification_${req.body.status}`);
  await logModeration(req.user.id, `verification_${req.body.status}`, "verification", verification.id, req.body.admin_feedback);
  sendSuccess(res, updated, `Tutor verification ${req.body.status}`);
});
