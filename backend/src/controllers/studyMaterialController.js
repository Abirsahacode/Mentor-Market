import StudyMaterial from "../models/StudyMaterial.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { notify } from "../utils/notifications.js";
import { sendSuccess } from "../utils/respond.js";

export const listMaterials = asyncHandler(async (req, res) => {
  const filters = req.user.role === "student"
    ? { student_id: req.user.id }
    : req.user.role === "tutor" ? { tutor_id: req.user.id } : {};
  const { rows } = await StudyMaterial.findAll({ filters, q: req.query.q, limit: 100 });
  sendSuccess(res, rows, "Study materials loaded");
});

export const createMaterial = asyncHandler(async (req, res) => {
  const material = await StudyMaterial.create({ ...req.body, tutor_id: req.user.id });
  if (material.student_id) await notify(material.student_id, "New study material", `${material.title} was shared with you.`, "study_material");
  sendSuccess(res, material, "Study material added", 201);
});

export const deleteMaterial = asyncHandler(async (req, res) => {
  const material = await StudyMaterial.findById(req.params.id);
  if (!material || (req.user.role !== "admin" && material.tutor_id !== req.user.id)) throw new ApiError(404, "material_not_found", "Study material was not found");
  await StudyMaterial.remove(material.id);
  res.status(204).send();
});

