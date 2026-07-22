import BaseModel from "./BaseModel.js";

export const model = (table, fields, options = {}) => new BaseModel({ table, fields, ...options });

