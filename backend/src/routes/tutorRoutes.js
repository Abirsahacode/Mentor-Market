import { Router } from "express";
import { getEarnings, getProfile, getTutor, requestWithdrawal, searchTutors, updateProfile } from "../controllers/tutorController.js";
import { protect } from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";

const router = Router();
router.get("/", searchTutors);
router.get("/profile", protect, allowRoles("tutor"), getProfile);
router.put("/profile", protect, allowRoles("tutor"), updateProfile);
router.get("/earnings", protect, allowRoles("tutor"), getEarnings);
router.post("/withdrawals", protect, allowRoles("tutor"), requestWithdrawal);
router.get("/:id", getTutor);
export default router;

