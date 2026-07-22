import CourseEngagement from "../models/CourseEngagement.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/respond.js";

const courseIdFrom = (value) => {
  const id = Number(value);
  if (!Number.isSafeInteger(id) || id < 1) {
    throw new ApiError(422, "validation_error", "course_id must be a positive integer");
  }
  return id;
};

export const listSavedCourses = asyncHandler(async (req, res) => {
  const courses = await CourseEngagement.listSaved(req.user.id);
  sendSuccess(res, courses, "Saved courses loaded");
});

export const saveCourse = asyncHandler(async (req, res) => {
  const course = await CourseEngagement.save(req.user.id, courseIdFrom(req.params.courseId));
  if (!course) throw new ApiError(404, "course_not_found", "An active course was not found");
  sendSuccess(res, course, "Course saved");
});

export const removeSavedCourse = asyncHandler(async (req, res) => {
  await CourseEngagement.removeSaved(req.user.id, courseIdFrom(req.params.courseId));
  res.status(204).send();
});

export const recordCourseView = asyncHandler(async (req, res) => {
  const course = await CourseEngagement.recordView(req.user.id, courseIdFrom(req.body.course_id));
  if (!course) throw new ApiError(404, "course_not_found", "An active course was not found");
  sendSuccess(res, course, "Course view recorded");
});

export const listRecentCourses = asyncHandler(async (req, res) => {
  const requestedLimit = Number.parseInt(req.query.limit, 10);
  const limit = Math.min(Math.max(Number.isNaN(requestedLimit) ? 6 : requestedLimit, 1), 24);
  const courses = await CourseEngagement.listRecent(req.user.id, limit);
  sendSuccess(res, courses, "Recently viewed courses loaded", 200, { limit });
});
