import { Router } from "express";
import {
  listRecentCourses,
  listSavedCourses,
  recordCourseView,
  removeSavedCourse,
  saveCourse,
} from "../controllers/courseEngagementController.js";
import { protect } from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";

const router = Router();

router.use(protect, allowRoles("student"));
router.get("/saved", listSavedCourses);
router.put("/saved/:courseId", saveCourse);
router.delete("/saved/:courseId", removeSavedCourse);
router.get("/recent", listRecentCourses);
router.post("/views", recordCourseView);

export default router;
