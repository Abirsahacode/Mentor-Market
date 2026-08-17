import { Router } from "express";
import { createMaterial, deleteMaterial, listMaterials } from "../controllers/studyMaterialController.js";
import { protect } from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";
import { validate } from "../middleware/validate.js";
import { requiredFields } from "../utils/validators.js";

const router = Router();
router.use(protect);
router.get("/", listMaterials);
router.post("/", allowRoles("tutor"), requiredFields("title", "file_url", "subject"), validate, createMaterial);
router.delete("/:id", allowRoles("tutor", "admin"), deleteMaterial);
export default router;

