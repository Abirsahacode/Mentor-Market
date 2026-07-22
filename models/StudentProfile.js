import db from "../config/db.js";

const fields = ["class_level", "institution", "location", "subjects", "learning_goals", "bio"];

const StudentProfile = {
  async findByUserId(userId) {
    const [rows] = await db.query("SELECT * FROM student_profiles WHERE user_id = ?", [userId]);
    return rows[0] || null;
  },
  async upsert(userId, payload) {
    const data = Object.fromEntries(fields.filter((field) => payload[field] !== undefined).map((field) => [field, field === "subjects" && typeof payload[field] !== "string" ? JSON.stringify(payload[field]) : payload[field]]));
    if (!Object.keys(data).length) return this.findByUserId(userId);
    await db.query(
      `INSERT INTO student_profiles (user_id, ${Object.keys(data).join(", ")}) VALUES (?, ${Object.keys(data).map(() => "?").join(", ")})
       ON DUPLICATE KEY UPDATE ${Object.keys(data).map((field) => `${field} = VALUES(${field})`).join(", ")}`,
      [userId, ...Object.values(data)],
    );
    return this.findByUserId(userId);
  },
};

export default StudentProfile;

