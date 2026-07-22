import { model } from "./modelFactory.js";
export default model("bookings", ["student_id", "tutor_id", "tutor_post_id", "student_request_id", "class_type", "class_date", "class_time", "duration_minutes", "mode", "meeting_link_or_location", "status"]);

