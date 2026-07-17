import { ArrowRight, BadgeCheck, Heart, MapPin, Star } from "lucide-react";
import { Link } from "react-router-dom";
import CourseArtwork from "./CourseArtwork.jsx";
import DemoVideo from "./DemoVideo.jsx";
import UserAvatar from "./UserAvatar.jsx";

const parseSubjects = (subjects) => {
  if (Array.isArray(subjects)) return subjects;
  try { return JSON.parse(subjects || "[]"); } catch { return []; }
};

export default function TutorCard({ tutor, onSave, previewVideo = false }) {
  const subjects = parseSubjects(tutor.subjects);
  const rating = Number(tutor.average_rating || 0);
  const serviceTitle = tutor.featured_service_title || `${subjects[0] || "Tutoring"} lessons`;
  return (
    <article className={`tutor-card ${previewVideo && tutor.demo_video_url ? "has-video-preview" : ""}`}>
      <div className="tutor-card-media">
        <CourseArtwork subject={subjects[0] || "Learning"} />
        {previewVideo && tutor.demo_video_url ? <span className="tutor-preview-signal"><i /> Preview available</span> : null}
        <span className="media-caption"><small>Featured service</small><strong>{serviceTitle}</strong></span>
        <DemoVideo src={tutor.demo_video_url} title={`${tutor.full_name} — ${serviceTitle}`} variant="icon" />
      </div>
      <div className="tutor-card-head">
        <UserAvatar name={tutor.full_name} image={tutor.avatar_url} size="large" />
        <div className="tutor-identity">
          <div className="name-line"><h3>{tutor.full_name}</h3>{tutor.is_verified ? <><BadgeCheck className="verified-icon" size={16} aria-hidden="true" /><span className="sr-only">Verified mentor</span></> : null}</div>
          <p>{tutor.qualifications || "Independent subject tutor"}</p>
        </div>
        {onSave && <button className="card-icon-button" onClick={() => onSave(tutor.user_id)} aria-label={`Save ${tutor.full_name}`}><Heart size={17} /></button>}
      </div>
      <div className="tutor-card-rating"><Star size={14} fill="currentColor" /><strong>{rating ? rating.toFixed(1) : "New"}</strong>{rating > 0 && <span>student rating</span>}</div>
      <div className="tag-row tutor-subjects">{subjects.slice(0, 3).map((subject) => <span className="tag" key={subject}>{subject}</span>)}{subjects.length > 3 && <span className="tag">+{subjects.length - 3}</span>}</div>
      <div className="tutor-card-facts"><span><MapPin size={14} /> {tutor.location || "Remote"}</span><span>{tutor.experience_years || 0} yrs experience</span><span>{tutor.teaching_mode || "Both"}</span></div>
      <div className="card-footer">
        <div className="price-lockup"><small>From</small><strong>৳{Number(tutor.hourly_rate || 0).toLocaleString()} <em>/ hour</em></strong></div>
        <Link className="card-link" to={`/tutors/${tutor.user_id}`}>View profile <ArrowRight size={15} /></Link>
      </div>
    </article>
  );
}
