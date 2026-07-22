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

export const searchTutorsRules = [
  query("q").optional().trim().isLength({ max: 100 }).withMessage("must be 100 characters or fewer"),
  query("location").optional().trim().isLength({ max: 150 }).withMessage("must be 150 characters or fewer"),
  query("mode").optional().isIn(["online", "offline"]).withMessage("must be online or offline"),
  query("maxPrice").optional().isFloat({ min: 0 }).withMessage("must be a positive number"),
  query("minRating").optional().isFloat({ min: 0, max: 5 }).withMessage("must be between 0 and 5"),
  query("period").optional().isIn(["morning", "afternoon", "evening", "flexible"]).withMessage("must be a valid time of day"),
  query("sort").optional().isIn(["recommended", "rating", "price", "experience"]).withMessage("must be a supported sort option"),
  query("page").optional().isInt({ min: 1 }).withMessage("must be a positive integer"),
  query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("must be between 1 and 100"),
];
