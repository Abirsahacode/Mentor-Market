import test from "node:test";
import assert from "node:assert/strict";
import { canTransitionBooking } from "../src/controllers/bookingController.js";

test("students can reschedule or cancel active bookings but cannot confirm or complete them", () => {
  assert.equal(canTransitionBooking({ role: "student", currentStatus: "pending", nextStatus: "rescheduled" }), true);
  assert.equal(canTransitionBooking({ role: "student", currentStatus: "confirmed", nextStatus: "cancelled" }), true);
  assert.equal(canTransitionBooking({ role: "student", currentStatus: "pending", nextStatus: "confirmed" }), false);
  assert.equal(canTransitionBooking({ role: "student", currentStatus: "confirmed", nextStatus: "completed" }), false);
});

test("tutors follow the pending, confirmed, and completed lifecycle", () => {
  assert.equal(canTransitionBooking({ role: "tutor", currentStatus: "pending", nextStatus: "confirmed" }), true);
  assert.equal(canTransitionBooking({ role: "tutor", currentStatus: "pending", nextStatus: "completed" }), false);
  assert.equal(canTransitionBooking({ role: "tutor", currentStatus: "confirmed", nextStatus: "completed" }), true);
  assert.equal(canTransitionBooking({ role: "tutor", currentStatus: "completed", nextStatus: "cancelled" }), false);
});

test("administrators may cancel active bookings but cannot impersonate classroom progress", () => {
  assert.equal(canTransitionBooking({ role: "admin", currentStatus: "confirmed", nextStatus: "cancelled" }), true);
  assert.equal(canTransitionBooking({ role: "admin", currentStatus: "pending", nextStatus: "confirmed" }), false);
  assert.equal(canTransitionBooking({ role: "admin", currentStatus: "confirmed", nextStatus: "completed" }), false);
});
