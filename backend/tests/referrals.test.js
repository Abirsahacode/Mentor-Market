import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import app from "../src/app.js";
import Referral, { REFERRAL_MILESTONES } from "../src/models/Referral.js";

test("GET /api/referrals/validate/:code returns envelope response for code validation", async () => {
  const response = await request(app)
    .get("/api/referrals/validate/REF-AYESHA7X")
    .expect(200);

  assert.equal(response.body.success, true);
  assert.equal(typeof response.body.data.valid, "boolean");
  assert.ok(response.body.data.message);
});

test("GET /api/referrals/validate/:code returns invalid for non-existent code", async () => {
  const response = await request(app)
    .get("/api/referrals/validate/REF-INVALID999")
    .expect(200);

  assert.equal(response.body.success, true);
  assert.equal(response.body.data.valid, false);
});

test("GET /api/referrals/stats requires student authentication", async () => {
  const response = await request(app)
    .get("/api/referrals/stats")
    .expect(401);

  assert.equal(response.body.error.code, "authentication_required");
});

test("Referral.generateUniqueCode generates a valid REF- code", async () => {
  const code = await Referral.generateUniqueCode("Test User");
  assert.ok(code.startsWith("REF-TESTUS"));
  assert.ok(code.length >= 8);
});

test("REFERRAL_MILESTONES has 4 defined tiers", () => {
  assert.equal(REFERRAL_MILESTONES.length, 4);
  assert.equal(REFERRAL_MILESTONES[0].count, 1);
  assert.equal(REFERRAL_MILESTONES[1].count, 3);
  assert.equal(REFERRAL_MILESTONES[2].count, 5);
  assert.equal(REFERRAL_MILESTONES[3].count, 10);
});
