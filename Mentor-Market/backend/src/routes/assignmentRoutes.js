import { Router } from "express";
import { createAssignment, deleteAssignment, gradeAssignment, listAssignments, submitAssignment } from "../controllers/assignmentController.js";
import { protect } from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";
import { validate } from "../middleware/validate.js";
import { requiredFields } from "../utils/validators.js";

const router = Router();
router.use(protect);
router.get("/", listAssignments);
router.post("/", allowRoles("tutor"), requiredFields("title", "description", "deadline", "student_id"), validate, createAssignment);
router.patch("/:id/submit", allowRoles("student"), submitAssignment);
router.patch("/:id/grade", allowRoles("tutor", "admin"), requiredFields("marks"), validate, gradeAssignment);
router.delete("/:id", allowRoles("tutor", "admin"), deleteAssignment);
export default router;

