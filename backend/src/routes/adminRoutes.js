import { Router } from "express";
import { dashboard, listModerationLogs, listResource, listUsers, updateUserStatus, updateWithdrawal } from "../controllers/adminController.js";
import { protect } from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";

const router = Router();
router.use(protect, allowRoles("admin"));
router.get("/dashboard", dashboard);
router.get("/users", listUsers);
router.patch("/users/:id/status", updateUserStatus);
router.patch("/withdrawals/:id", updateWithdrawal);
router.get("/moderation-logs", listModerationLogs);
router.get("/:resource", listResource);
export default router;

