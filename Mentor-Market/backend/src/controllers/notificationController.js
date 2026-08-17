import db from "../config/db.js";
import Notification from "../models/Notification.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/respond.js";

export const listNotifications = asyncHandler(async (req, res) => {
  const filters = { user_id: req.user.id };
  if (req.query.unread === "true") filters.is_read = false;
  const { rows } = await Notification.findAll({ filters, limit: 100 });
  sendSuccess(res, rows, "Notifications loaded");
});

export const markRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findById(req.params.id);
  if (!notification || notification.user_id !== req.user.id) throw new ApiError(404, "notification_not_found", "Notification was not found");
  sendSuccess(res, await Notification.update(notification.id, { is_read: true }), "Notification marked read");
});

export const markAllRead = asyncHandler(async (req, res) => {
  const [result] = await db.query(
    "UPDATE notifications SET is_read = TRUE WHERE user_id = ? AND is_read = FALSE",
    [req.user.id],
  );
  sendSuccess(res, { updated: result.affectedRows }, "All notifications marked read");
});
