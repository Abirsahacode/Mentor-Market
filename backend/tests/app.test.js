import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import app from "../src/app.js";

test("GET /api/health returns service metadata", async () => {
  const response = await request(app).get("/api/health").expect(200);
  assert.equal(response.body.success, true);
  assert.equal(response.body.data.version, "1.0.0");
  assert.ok(response.headers["x-request-id"]);
});

test("unknown API route uses the shared error envelope", async () => {
  const response = await request(app).get("/api/not-real").expect(404);
  assert.equal(response.body.error.code, "route_not_found");
  assert.ok(response.body.error.request_id);
});

test("development CORS accepts a Vite localhost fallback port", async () => {
  const response = await request(app)
    .options("/api/auth/login")
    .set("Origin", "http://localhost:5174")
    .set("Access-Control-Request-Method", "POST")
    .expect(204);
  assert.equal(response.headers["access-control-allow-origin"], "http://localhost:5174");
});

test("development CORS does not allow unrelated web origins", async () => {
  const response = await request(app)
    .options("/api/auth/login")
    .set("Origin", "https://untrusted.example")
    .set("Access-Control-Request-Method", "POST")
    .expect(200);
  assert.equal(response.headers["access-control-allow-origin"], undefined);
});

test("course engagement routes require authentication", async () => {
  const response = await request(app).get("/api/course-engagement/saved").expect(401);
  assert.equal(response.body.error.code, "authentication_required");
});

test("booking availability is public while validating the tutor input", async () => {
  const response = await request(app).get("/api/bookings/availability").expect(422);
  assert.equal(response.body.error.code, "invalid_tutor");
});

test("non-availability booking routes remain protected", async () => {
  const response = await request(app).get("/api/bookings").expect(401);
  assert.equal(response.body.error.code, "authentication_required");
});

test("booking availability rejects invalid and oversized date ranges before querying the database", async () => {
  const invalid = await request(app)
    .get("/api/bookings/availability?tutor_id=1&from_date=2099-02-30")
    .expect(422);
  assert.equal(invalid.body.error.code, "invalid_date_range");

  const reversed = await request(app)
    .get("/api/bookings/availability?tutor_id=1&from_date=2099-02-02&to_date=2099-02-01")
    .expect(422);
  assert.equal(reversed.body.error.code, "invalid_date_range");

  const oversized = await request(app)
    .get("/api/bookings/availability?tutor_id=1&from_date=2099-01-01&to_date=2099-02-01")
    .expect(422);
  assert.equal(oversized.body.error.code, "availability_range_too_large");
});
