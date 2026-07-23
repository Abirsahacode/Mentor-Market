import { Router } from "express";
import { attemptQuiz, createQuiz, deleteQuiz, getQuiz, listAttempts, listQuizzes } from "../controllers/quizController.js";
import { protect } from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";
import { validate } from "../middleware/validate.js";
import { requiredFields } from "../utils/validators.js";

const router = Router();
router.use(protect);
router.get("/", listQuizzes);
router.get("/attempts", listAttempts);
router.get("/:id", getQuiz);
router.post("/", allowRoles("tutor"), requiredFields("title", "subject", "questions"), validate, createQuiz);
router.post("/:id/attempt", allowRoles("student"), attemptQuiz);
router.delete("/:id", allowRoles("tutor", "admin"), deleteQuiz);
export default router;

