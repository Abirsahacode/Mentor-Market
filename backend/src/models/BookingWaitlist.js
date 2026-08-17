import { model } from "./modelFactory.js";
import db from "../config/db.js";

const BookingWaitlist = model("booking_waitlists", [
  "student_id", "tutor_id", "class_date", "class_time", "status",
]);

export const findByTutorId = async (tutorId) => {
  const [rows] = await db.query(
    `SELECT w.*, 
            student.full_name AS student_name, 
            student.email AS student_email, 
            student.phone AS student_phone,
            student.avatar_url AS student_avatar
     FROM booking_waitlists w
     JOIN users student ON student.id = w.student_id
     WHERE w.tutor_id = ?
     ORDER BY w.class_date ASC, w.class_time ASC, w.created_at ASC`,
    [tutorId],
  );
  return rows;
};

export const findByStudentId = async (studentId) => {
  const [rows] = await db.query(
    `SELECT w.*, 
            tutor.full_name AS tutor_name, 
            tutor.avatar_url AS tutor_avatar
     FROM booking_waitlists w
     JOIN users tutor ON tutor.id = w.tutor_id
     WHERE w.student_id = ?
     ORDER BY w.class_date ASC, w.class_time ASC`,
    [studentId],
  );
  return rows;
};

export const findByStudentAndSlot = async (studentId, tutorId, classDate, classTime) => {
  const [[entry]] = await db.query(
    `SELECT * FROM booking_waitlists
     WHERE student_id = ? AND tutor_id = ? AND class_date = ? AND DATE_FORMAT(class_time, '%H:%i') = ?
       AND status IN ('waiting', 'notified') LIMIT 1`,
    [studentId, tutorId, classDate, classTime],
  );
  return entry || null;
};

export default BookingWaitlist;
