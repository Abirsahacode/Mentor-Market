import db from "../config/db.js";
import TutorPost from "../models/TutorPost.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { getPagination } from "../utils/pagination.js";
import { sendSuccess } from "../utils/respond.js";

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
  const rows = result.rows.map((post) => ({ ...post, tutor: byId[post.tutor_id] }));
  sendSuccess(res, rows, "Tutor posts loaded", 200, { page, limit, total: result.total, pages: Math.ceil(result.total / limit) });
});

export const getPost = asyncHandler(async (req, res) => {
  const post = await TutorPost.findById(req.params.id);
  if (!post) throw new ApiError(404, "post_not_found", "Tutor post was not found");

  // Detail pages need mentor context and social proof. These are two fixed
  // queries regardless of review count, avoiding query-per-review behavior.
  const [[tutorRows], [reviewRows]] = await Promise.all([
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
       LIMIT 4`,
      [post.tutor_id],
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
  sendSuccess(res, await TutorPost.update(req.params.id, req.body), "Tutor post updated");
});

export const deletePost = asyncHandler(async (req, res) => {
  await assertPostOwner(req);
  await TutorPost.remove(req.params.id);
  res.status(204).send();
});
