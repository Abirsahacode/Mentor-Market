import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import StudentProfile from "../models/StudentProfile.js";
import TutorProfile from "../models/TutorProfile.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/respond.js";

const createToken = (user) => jwt.sign(
  { sub: user.id, role: user.role },
  process.env.JWT_SECRET,
  { expiresIn: process.env.JWT_EXPIRES_IN || "7d" },
);

export const register = asyncHandler(async (req, res) => {
  const existing = await User.findByEmail(req.body.email);
  if (existing) throw new ApiError(409, "email_in_use", "An account already exists with this email");

  const password_hash = await bcrypt.hash(req.body.password, 12);
  const user = await User.create({ ...req.body, password_hash });
  if (user.role === "student") await StudentProfile.upsert(user.id, {});
  if (user.role === "tutor") await TutorProfile.upsert(user.id, {});

  sendSuccess(res, { user, token: createToken(user) }, "Account created", 201);
});

export const login = asyncHandler(async (req, res) => {
  const account = await User.findByEmail(req.body.email);
  const isValid = account && await bcrypt.compare(req.body.password, account.password_hash);
  if (!isValid) throw new ApiError(401, "invalid_credentials", "Email or password is incorrect");
  if (!account.is_active) throw new ApiError(403, "account_suspended", "This account is suspended");

  await User.touchLogin(account.id);
  const user = await User.findPublicById(account.id);
  sendSuccess(res, { user, token: createToken(user) }, "Logged in");
});

export const me = asyncHandler(async (req, res) => {
  sendSuccess(res, req.user, "Current user loaded");
});

export const logout = asyncHandler(async (_req, res) => {
  // JWT logout is client-side: the frontend discards its token.
  sendSuccess(res, null, "Logged out");
});

