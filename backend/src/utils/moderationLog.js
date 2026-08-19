import db from "../config/db.js";

export const logModeration = (adminId, action, targetType, targetId, reason) => db.query(
  "INSERT INTO moderation_logs (admin_id, action, target_type, target_id, reason) VALUES (?, ?, ?, ?, ?)",
  [adminId, action, targetType, targetId, reason || null],
);
