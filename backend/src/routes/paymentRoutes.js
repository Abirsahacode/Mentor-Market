import { Router } from "express";
import { createPayment, listPayments, markPaid } from "../controllers/paymentController.js";
import { protect } from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";
import { validate } from "../middleware/validate.js";
import { requiredFields } from "../utils/validators.js";

const router = Router();
export const paymentCreationRules = requiredFields("booking_id", "payment_method");

router.use(protect);
router.get("/", listPayments);
router.post("/", allowRoles("student"), paymentCreationRules, validate, createPayment);
router.patch("/:id/pay", allowRoles("student", "admin"), markPaid);
export default router;
