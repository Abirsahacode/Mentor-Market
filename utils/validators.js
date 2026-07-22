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

const subjectsRules = (field) => [
  body(field).optional().isArray({ max: 20 }).withMessage("must be a list of up to 20 subjects"),
  body(`${field}.*`).optional().isString().trim().isLength({ min: 1, max: 60 }).withMessage("must be 1-60 characters"),
];

export const studentProfileRules = [
  body("class_level").optional({ checkFalsy: true }).trim().isLength({ max: 80 }).withMessage("must be at most 80 characters"),
  body("institution").optional({ checkFalsy: true }).trim().isLength({ max: 150 }).withMessage("must be at most 150 characters"),
  body("location").optional({ checkFalsy: true }).trim().isLength({ max: 150 }).withMessage("must be at most 150 characters"),
  ...subjectsRules("subjects"),
  body("learning_goals").optional({ checkFalsy: true }).trim().isLength({ max: 2000 }).withMessage("must be at most 2000 characters"),
  body("bio").optional({ checkFalsy: true }).trim().isLength({ max: 2000 }).withMessage("must be at most 2000 characters"),
];

export const tutorProfileRules = [
  body("qualifications").optional({ checkFalsy: true }).trim().isLength({ max: 2000 }).withMessage("must be at most 2000 characters"),
  body("experience_years").optional({ checkFalsy: true }).isFloat({ min: 0, max: 60 }).withMessage("must be between 0 and 60"),
  ...subjectsRules("subjects"),
  body("teaching_mode").optional({ checkFalsy: true }).isIn(["online", "offline", "both"]).withMessage("must be online, offline, or both"),
  body("hourly_rate").optional({ checkFalsy: true }).isFloat({ min: 0, max: 100000 }).withMessage("must be between 0 and 100000"),
  body("location").optional({ checkFalsy: true }).trim().isLength({ max: 150 }).withMessage("must be at most 150 characters"),
  body("availability").optional({ checkFalsy: true }).trim().isLength({ max: 255 }).withMessage("must be at most 255 characters"),
  body("bio").optional({ checkFalsy: true }).trim().isLength({ max: 2000 }).withMessage("must be at most 2000 characters"),
];

