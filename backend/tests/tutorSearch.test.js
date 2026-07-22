import test from "node:test";
import assert from "node:assert/strict";
import { buildTutorSearchQuery } from "../src/models/tutorSearchQueryBuilder.js";

test("search with no filters only applies the visibility baseline", () => {
  const { where, values } = buildTutorSearchQuery({});
  assert.equal(where, "WHERE u.is_active = TRUE AND tp.profile_completion >= 60");
  assert.deepEqual(values, []);
});

test("invalid numeric filters are ignored instead of producing NaN comparisons", () => {
  const { where, values } = buildTutorSearchQuery({ maxPrice: "abc", minRating: "9999" });
  assert.ok(!where.includes("hourly_rate"), "maxPrice=abc should not add a price clause");
  assert.ok(!where.includes("average_rating"), "minRating=9999 is out of range and should be ignored");
  assert.deepEqual(values, []);
});

test("a valid price range and rating add parameterized clauses", () => {
  const { where, values } = buildTutorSearchQuery({ minPrice: 200, maxPrice: 900, minRating: 4.5 });
  assert.ok(where.includes("tp.hourly_rate >= ?"));
  assert.ok(where.includes("tp.hourly_rate <= ?"));
  assert.ok(where.includes("tp.average_rating >= ?"));
  assert.deepEqual(values, [200, 900, 4.5]);
});

test("multiple subjects are OR-combined and each contributes a bound value", () => {
  const { where, values } = buildTutorSearchQuery({ subjects: ["Mathematics", "Physics"] });
  assert.equal((where.match(/JSON_SEARCH/g) || []).length, 2);
  assert.deepEqual(values, ["Mathematics", "Physics"]);
});

test("unknown day tokens are dropped and only valid days reach the query", () => {
  const { where, values } = buildTutorSearchQuery({ days: ["sat", "sun", "not-a-day"] });
  assert.equal((where.match(/FIND_IN_SET/g) || []).length, 2);
  assert.deepEqual(values, ["sat", "sun"]);
});

test("a two-word free-text query requires both words to match somewhere (AND of ORs)", () => {
  const { where, values } = buildTutorSearchQuery({ q: "ielts speaking" });
  const wordClauseCount = (where.match(/full_name LIKE \?/g) || []).length;
  assert.equal(wordClauseCount, 2, "each word should contribute its own clause");
  // "ielts" and "speaking" are both >= 3 chars, so they use the fulltext path.
  assert.ok(values.includes("ielts*"));
  assert.ok(values.includes("speaking*"));
});

test("short free-text words fall back to LIKE instead of an ineffective fulltext match", () => {
  const { values } = buildTutorSearchQuery({ q: "ai" });
  assert.ok(values.includes("%ai%"));
  assert.ok(!values.includes("ai*"));
});

test("an unknown sort falls back to the recommended ordering", () => {
  const { orderBy } = buildTutorSearchQuery({ sort: "bogus" });
  assert.match(orderBy, /is_verified DESC/);
});

test("sort=newest orders by profile creation date", () => {
  const { orderBy } = buildTutorSearchQuery({ sort: "newest" });
  assert.match(orderBy, /tp.created_at DESC/);
});
