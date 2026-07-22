import { body, query } from "express-validator";

export const registerRules = [
  body("full_name").trim().isLength({ min: 2, max: 100 }).withMessage("must be 2-100 characters"),
  body("email").isEmail().normalizeEmail().withMessage("must be a valid email address"),
  body("password").isLength({ min: 8 }).withMessage("must contain at least 8 characters"),
  body("role").isIn(["student", "tutor"]).withMessage("must be student or tutor"),
];

export const loginRules = [
  body("email").isEmail().normalizeEmail().withMessage("must be a valid email address"),
  body("password").notEmpty().withMessage("is required"),
];

export const requiredFields = (...fields) => fields.map((field) =>
  body(field).notEmpty().withMessage("is required"));

// The search endpoint previously accepted any query string unchecked, which
// let a malformed value (e.g. maxPrice=abc) silently produce a broken or
// meaningless SQL comparison instead of a clear 422. Every filter is
// optional; only its shape is validated here, the actual filtering logic
// lives in tutorSearchQueryBuilder.js.
export const searchTutorRules = [
  query("subject").optional().isString().trim().isLength({ max: 200 }).withMessage("must be a short list of subjects"),
  query("location").optional().isString().trim().isLength({ max: 150 }).withMessage("must be under 150 characters"),
  query("mode").optional().isIn(["online", "offline"]).withMessage("must be online or offline"),
  query("minPrice").optional().isFloat({ min: 0 }).withMessage("must be a positive number"),
  query("maxPrice").optional().isFloat({ min: 0 }).withMessage("must be a positive number"),
  query("minRating").optional().isFloat({ min: 0, max: 5 }).withMessage("must be between 0 and 5"),
  query("days").optional().isString().trim().isLength({ max: 40 }).withMessage("must be a short list of days"),
  query("q").optional().isString().trim().isLength({ max: 120 }).withMessage("must be under 120 characters"),
  query("sort").optional().isIn(["recommended", "rating", "price", "experience", "newest"]).withMessage("is not a supported sort option"),
  query("page").optional().isInt({ min: 1 }).withMessage("must be a positive integer"),
  query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("must be between 1 and 100"),
];

