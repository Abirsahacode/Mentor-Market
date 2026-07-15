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
