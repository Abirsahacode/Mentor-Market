import { Router } from "express";
import { getConversation, listConversations, reportMessage, sendMessage } from "../controllers/messageController.js";
import { protect } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validate.js";
import { requiredFields } from "../utils/validators.js";

const router = Router();
router.use(protect);
router.get("/conversations", listConversations);
router.get("/conversation/:userId", getConversation);
router.post("/", requiredFields("receiver_id", "content"), validate, sendMessage);
router.patch("/:id/report", reportMessage);
export default router;

