import test from "node:test";
import assert from "node:assert/strict";
import { validationResult } from "express-validator";
import { paymentCreationRules } from "../src/routes/paymentRoutes.js";

const validatePaymentBody = async (body) => {
  const req = { body };
  for (const rule of paymentCreationRules) {
    await rule.run(req);
  }
  return validationResult(req);
};

test("payment creation validation does not require a client-supplied amount", async () => {
  const result = await validatePaymentBody({ booking_id: 42, payment_method: "bKash" });
  assert.equal(result.isEmpty(), true);
});

test("payment creation still requires booking and payment method", async () => {
  const result = await validatePaymentBody({});
  assert.deepEqual(
    result.array().map(({ path }) => path).sort(),
    ["booking_id", "payment_method"],
  );
});
