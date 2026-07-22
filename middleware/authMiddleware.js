import jwt from "jsonwebtoken";
import User from "../models/User.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";

const readToken = (req) => {
  const header = req.get("Authorization");
  return header?.startsWith("Bearer ") ? header.slice(7) : null;
};

export const protect = asyncHandler(async (req, _res, next) => {
  const token = readToken(req);
  if (!token) throw new ApiError(401, "authentication_required", "Please log in to continue");

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findPublicById(payload.sub);
    if (!user || !user.is_active) throw new Error("Inactive account");
    req.user = user;
    next();
  } catch {
    throw new ApiError(401, "invalid_token", "Your session is invalid or has expired");
  }
});

export const optionalAuth = asyncHandler(async (req, _res, next) => {
  const token = readToken(req);
  if (token) {
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findPublicById(payload.sub);
    } catch {
      req.user = null;
    }
  }
  next();
});

