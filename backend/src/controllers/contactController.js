import ContactMessage from "../models/ContactMessage.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/respond.js";

export const submitContact = asyncHandler(async (req, res) => {
  const message = await ContactMessage.create({
    name: req.body.name,
    email: req.body.email,
    subject: req.body.subject,
    message: req.body.message,
    status: "open",
  });
  sendSuccess(res, message, "Message sent", 201);
});

export const updateContact = asyncHandler(async (req, res) => {
  if (!["open", "resolved"].includes(req.body.status)) throw new ApiError(422, "invalid_status", "Status must be open or resolved");
  const message = await ContactMessage.findById(req.params.id);
  if (!message) throw new ApiError(404, "contact_message_not_found", "Contact message was not found");
  sendSuccess(res, await ContactMessage.update(message.id, { status: req.body.status }), "Contact message updated");
});
