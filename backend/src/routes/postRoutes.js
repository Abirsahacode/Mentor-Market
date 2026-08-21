import { Router } from "express";
import { createModule, createPost, deleteModule, deletePost, getPost, listPosts, updateModule, updatePost } from "../controllers/postController.js";
import { optionalAuth, protect } from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";
import { validate } from "../middleware/validate.js";
import { requiredFields, tutorPostRules } from "../utils/validators.js";

const router = Router();
router.get("/", optionalAuth, listPosts);
router.get("/:id", getPost);
router.post("/", protect, allowRoles("tutor"), requiredFields("title", "subject", "level", "price", "teaching_mode", "availability", "description"), ...tutorPostRules, validate, createPost);
router.patch("/:id", protect, allowRoles("tutor", "admin"), updatePost);
router.delete("/:id", protect, allowRoles("tutor", "admin"), deletePost);
router.post("/:id/modules", protect, allowRoles("tutor", "admin"), requiredFields("title"), validate, createModule);
router.patch("/:id/modules/:moduleId", protect, allowRoles("tutor", "admin"), updateModule);
router.delete("/:id/modules/:moduleId", protect, allowRoles("tutor", "admin"), deleteModule);
export default router;

