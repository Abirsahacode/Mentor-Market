import db from "../config/db.js";
import ApiError from "./ApiError.js";

/**
 * Resolve a real, non-cancelled student/tutor relationship. Classroom tools
 * must not accept an arbitrary user ID just because it exists.
 */
export const requireTeachingRelationship = async ({ tutorId, studentId, bookingId }) => {
  const clauses = ["b.tutor_id = ?", "b.status <> 'cancelled'"];
  const values = [tutorId];
  if (bookingId) {
    clauses.push("b.id = ?");
    values.push(bookingId);
  }
  if (studentId) {
    clauses.push("b.student_id = ?");
    values.push(studentId);
  }
  const [[booking]] = await db.query(
    `SELECT b.id, b.student_id, b.tutor_id
     FROM bookings b
     JOIN users student ON student.id = b.student_id
     WHERE ${clauses.join(" AND ")}
       AND student.role = 'student' AND student.is_active = TRUE
     ORDER BY b.class_date DESC, b.class_time DESC
     LIMIT 1`,
    values,
  );
  if (!booking) {
    throw new ApiError(
      422,
      "teaching_relationship_required",
      "Choose a student connected to one of your non-cancelled bookings",
    );
  }
  return booking;
};
