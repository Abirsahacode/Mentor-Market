import { Router } from "express";
import { createReview, deleteReview, listFeatured, listReviews } from "../controllers/reviewController.js";
import { protect } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validate.js";
import { requiredFields } from "../utils/validators.js";

const router = Router();
router.get("/featured", listFeatured);
router.use(protect);
router.get("/", listReviews);
router.post("/", requiredFields("booking_id", "rating"), validate, createReview);
router.delete("/:id", deleteReview);
export default router;

