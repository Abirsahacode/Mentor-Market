import db from "../config/db.js";

const courseColumns = `
  tp.*,
  u.full_name AS tutor_name,
  u.avatar_url AS tutor_avatar_url,
  profile.qualifications AS tutor_qualifications,
  profile.experience_years AS tutor_experience_years,
  profile.location AS tutor_location,
  profile.bio AS tutor_bio,
  profile.average_rating AS tutor_average_rating,
  profile.is_verified AS tutor_is_verified`;

const courseJoins = `
  JOIN tutor_posts tp ON tp.id = source.course_id
  JOIN users u ON u.id = tp.tutor_id
  JOIN tutor_profiles profile ON profile.user_id = tp.tutor_id`;

const shapeCourse = (row) => {
  const {
    tutor_name,
    tutor_avatar_url,
    tutor_qualifications,
    tutor_experience_years,
    tutor_location,
    tutor_bio,
    tutor_average_rating,
    tutor_is_verified,
    ...course
  } = row;

  return {
    ...course,
    is_saved: Boolean(row.is_saved ?? row.saved_at),
    tutor: {
      id: row.tutor_id,
      full_name: tutor_name,
      avatar_url: tutor_avatar_url,
      qualifications: tutor_qualifications,
      experience_years: tutor_experience_years,
      location: tutor_location,
      bio: tutor_bio,
      average_rating: tutor_average_rating,
      is_verified: Boolean(tutor_is_verified),
    },
  };
};

const CourseEngagement = {
  async listSaved(studentId) {
    const [rows] = await db.query(
      `SELECT ${courseColumns}, source.created_at AS saved_at, TRUE AS is_saved
       FROM saved_courses source
       ${courseJoins}
       WHERE source.student_id = ? AND tp.status = 'active'
       ORDER BY source.created_at DESC`,
      [studentId],
    );
    return rows.map(shapeCourse);
  },

  async getSaved(studentId, courseId) {
    const [rows] = await db.query(
      `SELECT ${courseColumns}, source.created_at AS saved_at, TRUE AS is_saved
       FROM saved_courses source
       ${courseJoins}
       WHERE source.student_id = ? AND source.course_id = ? AND tp.status = 'active'
       LIMIT 1`,
      [studentId, courseId],
    );
    return rows[0] ? shapeCourse(rows[0]) : null;
  },

  async save(studentId, courseId) {
    // INSERT ... SELECT prevents bookmarks for missing or inactive courses.
    await db.query(
      `INSERT IGNORE INTO saved_courses (student_id, course_id)
       SELECT ?, id FROM tutor_posts WHERE id = ? AND status = 'active'`,
      [studentId, courseId],
    );
    return this.getSaved(studentId, courseId);
  },

  async removeSaved(studentId, courseId) {
    await db.query(
      "DELETE FROM saved_courses WHERE student_id = ? AND course_id = ?",
      [studentId, courseId],
    );
  },

  async recordView(studentId, courseId) {
    const [result] = await db.query(
      `INSERT INTO course_views (student_id, course_id)
       SELECT ?, id FROM tutor_posts WHERE id = ? AND status = 'active'
       ON DUPLICATE KEY UPDATE
         view_count = course_views.view_count + 1,
         last_viewed_at = CURRENT_TIMESTAMP`,
      [studentId, courseId],
    );
    if (!result.affectedRows) return null;

    const [rows] = await db.query(
      `SELECT ${courseColumns}, source.view_count, source.first_viewed_at,
         source.last_viewed_at, (saved.course_id IS NOT NULL) AS is_saved
       FROM course_views source
       ${courseJoins}
       LEFT JOIN saved_courses saved
         ON saved.student_id = source.student_id AND saved.course_id = source.course_id
       WHERE source.student_id = ? AND source.course_id = ? AND tp.status = 'active'
       LIMIT 1`,
      [studentId, courseId],
    );
    return rows[0] ? shapeCourse(rows[0]) : null;
  },

  async listRecent(studentId, limit) {
    const [rows] = await db.query(
      `SELECT ${courseColumns}, source.view_count, source.first_viewed_at,
         source.last_viewed_at, (saved.course_id IS NOT NULL) AS is_saved
       FROM course_views source
       ${courseJoins}
       LEFT JOIN saved_courses saved
         ON saved.student_id = source.student_id AND saved.course_id = source.course_id
       WHERE source.student_id = ? AND tp.status = 'active'
       ORDER BY source.last_viewed_at DESC
       LIMIT ?`,
      [studentId, Number(limit)],
    );
    return rows.map(shapeCourse);
  },
};

export default CourseEngagement;
