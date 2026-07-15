import { Router } from "express";
import { getProfile, getProgress, listSavedTutors, removeSavedTutor, saveTutor, updateProfile } from "../controllers/studentController.js";
import { protect } from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";

const router = Router();
router.use(protect, allowRoles("student"));
router.route("/profile").get(getProfile).put(updateProfile);
router.get("/progress", getProgress);
router.get("/saved-tutors", listSavedTutors);
router.post("/saved-tutors/:tutorId", saveTutor);
router.delete("/saved-tutors/:tutorId", removeSavedTutor);
export default router;

