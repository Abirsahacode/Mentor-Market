import { ArrowRight, Clock3, MapPin } from "lucide-react";
import UserAvatar from "./UserAvatar.jsx";

export default function RequestCard({ request, action }) {
  const studentName = request.student?.full_name || request.student_name || "Student";
  return (
    <article className="request-card">
      <div className="request-card-head"><span className={`status-badge status-${request.status}`}>{request.status}</span><span className="request-date">#{String(request.id || "").padStart(3, "0")}</span></div>
      <div className="request-title"><span>{request.subject}</span><h3>{request.class_level}</h3></div>
      <p className="request-description line-clamp">{request.description}</p>
      <div className="request-card-facts"><span><MapPin size={14} /> {request.location || "Remote"}</span><span>{request.teaching_mode}</span><span><Clock3 size={14} /> {request.preferred_time}</span></div>
      <div className="request-bottom">
        <div className="request-author"><UserAvatar name={studentName} size="tiny" /><span><small>Posted by</small><strong>{studentName}</strong></span></div>
        <div className="request-price"><small>Budget</small><strong>৳{Number(request.budget || 0).toLocaleString()}</strong></div>
        {action || <ArrowRight className="request-arrow" size={17} />}
      </div>
    </article>
  );
}
