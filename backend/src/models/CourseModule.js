import { model } from "./modelFactory.js";
export default model("course_modules", ["tutor_post_id", "title", "description", "items", "position"], { jsonFields: ["items"] });
