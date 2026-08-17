import { parseDays } from "../utils/availability.js";

// Strip MySQL/MariaDB boolean-mode fulltext operators so user input can never
// break AGAINST(...) syntax (e.g. a search for `+free -exam"` would otherwise
// be interpreted as query operators instead of literal text).
const sanitizeFulltextTerm = (word) => word.replace(/[+\-<>~*"()@]/g, "").trim();

const ORDER_BY_OPTIONS = {
  rating: "tp.average_rating DESC, tp.is_verified DESC, u.full_name ASC",
  price: "tp.hourly_rate ASC, tp.is_verified DESC, u.full_name ASC",
  experience: "tp.experience_years DESC, tp.is_verified DESC, u.full_name ASC",
  newest: "tp.created_at DESC, tp.is_verified DESC, u.full_name ASC",
  recommended: "tp.is_verified DESC, tp.average_rating DESC, tp.experience_years DESC",
};

export const parseListFilter = (value, { maxItems = 20, maxLength = 60 } = {}) => {
  const rawValues = Array.isArray(value) ? value : [value];
  const parsed = [];
  const seen = new Set();

  for (const rawValue of rawValues) {
    if (!["string", "number"].includes(typeof rawValue)) continue;
    const parts = String(rawValue).split(",", maxItems + 1);
    for (const part of parts) {
      const item = part.trim();
      if (!item || item.length > maxLength) continue;
      const key = item.toLocaleLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      parsed.push(item);
      if (parsed.length >= maxItems) return parsed;
    }
  }

  return parsed;
};

/**
 * Builds the WHERE clause, bound values, and ORDER BY expression for a tutor
 * directory search. Pure and side-effect free: given the same filters it
 * always returns the same SQL fragment, which is what makes it possible to
 * unit test the filtering rules without a live database (see
 * backend/tests/tutorSearch.test.js).
 *
 * @param {object} filters
 * @param {string[]} [filters.subjects] - subjects the tutor must teach at least one of
 * @param {string} [filters.location] - free-text location, matched as a substring
 * @param {"online"|"offline"} [filters.mode] - required teaching mode ("both" always matches)
 * @param {number|string} [filters.minPrice]
 * @param {number|string} [filters.maxPrice]
 * @param {number|string} [filters.minRating]
 * @param {string[]} [filters.days] - required overlap with tp.available_days (mon..sun)
 * @param {string} [filters.q] - free-text search across name, subjects, bio, and posts
 * @param {string} [filters.sort]
 */
export function buildTutorSearchQuery({
  subjects = [],
  location = "",
  mode,
  minPrice,
  maxPrice,
  minRating,
  days = [],
  q = "",
  sort,
} = {}) {
  const clauses = ["u.is_active = TRUE", "tp.profile_completion >= 60"];
  const values = [];
  const normalizedSubjects = parseListFilter(subjects);
  const normalizedDays = parseDays(days);

  if (normalizedSubjects.length) {
    clauses.push(`(${normalizedSubjects.map(() => "JSON_SEARCH(tp.subjects, 'one', ?) IS NOT NULL").join(" OR ")})`);
    values.push(...normalizedSubjects);
  }

  const trimmedLocation = location.trim();
  if (trimmedLocation) {
    clauses.push("tp.location LIKE ?");
    values.push(`%${trimmedLocation}%`);
  }

  if (mode === "online" || mode === "offline") {
    // A tutor who teaches "both" always satisfies a specific mode request.
    clauses.push("(tp.teaching_mode = ? OR tp.teaching_mode = 'both')");
    values.push(mode);
  }

  const min = Number(minPrice);
  if (Number.isFinite(min) && min >= 0) {
    clauses.push("tp.hourly_rate >= ?");
    values.push(min);
  }

  const max = Number(maxPrice);
  if (Number.isFinite(max) && max >= 0) {
    clauses.push("tp.hourly_rate <= ?");
    values.push(max);
  }

  const rating = Number(minRating);
  if (Number.isFinite(rating) && rating >= 0 && rating <= 5) {
    clauses.push("tp.average_rating >= ?");
    values.push(rating);
  }

  if (normalizedDays.length) {
    clauses.push(`(${normalizedDays.map(() => "FIND_IN_SET(?, tp.available_days) > 0").join(" OR ")})`);
    values.push(...normalizedDays);
  }

  // Split the free-text query into individual words and require every word
  // to match somewhere (AND of ORs). This finds "IELTS speaking" against a
  // bio that mentions the terms separately, which a single %phrase% LIKE
  // would miss. Each word is capped so an extreme query can't blow up the
  // clause count.
  const words = q.trim().split(/\s+/).filter(Boolean).slice(0, 6);
  for (const word of words) {
    const like = `%${word}%`;
    const sanitized = sanitizeFulltextTerm(word);
    // Words shorter than 3 characters fall outside InnoDB's default fulltext
    // token size and would silently match nothing via MATCH ... AGAINST, so
    // they use LIKE instead.
    const fulltextTerm = sanitized.length >= 3 ? sanitized : "";
    const postMatch = fulltextTerm
      ? "MATCH(qp.title, qp.subject, qp.description) AGAINST (? IN BOOLEAN MODE)"
      : "(qp.title LIKE ? OR qp.subject LIKE ?)";
    const profileMatch = fulltextTerm
      ? "MATCH(tp.qualifications, tp.bio) AGAINST (? IN BOOLEAN MODE)"
      : "(tp.qualifications LIKE ? OR tp.bio LIKE ?)";
    clauses.push(
      `(u.full_name LIKE ? OR CAST(tp.subjects AS CHAR) LIKE ? OR ${profileMatch}
        OR EXISTS (SELECT 1 FROM tutor_posts qp WHERE qp.tutor_id = tp.user_id AND qp.status = 'active' AND ${postMatch}))`,
    );
    values.push(like, like);
    values.push(...(fulltextTerm ? [`${fulltextTerm}*`] : [like, like]));
    values.push(...(fulltextTerm ? [`${fulltextTerm}*`] : [like, like]));
  }

  return {
    where: `WHERE ${clauses.join(" AND ")}`,
    values,
    orderBy: ORDER_BY_OPTIONS[sort] || ORDER_BY_OPTIONS.recommended,
  };
}
