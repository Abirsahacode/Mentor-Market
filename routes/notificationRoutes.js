import { Router } from "express";
import { listNotifications, markAllRead, markRead } from "../controllers/notificationController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = Router();
router.use(protect);
router.get("/", listNotifications);
router.patch("/read-all", markAllRead);
router.patch("/:id/read", markRead);
export default router;

