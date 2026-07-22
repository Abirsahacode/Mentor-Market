import db from "../config/db.js";
import { parseDays } from "../utils/availability.js";
import { buildTutorSearchQuery } from "./tutorSearchQueryBuilder.js";

const fields = [
  "qualifications", "experience_years", "subjects", "teaching_mode", "hourly_rate",
  "location", "availability", "available_days", "bio",
];

const calculateCompletion = (payload) => {
  const completed = fields.filter((field) => payload[field] !== undefined && payload[field] !== "").length;
  return Math.min(20 + completed * 10, 100);
};

const TutorProfile = {
  async findByUserId(userId) {
    const [rows] = await db.query(
      `SELECT tp.*, u.full_name, u.email, u.phone, u.avatar_url
       FROM tutor_profiles tp JOIN users u ON u.id = tp.user_id WHERE tp.user_id = ?`,
      [userId],
    );
    return rows[0] || null;
  },

  async upsert(userId, payload) {
    const existing = await this.findByUserId(userId);
    const data = Object.fromEntries(
      fields
        .filter((field) => payload[field] !== undefined)
        .map((field) => {
          if (field === "subjects" && typeof payload[field] !== "string") return [field, JSON.stringify(payload[field])];
          // available_days is a SET column: only ever persist known, validated
          // day tokens so a bad client payload can't write garbage into it.
          if (field === "available_days") return [field, parseDays(payload[field]).join(",")];
          return [field, payload[field]];
        }),
    );
    data.profile_completion = calculateCompletion({ ...existing, ...payload });
    await db.query(
      `INSERT INTO tutor_profiles (user_id, ${Object.keys(data).join(", ")}) VALUES (?, ${Object.keys(data).map(() => "?").join(", ")})
       ON DUPLICATE KEY UPDATE ${Object.keys(data).map((field) => `${field} = VALUES(${field})`).join(", ")}`,
      [userId, ...Object.values(data)],
    );
    return this.findByUserId(userId);
  },

  /**
   * Searches the tutor directory. Filtering rules live in
   * tutorSearchQueryBuilder.js so they can be unit tested in isolation; this
   * method is only responsible for turning that SQL fragment into two
   * queries against the database.
   */
  async search(filters) {
    const { where, values, orderBy } = buildTutorSearchQuery(filters);
    const { limit, offset } = filters;

    // The count query intentionally does NOT join tutor_posts or reviews:
    // those joins only exist to attach display data for the current page and
    // never change which rows match the WHERE clause (post-text matches are
    // handled by an EXISTS subquery, not a join), so re-running them for
    // every row just to discard the result was pure overhead.
    const countPromise = db.query(
      `SELECT COUNT(*) AS total FROM tutor_profiles tp JOIN users u ON u.id = tp.user_id ${where}`,
      values,
    );

    const rowsPromise = db.query(
      `SELECT tp.*, u.full_name, u.avatar_url,
          fp.title AS featured_service_title, fp.thumbnail_url, fp.demo_video_url,
          COALESCE(rc.review_count, 0) AS review_count
       FROM tutor_profiles tp
       JOIN users u ON u.id = tp.user_id
       LEFT JOIN tutor_posts fp ON fp.id = (
         SELECT MIN(featured.id) FROM tutor_posts featured WHERE featured.tutor_id = tp.user_id AND featured.status = 'active'
       )
       LEFT JOIN (SELECT receiver_id, COUNT(*) AS review_count FROM reviews GROUP BY receiver_id) rc ON rc.receiver_id = tp.user_id
       ${where}
       ORDER BY ${orderBy}
       LIMIT ? OFFSET ?`,
      [...values, Number(limit), Number(offset)],
    );

    const [[rows], [[{ total }]]] = await Promise.all([rowsPromise, countPromise]);
    return { rows, total };
  },

  /** Distinct subjects taught by discoverable tutors, used to keep the search filter's subject list in sync with real data instead of a hand-maintained frontend constant. */
  async listDistinctSubjects() {
    const [rows] = await db.query(
      `SELECT DISTINCT jt.subject
       FROM tutor_profiles tp
       JOIN users u ON u.id = tp.user_id,
       JSON_TABLE(tp.subjects, '$[*]' COLUMNS (subject VARCHAR(100) PATH '$')) AS jt
       WHERE u.is_active = TRUE AND tp.profile_completion >= 60
       ORDER BY jt.subject ASC
       LIMIT 60`,
    );
    return rows.map((row) => row.subject);
  },
};

export default TutorProfile;
