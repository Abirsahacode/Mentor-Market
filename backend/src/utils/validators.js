import { body } from "express-validator";
import { DAY_TOKENS, parseDays } from "./availability.js";

export const registerRules = [
  body("full_name").trim().isLength({ min: 2, max: 100 }).withMessage("must be 2-100 characters"),
  body("email").isEmail().normalizeEmail().withMessage("must be a valid email address"),
  body("password").isLength({ min: 8 }).withMessage("must contain at least 8 characters"),
  body("role").isIn(["student", "tutor"]).withMessage("must be student or tutor"),
  body("referral_code").optional({ checkFalsy: true }).trim().isLength({ min: 3, max: 30 }).withMessage("must be 3-30 characters"),
];

export const loginRules = [
  body("email").isEmail().normalizeEmail().withMessage("must be a valid email address"),
  body("password").notEmpty().withMessage("is required"),
];

export const requiredFields = (...fields) => fields.map((field) =>
  body(field).notEmpty().withMessage("is required"));

export const contactRules = [
  body("name").trim().isLength({ min: 2, max: 120 }).withMessage("must be 2-120 characters"),
  body("email").isEmail().normalizeEmail().withMessage("must be a valid email address"),
  body("subject").optional({ checkFalsy: true }).trim().isLength({ max: 160 }).withMessage("must be at most 160 characters"),
  body("message").trim().isLength({ min: 10, max: 2000 }).withMessage("must be 10-2000 characters"),
];

export const tutorPostRules = [
  body("price").isFloat({ gt: 0 }).withMessage("must be a positive number"),
  body("thumbnail_url").optional({ checkFalsy: true }).isURL().withMessage("must be a valid URL"),
  body("demo_video_url").optional({ checkFalsy: true }).isURL().withMessage("must be a valid URL"),
  body("teaching_mode").isIn(["online", "offline", "both"]).withMessage("must be online, offline, or both"),
];

const subjectsRules = (field) => [
  body(field).optional().isArray({ max: 20 }).withMessage("must be a list of up to 20 subjects"),
  body(`${field}.*`).optional().isString().trim().isLength({ min: 1, max: 60 }).withMessage("must be 1-60 characters"),
];

const availableDayTokens = (value) => (Array.isArray(value) ? value : [value])
  .flatMap((item) => String(item ?? "").split(","))
  .map((item) => item.trim().toLowerCase())
  .filter(Boolean);

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
  body("available_days").optional({ checkFalsy: true })
    .custom((value) => availableDayTokens(value).every((day) => DAY_TOKENS.includes(day)))
    .withMessage(`must contain only ${DAY_TOKENS.join(", ")}`)
    .customSanitizer((value) => parseDays(value).join(",")),
  body("bio").optional({ checkFalsy: true }).trim().isLength({ max: 2000 }).withMessage("must be at most 2000 characters"),
];
