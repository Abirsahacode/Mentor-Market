import { Router } from "express";
import rateLimit from "express-rate-limit";
import { submitContact, updateContact } from "../controllers/contactController.js";
import { protect } from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";
import { validate } from "../middleware/validate.js";
import { contactRules } from "../utils/validators.js";

const router = Router();
const contactLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: true, legacyHeaders: false });

router.post("/", contactLimiter, contactRules, validate, submitContact);
router.patch("/:id", protect, allowRoles("admin"), updateContact);
export default router;
