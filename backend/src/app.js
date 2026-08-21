import "dotenv/config";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import adminRoutes from "./routes/adminRoutes.js";
import applicationRoutes from "./routes/applicationRoutes.js";
import assignmentRoutes from "./routes/assignmentRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import courseEngagementRoutes from "./routes/courseEngagementRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import postRoutes from "./routes/postRoutes.js";
import quizRoutes from "./routes/quizRoutes.js";
import referralRoutes from "./routes/referralRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import requestRoutes from "./routes/requestRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import studentRoutes from "./routes/studentRoutes.js";
import studyMaterialRoutes from "./routes/studyMaterialRoutes.js";
import tutorRoutes from "./routes/tutorRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import verificationRoutes from "./routes/verificationRoutes.js";
import { errorHandler, notFound, requestId } from "./middleware/errorMiddleware.js";

const app = express();
const configuredOrigins = (process.env.FRONTEND_URL || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsOrigin = (origin, callback) => {
  // API clients such as Postman have no Origin header. During local development,
  // Vite may use a nearby port, so any loopback origin is safe to accept.
  const isLocalDevelopmentOrigin = process.env.NODE_ENV !== "production"
    && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin || "");
  const isAllowed = !origin || configuredOrigins.includes(origin) || isLocalDevelopmentOrigin;
  callback(null, isAllowed);
};

app.disable("x-powered-by");
app.use(requestId);
app.use(helmet());
app.use(cors({ origin: corsOrigin }));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV !== "test") app.use(morgan("dev"));

app.get("/api/health", (_req, res) => res.json({ success: true, message: "Mentor Market API is running", data: { version: "1.0.0" } }));
app.use("/api/auth", authRoutes);
app.use("/api/referrals", referralRoutes);
app.use("/api/users", userRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/tutors", tutorRoutes);
app.use("/api/tutor-posts", postRoutes);
app.use("/api/student-requests", requestRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/course-engagement", courseEngagementRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use("/api/quizzes", quizRoutes);
app.use("/api/study-materials", studyMaterialRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/verifications", verificationRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/admin", adminRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
