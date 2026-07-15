import { model } from "./modelFactory.js";
export default model("study_materials", ["tutor_id", "student_id", "booking_id", "title", "description", "file_url", "subject"], { searchFields: ["title", "subject", "description"] });

