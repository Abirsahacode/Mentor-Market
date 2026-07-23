import { Router } from "express";
import { getEarnings, getProfile, getTutor, requestWithdrawal, searchTutors, updateProfile } from "../controllers/tutorController.js";
import { protect } from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";
import { validate } from "../middleware/validate.js";
import { tutorProfileRules } from "../utils/validators.js";

const router = Router();
router.get("/", searchTutors);
router.get("/profile", protect, allowRoles("tutor"), getProfile);
router.put("/profile", protect, allowRoles("tutor"), tutorProfileRules, validate, updateProfile);
router.get("/earnings", protect, allowRoles("tutor"), getEarnings);
router.post("/withdrawals", protect, allowRoles("tutor"), requestWithdrawal);
router.get("/:id", getTutor);
export default router;

