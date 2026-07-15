import { Router } from "express";
import { createRequest, deleteRequest, getRequest, listRequests, updateRequest } from "../controllers/requestController.js";
import { protect } from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";
import { validate } from "../middleware/validate.js";
import { requiredFields } from "../utils/validators.js";

const router = Router();
router.get("/", listRequests);
router.get("/:id", getRequest);
router.post("/", protect, allowRoles("student"), requiredFields("subject", "class_level", "budget", "teaching_mode", "preferred_time", "description"), validate, createRequest);
router.patch("/:id", protect, allowRoles("student", "admin"), updateRequest);
router.delete("/:id", protect, allowRoles("student", "admin"), deleteRequest);
export default router;

