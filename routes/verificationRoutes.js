import { Router } from "express";
import { decideVerification, getVerification, listVerifications, submitVerification } from "../controllers/verificationController.js";
import { protect } from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";

const router = Router();
router.use(protect);
router.get("/mine", allowRoles("tutor"), getVerification);
router.put("/mine", allowRoles("tutor"), submitVerification);
router.get("/", allowRoles("admin"), listVerifications);
router.patch("/:id/decision", allowRoles("admin"), decideVerification);
export default router;

