import { Router } from "express";
import { createBooking, listBookings, updateBooking } from "../controllers/bookingController.js";
import { protect } from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";
import { validate } from "../middleware/validate.js";
import { requiredFields } from "../utils/validators.js";

const router = Router();
router.use(protect);
router.get("/", listBookings);
router.post("/", allowRoles("student"), requiredFields("tutor_id", "class_type", "class_date", "class_time", "mode"), validate, createBooking);
router.patch("/:id", allowRoles("student", "tutor", "admin"), updateBooking);
export default router;

