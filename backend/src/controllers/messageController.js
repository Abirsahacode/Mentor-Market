import db from "../config/db.js";
import Message from "../models/Message.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { notify } from "../utils/notifications.js";
import { sendSuccess } from "../utils/respond.js";

export const listConversations = asyncHandler(async (req, res) => {
  const [rows] = await db.query(
    `SELECT u.id AS user_id, u.full_name, u.avatar_url, MAX(m.created_at) AS last_message_at,
      SUBSTRING_INDEX(GROUP_CONCAT(m.content ORDER BY m.created_at DESC SEPARATOR '|||'), '|||', 1) AS last_message,
      SUM(m.receiver_id = ? AND m.is_read = FALSE) AS unread_count
     FROM messages m JOIN users u ON u.id = IF(m.sender_id = ?, m.receiver_id, m.sender_id)
     WHERE m.sender_id = ? OR m.receiver_id = ? GROUP BY u.id, u.full_name, u.avatar_url ORDER BY last_message_at DESC`,
    [req.user.id, req.user.id, req.user.id, req.user.id],
  );
  sendSuccess(res, rows, "Conversations loaded");
});

export const getConversation = asyncHandler(async (req, res) => {
  const otherId = Number(req.params.userId);
  const [rows] = await db.query(
    `SELECT m.*, s.full_name AS sender_name FROM messages m JOIN users s ON s.id = m.sender_id
     WHERE (m.sender_id = ? AND m.receiver_id = ?) OR (m.sender_id = ? AND m.receiver_id = ?)
     ORDER BY m.created_at ASC LIMIT 200`,
    [req.user.id, otherId, otherId, req.user.id],
  );
  await db.query("UPDATE messages SET is_read = TRUE WHERE sender_id = ? AND receiver_id = ?", [otherId, req.user.id]);
  sendSuccess(res, rows, "Conversation loaded");
});

export const sendMessage = asyncHandler(async (req, res) => {
  if (Number(req.body.receiver_id) === req.user.id) throw new ApiError(422, "invalid_receiver", "You cannot message yourself");
  const [[receiver]] = await db.query("SELECT id FROM users WHERE id = ? AND is_active = TRUE", [req.body.receiver_id]);
  if (!receiver) throw new ApiError(404, "receiver_not_found", "Message recipient was not found");
  const message = await Message.create({
    receiver_id: req.body.receiver_id,
    booking_id: req.body.booking_id,
    content: req.body.content,
    sender_id: req.user.id,
    is_read: false,
    is_reported: false,
  });
  await notify(message.receiver_id, "New message", `${req.user.full_name} sent you a message.`, "new_message");
  sendSuccess(res, message, "Message sent", 201);
});

export const reportMessage = asyncHandler(async (req, res) => {
  const message = await Message.findById(req.params.id);
  if (!message || message.receiver_id !== req.user.id) throw new ApiError(404, "message_not_found", "Message was not found");
  sendSuccess(res, await Message.update(message.id, { is_reported: true }), "Message reported");
});
