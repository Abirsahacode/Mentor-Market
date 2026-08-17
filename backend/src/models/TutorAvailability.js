import { model } from "./modelFactory.js";
import db from "../config/db.js";

const TutorAvailability = model("tutor_availabilities", ["tutor_id", "date", "start_time", "end_time"]);

export const findByTutorAndDateRange = async (tutorId, fromDate, toDate) => {
  const [rows] = await db.query(
    `SELECT * FROM tutor_availabilities
     WHERE tutor_id = ? AND date BETWEEN ? AND ?
     ORDER BY date ASC, start_time ASC`,
    [tutorId, fromDate, toDate],
  );
  return rows;
};

export const findByTutorId = async (tutorId) => {
  const [rows] = await db.query(
    `SELECT * FROM tutor_availabilities
     WHERE tutor_id = ?
     ORDER BY date ASC, start_time ASC`,
    [tutorId],
  );
  return rows;
};

export default TutorAvailability;
