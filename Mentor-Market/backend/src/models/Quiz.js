import { model } from "./modelFactory.js";
export default model("quizzes", ["tutor_id", "title", "subject", "questions", "total_score"], { jsonFields: ["questions"], searchFields: ["title", "subject"] });

