import { Router } from "express";
import { getProfile, getProgress, listSavedTutors, removeSavedTutor, saveTutor, updateProfile } from "../controllers/studentController.js";
import { protect } from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";
import { validate } from "../middleware/validate.js";
import { studentProfileRules } from "../utils/validators.js";

const router = Router();
router.use(protect, allowRoles("student"));
router.route("/profile").get(getProfile).put(studentProfileRules, validate, updateProfile);
router.get("/progress", getProgress);
router.get("/saved-tutors", listSavedTutors);
router.post("/saved-tutors/:tutorId", saveTutor);
router.delete("/saved-tutors/:tutorId", removeSavedTutor);
export default router;

