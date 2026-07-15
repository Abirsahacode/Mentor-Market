import db from "../config/db.js";

const fields = ["qualifications", "experience_years", "subjects", "teaching_mode", "hourly_rate", "location", "availability", "bio"];

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
    const data = Object.fromEntries(fields.filter((field) => payload[field] !== undefined).map((field) => [field, field === "subjects" && typeof payload[field] !== "string" ? JSON.stringify(payload[field]) : payload[field]]));
    data.profile_completion = calculateCompletion({ ...existing, ...payload });
    await db.query(
      `INSERT INTO tutor_profiles (user_id, ${Object.keys(data).join(", ")}) VALUES (?, ${Object.keys(data).map(() => "?").join(", ")})
       ON DUPLICATE KEY UPDATE ${Object.keys(data).map((field) => `${field} = VALUES(${field})`).join(", ")}`,
      [userId, ...Object.values(data)],
    );
    return this.findByUserId(userId);
  },
  async search({ subject, location, mode, maxPrice, minRating, q, limit, offset }) {
    const clauses = ["u.is_active = TRUE"];
    const values = [];
    if (subject) { clauses.push("JSON_SEARCH(tp.subjects, 'one', ?) IS NOT NULL"); values.push(subject); }
    if (location) { clauses.push("tp.location LIKE ?"); values.push(`%${location}%`); }
    if (mode) { clauses.push("(tp.teaching_mode = ? OR tp.teaching_mode = 'both')"); values.push(mode); }
    if (maxPrice) { clauses.push("tp.hourly_rate <= ?"); values.push(Number(maxPrice)); }
    if (minRating) { clauses.push("tp.average_rating >= ?"); values.push(Number(minRating)); }
    if (q) { clauses.push("(u.full_name LIKE ? OR tp.bio LIKE ? OR tp.qualifications LIKE ? OR fp.title LIKE ? OR fp.subject LIKE ?)"); values.push(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`); }
    const where = `WHERE ${clauses.join(" AND ")}`;
    const select = `FROM tutor_profiles tp
      JOIN users u ON u.id = tp.user_id
      LEFT JOIN tutor_posts fp ON fp.id = (
        SELECT MIN(featured.id) FROM tutor_posts featured WHERE featured.tutor_id = tp.user_id AND featured.status = 'active'
      ) ${where}`;
    const [rows] = await db.query(
      `SELECT tp.*, u.full_name, u.avatar_url, fp.title AS featured_service_title, fp.thumbnail_url, fp.demo_video_url
       ${select} ORDER BY tp.is_verified DESC, tp.average_rating DESC LIMIT ? OFFSET ?`,
      [...values, Number(limit), Number(offset)],
    );
    const [[{ total }]] = await db.query(`SELECT COUNT(*) AS total ${select}`, values);
    return { rows, total };
  },
};

export default TutorProfile;
