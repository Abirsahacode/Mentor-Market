import test from "node:test";
import assert from "node:assert/strict";
import BaseModel from "../src/models/BaseModel.js";

test("transactional creates re-read through the same connection", async () => {
  const calls = [];
  const connection = {
    query: async (sql, values) => {
      calls.push({ sql, values });
      if (sql.startsWith("INSERT")) return [{ insertId: 42 }];
      return [[{ id: 42, title: "Inside transaction" }]];
    },
  };
  const model = new BaseModel({ table: "examples", fields: ["title"] });

  const created = await model.create({ title: "Inside transaction" }, connection);

  assert.deepEqual(created, { id: 42, title: "Inside transaction" });
  assert.equal(calls.length, 2);
  assert.match(calls[0].sql, /^INSERT/);
  assert.match(calls[1].sql, /^SELECT/);
});

test("transactional updates re-read through the same connection", async () => {
  const calls = [];
  const connection = {
    query: async (sql, values) => {
      calls.push({ sql, values });
      if (sql.startsWith("UPDATE")) return [{ affectedRows: 1 }];
      return [[{ id: 7, status: "accepted" }]];
    },
  };
  const model = new BaseModel({ table: "examples", fields: ["status"] });

  const updated = await model.update(7, { status: "accepted" }, connection);

  assert.deepEqual(updated, { id: 7, status: "accepted" });
  assert.equal(calls.length, 2);
  assert.match(calls[0].sql, /^UPDATE/);
  assert.match(calls[1].sql, /^SELECT/);
});
