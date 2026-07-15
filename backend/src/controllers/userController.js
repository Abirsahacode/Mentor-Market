import User from "../models/User.js";
import asyncHandler from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/respond.js";

export const updateMe = asyncHandler(async (req, res) => {
  const user = await User.update(req.user.id, req.body);
  sendSuccess(res, user, "Account updated");
});

