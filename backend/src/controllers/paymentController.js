import Booking from "../models/Booking.js";
import Payment from "../models/Payment.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { notify } from "../utils/notifications.js";
import { sendSuccess } from "../utils/respond.js";

export const listPayments = asyncHandler(async (req, res) => {
  const field = req.user.role === "student" ? "student_id" : "tutor_id";
  const filters = req.user.role === "admin" ? {} : { [field]: req.user.id };
  const { rows } = await Payment.findAll({ filters, limit: 100 });
  sendSuccess(res, rows, "Payments loaded");
});

export const createPayment = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.body.booking_id);
  if (!booking || booking.student_id !== req.user.id) throw new ApiError(404, "booking_not_found", "Your booking was not found");
  const amount = Number(req.body.amount);
  if (!amount || amount <= 0) throw new ApiError(422, "invalid_amount", "Payment amount must be greater than zero");
  const rate = Number(process.env.PLATFORM_COMMISSION_RATE || 0.1);
  const commission = Number((amount * rate).toFixed(2));
  const payment = await Payment.create({
    student_id: req.user.id,
    tutor_id: booking.tutor_id,
    booking_id: booking.id,
    amount,
    commission,
    tutor_earning: Number((amount - commission).toFixed(2)),
    payment_method: req.body.payment_method,
  });
  sendSuccess(res, payment, "Mock payment created", 201);
});

export const markPaid = asyncHandler(async (req, res) => {
  const payment = await Payment.findById(req.params.id);
  if (!payment || (req.user.role !== "admin" && payment.student_id !== req.user.id)) throw new ApiError(404, "payment_not_found", "Payment was not found");
  if (payment.status !== "pending") throw new ApiError(409, "payment_already_processed", "Payment is already processed");
  const updated = await Payment.update(payment.id, { status: "paid", paid_at: new Date() });
  await notify(payment.tutor_id, "Payment completed", `Payment of ৳${payment.amount} was marked paid.`, "payment_completed");
  sendSuccess(res, updated, "Payment marked as paid");
});
