import { model } from "./modelFactory.js";
export default model("assignments", ["title", "description", "deadline", "student_id", "tutor_id", "submission_text", "submission_file_url", "status", "marks", "feedback", "submitted_at", "graded_at"], { searchFields: ["title", "description"] });

