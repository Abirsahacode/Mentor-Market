import { model } from "./modelFactory.js";
export default model("tutor_posts", ["tutor_id", "title", "subject", "level", "price", "teaching_mode", "location", "availability", "has_trial", "thumbnail_url", "demo_video_url", "description", "status"], { searchFields: ["title", "subject", "description", "location"] });
