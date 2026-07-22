import db from "../config/db.js";

const publicColumns = "id, full_name, email, role, phone, avatar_url, is_active, last_login_at, created_at, updated_at";

const User = {
  async findByEmail(email) {
    const [rows] = await db.query("SELECT * FROM users WHERE email = ? LIMIT 1", [email]);
    return rows[0] || null;
  },

  async findPublicById(id) {
    const [rows] = await db.query(`SELECT ${publicColumns} FROM users WHERE id = ? LIMIT 1`, [id]);
    return rows[0] || null;
  },

  async create({ full_name, email, password_hash, role }) {
    const [result] = await db.query(
      "INSERT INTO users (full_name, email, password_hash, role) VALUES (?, ?, ?, ?)",
      [full_name, email, password_hash, role],
    );
    return this.findPublicById(result.insertId);
  },

  async touchLogin(id) {
    await db.query("UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?", [id]);
  },

  async update(id, payload) {
    const allowed = ["full_name", "phone", "avatar_url"];
    const data = Object.fromEntries(allowed.filter((field) => payload[field] !== undefined).map((field) => [field, payload[field]]));
    const fields = Object.keys(data);
    if (fields.length) {
      await db.query(
        `UPDATE users SET ${fields.map((field) => `\`${field}\` = ?`).join(", ")} WHERE id = ?`,
        [...Object.values(data), id],
      );
    }
    return this.findPublicById(id);
  },
};

export default User;

