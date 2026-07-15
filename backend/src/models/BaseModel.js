import db from "../config/db.js";

const encodeValue = (value, isJson) => {
  if (value === undefined) return undefined;
  if (isJson && typeof value !== "string") return JSON.stringify(value);
  return value;
};

export default class BaseModel {
  constructor({ table, fields, jsonFields = [], searchFields = [] }) {
    this.table = table;
    this.fields = fields;
    this.jsonFields = new Set(jsonFields);
    this.searchFields = searchFields;
  }

  pick(payload) {
    return Object.fromEntries(
      this.fields
        .filter((field) => payload[field] !== undefined)
        .map((field) => [field, encodeValue(payload[field], this.jsonFields.has(field))]),
    );
  }

  async findById(id) {
    const [rows] = await db.query(`SELECT * FROM \`${this.table}\` WHERE id = ? LIMIT 1`, [id]);
    return rows[0] || null;
  }

  async findOneBy(field, value) {
    if (!["id", ...this.fields].includes(field)) throw new Error(`Unsafe lookup field: ${field}`);
    const [rows] = await db.query(
      `SELECT * FROM \`${this.table}\` WHERE \`${field}\` = ? LIMIT 1`,
      [value],
    );
    return rows[0] || null;
  }

  async findAll({ filters = {}, q, limit = 12, offset = 0, orderBy = "created_at DESC" } = {}) {
    const clauses = [];
    const values = [];
    for (const [field, value] of Object.entries(filters)) {
      if (!["id", ...this.fields].includes(field) || value === undefined || value === "") continue;
      clauses.push(`\`${field}\` = ?`);
      values.push(value);
    }
    if (q && this.searchFields.length) {
      clauses.push(`(${this.searchFields.map((field) => `\`${field}\` LIKE ?`).join(" OR ")})`);
      values.push(...this.searchFields.map(() => `%${q}%`));
    }
    const safeOrder = ["created_at DESC", "created_at ASC", "id DESC", "id ASC"].includes(orderBy)
      ? orderBy
      : "created_at DESC";
    const where = clauses.length ? ` WHERE ${clauses.join(" AND ")}` : "";
    const [rows] = await db.query(
      `SELECT * FROM \`${this.table}\`${where} ORDER BY ${safeOrder} LIMIT ? OFFSET ?`,
      [...values, Number(limit), Number(offset)],
    );
    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) AS total FROM \`${this.table}\`${where}`,
      values,
    );
    return { rows, total };
  }

  async create(payload, connection = db) {
    const data = this.pick(payload);
    const fields = Object.keys(data);
    if (!fields.length) throw new Error(`No valid fields supplied for ${this.table}`);
    const [result] = await connection.query(
      `INSERT INTO \`${this.table}\` (${fields.map((field) => `\`${field}\``).join(", ")}) VALUES (${fields.map(() => "?").join(", ")})`,
      Object.values(data),
    );
    return this.findById(result.insertId);
  }

  async update(id, payload, connection = db) {
    const data = this.pick(payload);
    const fields = Object.keys(data);
    if (!fields.length) return this.findById(id);
    await connection.query(
      `UPDATE \`${this.table}\` SET ${fields.map((field) => `\`${field}\` = ?`).join(", ")} WHERE id = ?`,
      [...Object.values(data), id],
    );
    return this.findById(id);
  }

  async remove(id) {
    const [result] = await db.query(`DELETE FROM \`${this.table}\` WHERE id = ?`, [id]);
    return result.affectedRows > 0;
  }
}

