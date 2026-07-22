import { Router } from "express";
import {
  getEarnings, getProfile, getTutor, listSubjects, requestWithdrawal, searchTutors, updateProfile,
} from "../controllers/tutorController.js";
import { protect } from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";
import { validate } from "../middleware/validate.js";
import { searchTutorRules } from "../utils/validators.js";

const router = Router();
router.get("/", searchTutorRules, validate, searchTutors);
router.get("/subjects", listSubjects);
router.get("/profile", protect, allowRoles("tutor"), getProfile);
router.put("/profile", protect, allowRoles("tutor"), updateProfile);
router.get("/earnings", protect, allowRoles("tutor"), getEarnings);
router.post("/withdrawals", protect, allowRoles("tutor"), requestWithdrawal);
router.get("/:id", getTutor);
export default router;
