import db from "../config/db.js";

const publicColumns = "id, full_name, email, role, phone, avatar_url, referral_code, referred_by_id, is_active, last_login_at, created_at, updated_at";

const User = {
  async findByEmail(email) {
    const [rows] = await db.query("SELECT * FROM users WHERE email = ? LIMIT 1", [email]);
    return rows[0] || null;
  },

  async findByReferralCode(code) {
    if (!code) return null;
    try {
      const [rows] = await db.query("SELECT * FROM users WHERE UPPER(referral_code) = UPPER(?) LIMIT 1", [code]);
      return rows[0] || null;
    } catch {
      return null;
    }
  },

  async findPublicById(id) {
    const [rows] = await db.query(`SELECT ${publicColumns} FROM users WHERE id = ? LIMIT 1`, [id]);
    return rows[0] || null;
  },

  async create({ full_name, email, password_hash, role, referral_code = null, referred_by_id = null }) {
    const [result] = await db.query(
      "INSERT INTO users (full_name, email, password_hash, role, referral_code, referred_by_id) VALUES (?, ?, ?, ?, ?, ?)",
      [full_name, email, password_hash, role, referral_code, referred_by_id],
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

