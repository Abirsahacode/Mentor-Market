import { model } from "./modelFactory.js";
export default model("student_requests", ["student_id", "subject", "class_level", "budget", "location", "teaching_mode", "preferred_time", "required_experience", "description", "status"], { searchFields: ["subject", "class_level", "description", "location"] });

