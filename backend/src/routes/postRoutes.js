import { Router } from "express";
import { createPost, deletePost, getPost, listPosts, updatePost } from "../controllers/postController.js";
import { optionalAuth, protect } from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";
import { validate } from "../middleware/validate.js";
import { requiredFields } from "../utils/validators.js";

const router = Router();
router.get("/", optionalAuth, listPosts);
router.get("/:id", getPost);
router.post("/", protect, allowRoles("tutor"), requiredFields("title", "subject", "level", "price", "teaching_mode", "availability", "description"), validate, createPost);
router.patch("/:id", protect, allowRoles("tutor", "admin"), updatePost);
router.delete("/:id", protect, allowRoles("tutor", "admin"), deletePost);
export default router;

