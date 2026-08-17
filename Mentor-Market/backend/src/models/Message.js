import { model } from "./modelFactory.js";
export default model("messages", ["sender_id", "receiver_id", "booking_id", "content", "is_read", "is_reported"]);

