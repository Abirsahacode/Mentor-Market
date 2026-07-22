import { model } from "./modelFactory.js";
export default model("notifications", ["user_id", "title", "message", "type", "is_read"]);

