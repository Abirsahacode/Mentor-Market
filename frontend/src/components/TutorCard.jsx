import { AlertCircle, ArrowRight, BadgeCheck, CheckCircle2, Heart, LoaderCircle, MapPin, Star } from "lucide-react";
import { Link } from "react-router-dom";
import CourseArtwork from "./CourseArtwork.jsx";
import DemoVideo from "./DemoVideo.jsx";

const parseSubjects = (subjects) => {
  if (Array.isArray(subjects)) return subjects;
  try { return JSON.parse(subjects || "[]"); } catch { return []; }
};

export default function TutorCard({
  tutor,
  onSave,
  previewVideo = false,
  saveAction = "save",
  saveStatus = "idle",
  saveFeedback = "",
}) {
  const subjects = parseSubjects(tutor.subjects);
  const rating = Number(tutor.average_rating || 0);
  const serviceTitle = tutor.featured_service_title || `${subjects[0] || "Tutoring"} lessons`;
  const isRemoveAction = saveAction === "remove";
  const isPending = saveStatus === "pending";
  const saveCompleted = !isRemoveAction && saveStatus === "success";
  const isSaved = isRemoveAction || saveCompleted;
  const actionLabel = isPending
    ? `${isRemoveAction ? "Removing" : "Saving"} ${tutor.full_name}${isRemoveAction ? " from" : " to"} saved tutors`
    : saveCompleted
      ? `${tutor.full_name} is saved`
      : `${isRemoveAction ? "Remove" : "Save"} ${tutor.full_name} ${isRemoveAction ? "from" : "to"} saved tutors`;
  return (
    <article className={`tutor-card ${previewVideo && tutor.demo_video_url ? "has-video-preview" : ""}`}>
      <div className="tutor-card-media">
        <CourseArtwork subject={subjects[0] || "Learning"} />
        {tutor.avatar_url ? <img className="tutor-card-portrait" src={tutor.avatar_url} alt="" onError={(event) => { event.currentTarget.hidden = true; }} /> : null}
        <span className="tutor-preview-signal"><i /> {previewVideo && tutor.demo_video_url ? "Teaching preview" : subjects[0] || "Independent mentor"}</span>
        <DemoVideo src={tutor.demo_video_url} title={`${tutor.full_name} — ${serviceTitle}`} variant="icon" />
      </div>
      <div className="tutor-card-body">
        <div className="tutor-card-head">
          <div className="tutor-identity">
            <div className="name-line"><h3>{tutor.full_name}</h3>{tutor.is_verified ? <><BadgeCheck className="verified-icon" size={17} aria-hidden="true" /><span className="sr-only">Verified mentor</span></> : null}</div>
            <p>{tutor.qualifications || "Independent subject tutor"}</p>
          </div>
          {onSave && (
            <button
              type="button"
              className={`card-icon-button tutor-save-button${isSaved ? " is-saved" : ""}${isPending ? " is-pending" : ""}`}
              onClick={() => onSave(tutor.user_id)}
              aria-label={actionLabel}
              aria-busy={isPending || undefined}
              disabled={isPending || saveCompleted}
              title={actionLabel}
            >
              {isPending
                ? <LoaderCircle className="tutor-save-spinner" size={19} aria-hidden="true" />
                : <Heart size={19} fill={isSaved ? "currentColor" : "none"} aria-hidden="true" />}
            </button>
          )}
        </div>
        {onSave && saveFeedback ? (
          <p
            className={`tutor-save-feedback is-${saveStatus === "error" ? "error" : "success"}`}
            role={saveStatus === "error" ? "alert" : "status"}
          >
            {saveStatus === "error"
              ? <AlertCircle size={15} aria-hidden="true" />
              : <CheckCircle2 size={15} aria-hidden="true" />}
            <span>{saveFeedback}</span>
          </p>
        ) : null}
        <p className="tutor-card-promise">{serviceTitle}</p>
        <div className="tutor-card-rating"><Star size={15} fill="currentColor" /><strong>{rating ? rating.toFixed(1) : "New"}</strong>{rating > 0 && <span>{tutor.review_count ? `${tutor.review_count} review${tutor.review_count === 1 ? "" : "s"}` : "student rating"}</span>}<span className="tutor-experience">{tutor.experience_years || 0} years teaching</span></div>
        <div className="tag-row tutor-subjects">{subjects.slice(0, 2).map((subject) => <span className="tag" key={subject}>{subject}</span>)}{subjects.length > 2 && <span className="tag">+{subjects.length - 2}</span>}</div>
        <div className="tutor-card-facts"><span><MapPin size={15} /> {tutor.location || "Remote"}</span><span>{tutor.teaching_mode || "Both"}</span></div>
        <div className="card-footer">
          <div className="price-lockup"><small>From</small><strong>৳{Number(tutor.hourly_rate || 0).toLocaleString()} <em>/ hour</em></strong></div>
          <Link className="card-link" to={`/tutors/${tutor.user_id}`}>View profile <ArrowRight size={16} /></Link>
        </div>
      </div>
    </article>
  );
}
