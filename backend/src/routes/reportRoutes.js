import { Router } from "express";
import { createReport, listReports, resolveReport } from "../controllers/reportController.js";
import { protect } from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";
import { validate } from "../middleware/validate.js";
import { requiredFields } from "../utils/validators.js";

const router = Router();
router.use(protect);
router.get("/", listReports);
router.post("/", requiredFields("category", "description"), validate, createReport);
router.patch("/:id", allowRoles("admin"), resolveReport);
export default router;

