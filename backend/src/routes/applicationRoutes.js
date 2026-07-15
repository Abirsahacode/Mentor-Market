import { Router } from "express";
import { createApplication, deleteApplication, listApplications, updateApplicationStatus } from "../controllers/applicationController.js";
import { protect } from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";
import { validate } from "../middleware/validate.js";
import { requiredFields } from "../utils/validators.js";

const router = Router();
router.use(protect);
router.get("/", listApplications);
router.post("/", allowRoles("tutor"), requiredFields("student_request_id", "proposal_message", "expected_fee", "available_time"), validate, createApplication);
router.patch("/:id/status", allowRoles("student", "admin"), updateApplicationStatus);
router.delete("/:id", allowRoles("tutor", "admin"), deleteApplication);
export default router;

