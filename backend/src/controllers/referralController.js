import Referral from "../models/Referral.js";
import User from "../models/User.js";
import asyncHandler from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/respond.js";

export const getReferralStats = asyncHandler(async (req, res) => {
  const origin = req.headers.origin || `${req.protocol}://${req.get("host")}`;
  const stats = await Referral.getStats(req.user, origin);
  sendSuccess(res, stats, "Referral statistics loaded");
});

export const validateCode = asyncHandler(async (req, res) => {
  const { code } = req.params;
  if (!code || typeof code !== "string" || code.trim().length < 3) {
    return sendSuccess(res, { valid: false, message: "Code must be at least 3 characters" });
  }

  try {
    const referrer = await User.findByReferralCode(code.trim());
    if (!referrer) {
      return sendSuccess(res, { valid: false, message: "Referral code not found" });
    }

    if (!referrer.is_active) {
      return sendSuccess(res, { valid: false, message: "This referral code is no longer active" });
    }

    const firstName = referrer.full_name.split(" ")[0];
    const lastInitial = referrer.full_name.split(" ").slice(1).pop()?.[0] || "";
    const referrerName = lastInitial ? `${firstName} ${lastInitial}.` : firstName;

    return sendSuccess(res, {
      valid: true,
      referrer_name: referrerName,
      message: `Valid referral code from ${referrerName}`,
    });
  } catch (error) {
    return sendSuccess(res, {
      valid: false,
      message: "Referral code validation unavailable at this time",
    });
  }
});
