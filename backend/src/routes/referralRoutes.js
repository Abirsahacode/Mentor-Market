import { Router } from "express";
import { getReferralStats, validateCode } from "../controllers/referralController.js";
import { protect } from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";

const router = Router();

router.get("/validate/:code", validateCode);
router.get("/stats", protect, allowRoles("student"), getReferralStats);

export default router;
