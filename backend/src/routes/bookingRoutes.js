import { Router } from "express";
import { createBooking, listAvailability, listBookings, updateBooking } from "../controllers/bookingController.js";
import { cancelWaitlistEntry, getMentorWaitlist, getStudentWaitlist, joinWaitlist } from "../controllers/waitlistController.js";
import { protect } from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";
import { validate } from "../middleware/validate.js";
import { requiredFields } from "../utils/validators.js";

const router = Router();
router.get("/availability", listAvailability);
router.use(protect);
router.get("/", listBookings);
router.post("/", allowRoles("student"), requiredFields("tutor_id", "class_type", "class_date", "class_time", "mode"), validate, createBooking);
router.patch("/:id", allowRoles("student", "tutor", "admin"), updateBooking);
router.post("/waitlist", allowRoles("student"), requiredFields("tutor_id", "class_date", "class_time"), validate, joinWaitlist);
router.get("/waitlist/mentor", allowRoles("tutor"), getMentorWaitlist);
router.get("/waitlist/student", allowRoles("student"), getStudentWaitlist);
router.delete("/waitlist/:id", cancelWaitlistEntry);
export default router;
