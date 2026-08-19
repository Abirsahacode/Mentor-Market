import db from "../config/db.js";
import CourseModule from "../models/CourseModule.js";
import TutorPost from "../models/TutorPost.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { logModeration } from "../utils/moderationLog.js";
import { getPagination } from "../utils/pagination.js";
import { sendSuccess } from "../utils/respond.js";

const editablePostFields = [
  "title", "subject", "level", "price", "teaching_mode", "location", "availability",
  "has_trial", "thumbnail_url", "demo_video_url", "description", "status",
];
const pickEditablePost = (payload) => Object.fromEntries(
  editablePostFields.filter((field) => payload[field] !== undefined).map((field) => [field, payload[field]]),
);

export const listPosts = asyncHandler(async (req, res) => {
  const { page, limit, offset } = getPagination(req.query);
  const filters = {};
  ["subject", "teaching_mode", "status", "tutor_id"].forEach((field) => {
    if (req.query[field]) filters[field] = req.query[field];
  });
  const isOwnTutorList = req.user?.role === "tutor" && Number(req.query.tutor_id) === req.user.id;
  if (!req.user || (req.user.role !== "admin" && !isOwnTutorList)) filters.status = req.query.status || "active";
  const result = await TutorPost.findAll({ filters, q: req.query.q, limit, offset });
  const tutorIds = [...new Set(result.rows.map((post) => post.tutor_id))];
  let tutors = [];
  if (tutorIds.length) {
    [tutors] = await db.query(
      `SELECT u.id, u.full_name, u.avatar_url, tp.average_rating, tp.is_verified FROM users u
       JOIN tutor_profiles tp ON tp.user_id = u.id WHERE u.id IN (${tutorIds.map(() => "?").join(",")})`, tutorIds,
    );
  }
  const byId = Object.fromEntries(tutors.map((tutor) => [tutor.id, tutor]));
  let rows = result.rows.map((post) => ({ ...post, tutor: byId[post.tutor_id] }));
  if (isOwnTutorList && rows.length) {
    const postIds = rows.map((r) => r.id);
    const placeholders = postIds.map(() => "?").join(",");
    const [[viewRows], [saveRows], [bookingRows]] = await Promise.all([
      db.query(`SELECT course_id, SUM(view_count) AS views FROM course_views WHERE course_id IN (${placeholders}) GROUP BY course_id`, postIds),
      db.query(`SELECT course_id, COUNT(*) AS saves FROM saved_courses WHERE course_id IN (${placeholders}) GROUP BY course_id`, postIds),
      db.query(`SELECT tutor_post_id, COUNT(*) AS bookings FROM bookings WHERE tutor_post_id IN (${placeholders}) GROUP BY tutor_post_id`, postIds),
    ]);
    const viewMap = Object.fromEntries(viewRows.map((r) => [r.course_id, Number(r.views)]));
    const saveMap = Object.fromEntries(saveRows.map((r) => [r.course_id, Number(r.saves)]));
    const bookingMap = Object.fromEntries(bookingRows.map((r) => [r.tutor_post_id, Number(r.bookings)]));
    rows = rows.map((post) => ({ ...post, views: viewMap[post.id] || 0, saves: saveMap[post.id] || 0, bookings: bookingMap[post.id] || 0 }));
  }
  sendSuccess(res, rows, "Tutor posts loaded", 200, { page, limit, total: result.total, pages: Math.ceil(result.total / limit) });
});

export const getPost = asyncHandler(async (req, res) => {
  const post = await TutorPost.findById(req.params.id);
  if (!post) throw new ApiError(404, "post_not_found", "Tutor post was not found");

  // Detail pages need mentor context, social proof, a curriculum, and
  // nearby alternatives. Four fixed queries regardless of review/module
  // count, avoiding query-per-item behavior.
  const [[tutorRows], [reviewRows], [moduleRows], [relatedRows]] = await Promise.all([
    db.query(
      `SELECT u.id, u.full_name, u.avatar_url,
         profile.qualifications, profile.experience_years, profile.subjects,
         profile.teaching_mode, profile.hourly_rate, profile.location,
         profile.availability, profile.bio, profile.profile_completion,
         profile.average_rating, profile.is_verified
       FROM users u
       JOIN tutor_profiles profile ON profile.user_id = u.id
       WHERE u.id = ? LIMIT 1`,
      [post.tutor_id],
    ),
    db.query(
      `SELECT r.id, r.rating, r.comment, r.created_at,
         reviewer.id AS reviewer_id, reviewer.full_name AS reviewer_name,
         reviewer.avatar_url AS reviewer_avatar_url
       FROM reviews r
       JOIN users reviewer ON reviewer.id = r.reviewer_id
       WHERE r.receiver_id = ?
       ORDER BY r.created_at DESC
       LIMIT 10`,
      [post.tutor_id],
    ),
    db.query(
      "SELECT * FROM course_modules WHERE tutor_post_id = ? ORDER BY position ASC, id ASC",
      [post.id],
    ),
    db.query(
      `SELECT tp.id, tp.title, tp.subject, tp.level, tp.price, tp.thumbnail_url, tp.has_trial,
         u.full_name AS tutor_name, profile.average_rating, profile.is_verified
       FROM tutor_posts tp
       JOIN users u ON u.id = tp.tutor_id
       JOIN tutor_profiles profile ON profile.user_id = tp.tutor_id
       WHERE tp.subject = ? AND tp.status = 'active' AND tp.id <> ?
       ORDER BY profile.average_rating DESC, tp.created_at DESC
       LIMIT 4`,
      [post.subject, post.id],
    ),
  ]);

  const reviews = reviewRows.map((review) => ({
    id: review.id,
    rating: review.rating,
    comment: review.comment,
    created_at: review.created_at,
    reviewer: {
      id: review.reviewer_id,
      full_name: review.reviewer_name,
      avatar_url: review.reviewer_avatar_url,
    },
  }));

  sendSuccess(res, {
    ...post,
    tutor: tutorRows[0] || null,
    reviews,
    modules: moduleRows,
    related_posts: relatedRows,
  }, "Tutor post loaded");
});

export const createPost = asyncHandler(async (req, res) => {
  const post = await TutorPost.create({ ...req.body, tutor_id: req.user.id });
  sendSuccess(res, post, "Tutor service post created", 201);
});

const assertPostOwner = async (req) => {
  const post = await TutorPost.findById(req.params.id);
  if (!post) throw new ApiError(404, "post_not_found", "Tutor post was not found");
  if (req.user.role !== "admin" && post.tutor_id !== req.user.id) throw new ApiError(403, "forbidden", "You cannot modify this post");
  return post;
};

export const updatePost = asyncHandler(async (req, res) => {
  await assertPostOwner(req);
  sendSuccess(res, await TutorPost.update(req.params.id, pickEditablePost(req.body)), "Tutor post updated");
});

export const deletePost = asyncHandler(async (req, res) => {
  const post = await assertPostOwner(req);
  await TutorPost.remove(req.params.id);
  if (req.user.role === "admin") await logModeration(req.user.id, "delete_tutor_post", "tutor_post", post.id, req.body.reason);
  res.status(204).send();
});

export const createModule = asyncHandler(async (req, res) => {
  const post = await assertPostOwner(req);
  const [[{ nextPosition }]] = await db.query(
    "SELECT COALESCE(MAX(position), -1) + 1 AS nextPosition FROM course_modules WHERE tutor_post_id = ?",
    [post.id],
  );
  const module_ = await CourseModule.create({
    tutor_post_id: post.id,
    title: req.body.title,
    description: req.body.description,
    items: Array.isArray(req.body.items) ? req.body.items : [],
    position: nextPosition,
  });
  sendSuccess(res, module_, "Learning path module added", 201);
});

const assertModuleOwner = async (req) => {
  const post = await assertPostOwner(req);
  const courseModule = await CourseModule.findById(req.params.moduleId);
  if (!courseModule || courseModule.tutor_post_id !== post.id) throw new ApiError(404, "module_not_found", "Learning path module was not found");
  return courseModule;
};

export const updateModule = asyncHandler(async (req, res) => {
  await assertModuleOwner(req);
  const payload = {};
  if (req.body.title !== undefined) payload.title = req.body.title;
  if (req.body.description !== undefined) payload.description = req.body.description;
  if (Array.isArray(req.body.items)) payload.items = req.body.items;
  if (req.body.position !== undefined) payload.position = req.body.position;
  sendSuccess(res, await CourseModule.update(req.params.moduleId, payload), "Learning path module updated");
});

export const deleteModule = asyncHandler(async (req, res) => {
  await assertModuleOwner(req);
  await CourseModule.remove(req.params.moduleId);
  res.status(204).send();
});
