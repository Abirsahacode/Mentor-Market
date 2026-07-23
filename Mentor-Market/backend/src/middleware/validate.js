import { validationResult } from "express-validator";
import ApiError from "../utils/ApiError.js";

export const validate = (req, _res, next) => {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    const details = result.array().map(({ path, msg }) => ({ field: path, reason: msg }));
    return next(new ApiError(422, "validation_error", "Please correct the highlighted fields", details));
  }
  next();
};

