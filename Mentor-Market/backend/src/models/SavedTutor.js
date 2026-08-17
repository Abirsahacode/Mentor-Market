import db from "../config/db.js";

const SavedTutor = {
  async list(studentId) {
    const [rows] = await db.query(
      `SELECT st.created_at, tp.*, u.full_name, u.avatar_url
       FROM saved_tutors st JOIN tutor_profiles tp ON tp.user_id = st.tutor_id
       JOIN users u ON u.id = st.tutor_id WHERE st.student_id = ? ORDER BY st.created_at DESC`,
      [studentId],
    );
    return rows;
  },
  async save(studentId, tutorId) {
    await db.query("INSERT IGNORE INTO saved_tutors (student_id, tutor_id) VALUES (?, ?)", [studentId, tutorId]);
  },
  async remove(studentId, tutorId) {
    await db.query("DELETE FROM saved_tutors WHERE student_id = ? AND tutor_id = ?", [studentId, tutorId]);
  },
};
export default SavedTutor;

