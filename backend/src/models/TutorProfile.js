import db from "../config/db.js";
import { parseDays } from "../utils/availability.js";
import { buildTutorSearchQuery, parseListFilter } from "./tutorSearchQueryBuilder.js";

const fields = ["qualifications", "experience_years", "subjects", "teaching_mode", "hourly_rate", "location", "availability", "available_days", "bio"];
const publicFields = [
  "user_id",
  "qualifications",
  "experience_years",
  "subjects",
  "teaching_mode",
  "hourly_rate",
  "location",
  "availability",
  "available_days",
  "bio",
  "profile_completion",
  "average_rating",
  "is_verified",
  "created_at",
  "updated_at",
  "full_name",
  "avatar_url",
];

const firstValue = (value) => Array.isArray(value) ? value[0] : value;
const stringValue = (value) => {
  const resolved = firstValue(value);
  return typeof resolved === "string" ? resolved : "";
};

const normalizeSearchFilters = (filters = {}) => ({
  subjects: parseListFilter(filters.subject ?? filters.subjects),
  days: parseDays(filters.days),
  location: stringValue(filters.location),
  mode: stringValue(filters.mode),
  minPrice: firstValue(filters.minPrice),
  maxPrice: firstValue(filters.maxPrice),
  minRating: firstValue(filters.minRating),
  q: stringValue(filters.q),
  sort: stringValue(filters.sort),
});

const parseStoredSubjects = (value) => {
  if (Array.isArray(value)) return parseListFilter(value);
  if (typeof value !== "string") return [];
  try {
    return parseListFilter(JSON.parse(value));
  } catch {
    return parseListFilter(value);
  }
};

export const toPublicTutorProfile = (profile) => {
  if (!profile) return null;
  return Object.fromEntries(publicFields
    .filter((field) => profile[field] !== undefined)
    .map((field) => [field, profile[field]]));
};

export const calculateTutorProfileCompletion = (payload = {}) => {
  const completed = [
    Boolean(String(payload.qualifications || "").trim()),
    Number(payload.experience_years) > 0,
    parseStoredSubjects(payload.subjects).length > 0,
    Number(payload.hourly_rate) > 0,
    Boolean(String(payload.location || "").trim()),
    Boolean(String(payload.availability || "").trim()),
    parseDays(payload.available_days).length > 0,
    Boolean(String(payload.bio || "").trim()),
  ].filter(Boolean).length;
  return Math.min(20 + completed * 10, 100);
};

const TutorProfile = {
  async findByUserId(userId, connection = db) {
    const [rows] = await connection.query(
      `SELECT tp.*, u.full_name, u.email, u.phone, u.avatar_url
       FROM tutor_profiles tp JOIN users u ON u.id = tp.user_id WHERE tp.user_id = ?`,
      [userId],
    );
    return rows[0] || null;
  },
  async findPublicByUserId(userId) {
    const [rows] = await db.query(
      `SELECT tp.user_id, tp.qualifications, tp.experience_years, tp.subjects,
        tp.teaching_mode, tp.hourly_rate, tp.location, tp.availability,
        tp.available_days, tp.bio, tp.profile_completion, tp.average_rating,
        tp.is_verified, tp.created_at, tp.updated_at, u.full_name, u.avatar_url
       FROM tutor_profiles tp JOIN users u ON u.id = tp.user_id
       WHERE tp.user_id = ? AND tp.profile_completion >= 60
         AND u.role = 'tutor' AND u.is_active = TRUE`,
      [userId],
    );
    return toPublicTutorProfile(rows[0]);
  },
  async listSubjects() {
    const [rows] = await db.query(
      `SELECT tp.subjects FROM tutor_profiles tp
       JOIN users u ON u.id = tp.user_id
       WHERE u.role = 'tutor' AND u.is_active = TRUE
         AND tp.profile_completion >= 60 AND tp.subjects IS NOT NULL`,
    );
    const subjects = new Map();
    rows.flatMap((row) => parseStoredSubjects(row.subjects)).forEach((subject) => {
      const key = subject.toLocaleLowerCase();
      if (!subjects.has(key)) subjects.set(key, subject);
    });
    return [...subjects.values()].sort((left, right) => left.localeCompare(right, "en", { sensitivity: "base" }));
  },
  async upsert(userId, payload, connection = db) {
    const existing = await this.findByUserId(userId, connection);
    const normalizedPayload = {
      ...payload,
      ...(payload.available_days !== undefined ? { available_days: parseDays(payload.available_days).join(",") } : {}),
    };
    const data = Object.fromEntries(fields
      .filter((field) => normalizedPayload[field] !== undefined)
      .map((field) => [field, field === "subjects" && typeof normalizedPayload[field] !== "string"
        ? JSON.stringify(normalizedPayload[field])
        : normalizedPayload[field]]));
    data.profile_completion = calculateTutorProfileCompletion({ ...existing, ...normalizedPayload });
    await connection.query(
      `INSERT INTO tutor_profiles (user_id, ${Object.keys(data).join(", ")}) VALUES (?, ${Object.keys(data).map(() => "?").join(", ")})
       ON DUPLICATE KEY UPDATE ${Object.keys(data).map((field) => `${field} = VALUES(${field})`).join(", ")}`,
      [userId, ...Object.values(data)],
    );
    return this.findByUserId(userId, connection);
  },
  async search(filters = {}) {
    const { where, values, orderBy } = buildTutorSearchQuery(normalizeSearchFilters(filters));
    const select = `FROM tutor_profiles tp
      JOIN users u ON u.id = tp.user_id
      LEFT JOIN tutor_posts fp ON fp.id = (
        SELECT MIN(featured.id) FROM tutor_posts featured WHERE featured.tutor_id = tp.user_id AND featured.status = 'active'
      ) ${where}`;
    const [rows] = await db.query(
      `SELECT tp.*, u.full_name, u.avatar_url, fp.title AS featured_service_title, fp.thumbnail_url, fp.demo_video_url
       ${select} ORDER BY ${orderBy} LIMIT ? OFFSET ?`,
      [...values, Number(filters.limit), Number(filters.offset)],
    );
    const [[{ total }]] = await db.query(`SELECT COUNT(*) AS total ${select}`, values);
    return { rows, total };
  },
};

export default TutorProfile;
