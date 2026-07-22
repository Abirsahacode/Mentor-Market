import Notification from "../models/Notification.js";

export const notify = (userId, title, message, type) =>
  Notification.create({ user_id: userId, title, message, type });

