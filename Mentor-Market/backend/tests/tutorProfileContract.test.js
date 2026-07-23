import test from "node:test";
import assert from "node:assert/strict";
import { validationResult } from "express-validator";
import db from "../src/config/db.js";
import TutorProfile, { calculateTutorProfileCompletion, toPublicTutorProfile } from "../src/models/TutorProfile.js";
import { buildTutorSearchQuery, parseListFilter } from "../src/models/tutorSearchQueryBuilder.js";
import tutorRoutes from "../src/routes/tutorRoutes.js";
import { parseDays } from "../src/utils/availability.js";
import { tutorProfileRules } from "../src/utils/validators.js";

const validateTutorProfile = async (body) => {
  const req = { body };
  for (const rule of tutorProfileRules) await rule.run(req);
  return { body: req.body, result: validationResult(req) };
};

test("list and day filters safely expand comma-delimited query values", () => {
  assert.deepEqual(
    parseListFilter([" Mathematics, Physics ", "mathematics", null]),
    ["Mathematics", "Physics"],
  );
  assert.deepEqual(parseDays(["wed,mon", "sun", "not-a-day"]), ["mon", "wed", "sun"]);

  const { where, values } = buildTutorSearchQuery({
    subjects: "Mathematics,Physics",
    days: "sat,mon",
  });
  assert.equal((where.match(/JSON_SEARCH/g) || []).length, 2);
  assert.equal((where.match(/FIND_IN_SET/g) || []).length, 2);
  assert.deepEqual(values, ["Mathematics", "Physics", "mon", "sat"]);
});

test("TutorProfile.search uses the shared query builder in production", async (t) => {
  const query = t.mock.method(db, "query", async (sql) => (
    sql.startsWith("SELECT COUNT") ? [[{ total: 2 }]] : [[{ user_id: 11 }]]
  ));

  const result = await TutorProfile.search({
    subject: "Mathematics,Physics",
    days: "sat,mon",
    minPrice: "500",
    maxPrice: "1000",
    sort: "newest",
    limit: 12,
    offset: 0,
  });

  assert.deepEqual(result, { rows: [{ user_id: 11 }], total: 2 });
  assert.equal(query.mock.callCount(), 2);

  const [searchSql, searchValues] = query.mock.calls[0].arguments;
  assert.equal((searchSql.match(/JSON_SEARCH/g) || []).length, 2);
  assert.equal((searchSql.match(/FIND_IN_SET/g) || []).length, 2);
  assert.match(searchSql, /tp\.hourly_rate >= \?/);
  assert.match(searchSql, /tp\.hourly_rate <= \?/);
  assert.match(searchSql, /ORDER BY tp\.created_at DESC/);
  assert.deepEqual(searchValues, ["Mathematics", "Physics", 500, 1000, "mon", "sat", 12, 0]);

  const [, countValues] = query.mock.calls[1].arguments;
  assert.deepEqual(countValues, ["Mathematics", "Physics", 500, 1000, "mon", "sat"]);
});

test("public tutor profiles omit private contact fields", async (t) => {
  const query = t.mock.method(db, "query", async () => [[{
    user_id: 7,
    full_name: "Public Tutor",
    avatar_url: "/avatar.png",
    bio: "Tutor bio",
    email: "private@example.com",
    phone: "01700000000",
  }]]);

  const profile = await TutorProfile.findPublicByUserId(7);
  assert.deepEqual(profile, {
    user_id: 7,
    bio: "Tutor bio",
    full_name: "Public Tutor",
    avatar_url: "/avatar.png",
  });

  const [sql, values] = query.mock.calls[0].arguments;
  assert.doesNotMatch(sql, /u\.email|u\.phone/);
  assert.match(sql, /u\.is_active = TRUE/);
  assert.deepEqual(values, [7]);

  const projected = toPublicTutorProfile({
    user_id: 8,
    full_name: "Another Tutor",
    email: "hidden@example.com",
    phone: "01800000000",
  });
  assert.equal(Object.hasOwn(projected, "email"), false);
  assert.equal(Object.hasOwn(projected, "phone"), false);
});

test("subject discovery returns a sorted, case-insensitively unique list", async (t) => {
  const query = t.mock.method(db, "query", async () => [[
    { subjects: '["Physics","Math"]' },
    { subjects: "math, Chemistry" },
    { subjects: ["Biology", "physics"] },
  ]]);

  assert.deepEqual(
    await TutorProfile.listSubjects(),
    ["Biology", "Chemistry", "Math", "Physics"],
  );
  const [sql] = query.mock.calls[0].arguments;
  assert.match(sql, /u\.is_active = TRUE/);
  assert.match(sql, /tp\.profile_completion >= 60/);
});

test("available days are validated, canonicalized, and persisted", async (t) => {
  const valid = await validateTutorProfile({ available_days: ["wed,mon", "sun"] });
  assert.equal(valid.result.isEmpty(), true);
  assert.equal(valid.body.available_days, "mon,wed,sun");

  const invalid = await validateTutorProfile({ available_days: "mon,moon" });
  assert.equal(invalid.result.isEmpty(), false);
  assert.equal(invalid.result.array()[0].path, "available_days");

  const findByUserId = t.mock.method(TutorProfile, "findByUserId", async () => null);
  const query = t.mock.method(db, "query", async () => [{}]);
  await TutorProfile.upsert(9, { available_days: ["wed", "mon"] });

  assert.equal(findByUserId.mock.callCount(), 2);
  const [sql, values] = query.mock.calls[0].arguments;
  assert.match(sql, /available_days/);
  assert.deepEqual(values, [9, "mon,wed", 30]);
});

test("profile completion ignores nulls and numeric defaults", () => {
  assert.equal(calculateTutorProfileCompletion({
    qualifications: null,
    experience_years: 0,
    subjects: null,
    teaching_mode: "both",
    hourly_rate: 0,
    location: null,
    availability: null,
    available_days: null,
    bio: null,
  }), 20);

  assert.equal(calculateTutorProfileCompletion({
    qualifications: "BSc in Mathematics",
    experience_years: 3,
    subjects: ["Mathematics"],
    hourly_rate: 800,
    location: "Dhaka",
    availability: "Weekdays 17:00-21:00",
    available_days: "mon,tue,wed,thu,fri",
    bio: "Concept-first lessons.",
  }), 100);
});

test("GET /subjects is registered before the dynamic tutor id route", () => {
  const routes = tutorRoutes.stack
    .filter((layer) => layer.route)
    .map((layer) => ({ path: layer.route.path, methods: layer.route.methods }));
  const subjectsIndex = routes.findIndex((route) => route.path === "/subjects");
  const idIndex = routes.findIndex((route) => route.path === "/:id");

  assert.ok(subjectsIndex >= 0);
  assert.ok(idIndex > subjectsIndex);
  assert.equal(routes[subjectsIndex].methods.get, true);
});
