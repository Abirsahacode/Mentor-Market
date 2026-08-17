import { model } from "./modelFactory.js";
import db from "../config/db.js";

const RescheduleRequest = model("reschedule_requests", [
  "booking_id", "requested_by_id", "requested_to_id", "new_date", "new_time", "reason", "status",
]);

export const findPendingByBookingId = async (bookingId) => {
  const [[request]] = await db.query(
    `SELECT r.*, 
            req_by.full_name AS requested_by_name,
            req_to.full_name AS requested_to_name
     FROM reschedule_requests r
     JOIN users req_by ON req_by.id = r.requested_by_id
     JOIN users req_to ON req_to.id = r.requested_to_id
     WHERE r.booking_id = ? AND r.status = 'pending' LIMIT 1`,
    [bookingId],
  );
  return request || null;
};

export const findByBookingId = async (bookingId) => {
  const [rows] = await db.query(
    `SELECT r.*, 
            req_by.full_name AS requested_by_name,
            req_to.full_name AS requested_to_name
     FROM reschedule_requests r
     JOIN users req_by ON req_by.id = r.requested_by_id
     JOIN users req_to ON req_to.id = r.requested_to_id
     WHERE r.booking_id = ?
     ORDER BY r.created_at DESC`,
    [bookingId],
  );
  return rows;
};

export const findPendingForUser = async (userId) => {
  const [rows] = await db.query(
    `SELECT r.*, b.class_type, b.mode,
            req_by.full_name AS requested_by_name
     FROM reschedule_requests r
     JOIN bookings b ON b.id = r.booking_id
     JOIN users req_by ON req_by.id = r.requested_by_id
     WHERE r.requested_to_id = ? AND r.status = 'pending'
     ORDER BY r.created_at DESC`,
    [userId],
  );
  return rows;
};

export default RescheduleRequest;
