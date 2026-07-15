import { body } from "express-validator";

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

