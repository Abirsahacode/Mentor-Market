import {
  ArrowUpRight, BadgeCheck, Bookmark, Check, MonitorPlay, Plus, Star,
} from "lucide-react";
import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import CourseArtwork from "./CourseArtwork.jsx";
import DemoVideo from "./DemoVideo.jsx";
import UserAvatar from "./UserAvatar.jsx";

const formats = ["portrait", "landscape", "standard", "portrait", "standard", "landscape"];
const tones = ["jade", "azure", "graphite"];

export default function CoursePin({ course, index = 0, saved = false, compared = false, onToggleSave, onToggleCompare }) {
  const mediaRef = useRef(null);
  const previewRef = useRef(null);
  const [previewing, setPreviewing] = useState(false);
  const tutor = course.tutor || {};
  const rating = Number(tutor.average_rating || 0);
  const format = formats[index % formats.length];
  const tone = tones[index % tones.length];
  const coursePath = `/student/courses/${course.id}`;

  const beginPreview = () => {
    if (!previewRef.current || !course.demo_video_url) return;
    previewRef.current.play().then(() => setPreviewing(true)).catch(() => {});
  };

  const endPreview = () => {
    if (!previewRef.current) return;
    previewRef.current.pause();
    previewRef.current.currentTime = 0;
    setPreviewing(false);
  };

  return (
    <article
      className={`course-pin course-pin-${format} course-pin-${tone}`}
      style={{ "--pin-delay": `${Math.min(index, 10) * 35}ms` }}
    >
      <div
        ref={mediaRef}
        className={`course-pin-media ${previewing ? "is-previewing" : ""}`}
        onPointerEnter={beginPreview}
        onPointerLeave={endPreview}
        onFocusCapture={beginPreview}
        onBlurCapture={(event) => {
          if (!mediaRef.current?.contains(event.relatedTarget)) endPreview();
        }}
      >
        <CourseArtwork subject={course.subject} />
        {course.demo_video_url && (
          <video
            ref={previewRef}
            src={course.demo_video_url}
            muted
            loop
            playsInline
            preload="none"
            aria-hidden="true"
          />
        )}
        <div className="course-pin-wash" />

        <div className="course-pin-media-top">
          <span className="course-pin-subject">{course.subject}</span>
          <button
            className={`course-pin-save ${saved ? "is-saved" : ""}`}
            type="button"
            onClick={() => onToggleSave?.(course)}
            aria-label={saved ? `Remove ${course.title} from saved courses` : `Save ${course.title}`}
          >
            <Bookmark size={17} fill={saved ? "currentColor" : "none"} />
          </button>
        </div>

        <DemoVideo
          src={course.demo_video_url}
          title={`${tutor.full_name || "Tutor"} — ${course.title}`}
          label="Watch preview"
          variant="icon"
        />

        <div className="course-pin-media-meta">
          <span className={previewing ? "is-live" : ""}>
            <MonitorPlay size={13} /> {previewing ? "Playing preview" : "Watch preview"}
          </span>
          <span>Short teaching preview</span>
        </div>
      </div>

      <div className="course-pin-body">
        <div className="course-pin-flags">
          <span>{String(index + 1).padStart(2, "0")} / {course.level}</span>
          {onToggleCompare ? (
            <button
              type="button"
              className={compared ? "is-compared" : ""}
              onClick={() => onToggleCompare(course)}
            >
              {compared ? <Check size={13} /> : <Plus size={13} />}
              {compared ? "In comparison" : "Compare"}
            </button>
          ) : course.has_trial ? <b>Trial available</b> : null}
        </div>

        <Link className="course-pin-title" to={coursePath}>
          {course.title}<ArrowUpRight size={17} />
        </Link>
        <p>{course.description}</p>

        <div className="course-pin-tutor">
          <UserAvatar name={tutor.full_name || "Tutor"} image={tutor.avatar_url} size="tiny" />
          <div>
            <span>
              {tutor.full_name || "Mentor"}
              {tutor.is_verified ? <BadgeCheck size={14} aria-label="Verified mentor" /> : null}
            </span>
            <small>
              {rating ? <><Star size={12} fill="currentColor" /> {rating.toFixed(1)}</> : "New mentor"}
              <i /> {course.teaching_mode}
            </small>
          </div>
          <strong>৳{Number(course.price || 0).toLocaleString()}<small>per class</small></strong>
        </div>
      </div>
    </article>
  );
}
