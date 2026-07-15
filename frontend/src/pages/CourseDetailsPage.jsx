import {
  ArrowLeft, Award, BadgeCheck, BookOpen, CalendarDays, Check, ChevronDown, ChevronUp,
  Clock3, Globe2, Heart, MapPin, MessageCircle, MonitorPlay, Pause, Play, ShieldCheck,
  Sparkles, Star, Users, Video, Volume2, VolumeX, Zap,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api, { getErrorMessage } from "../api/axios.js";
import Alert from "../components/Alert.jsx";
import CourseArtwork from "../components/CourseArtwork.jsx";
import LoadingSpinner from "../components/LoadingSpinner.jsx";
import useAuth from "../hooks/useAuth.js";

const blueprints = [
  {
    matches: ["math", "calculus", "algebra", "geometry", "statistics"],
    outcomes: ["Turn unfamiliar problems into clear, repeatable steps", "Build accuracy through guided practice and feedback", "Recognize the patterns behind common exam questions", "Explain your reasoning with confidence"],
    modules: [
      ["Build the foundation", "Core ideas, notation, and a quick diagnostic", ["Concept map and baseline check", "Worked examples with mentor guidance"]],
      ["Learn the problem patterns", "Methods that make difficult questions predictable", ["Choosing the right method", "Common shortcuts and common mistakes"]],
      ["Practice with purpose", "Mixed exercises with increasing challenge", ["Timed problem set", "Error review and targeted drills"]],
      ["Apply and consolidate", "A complete challenge plus a personal revision plan", ["Exam-style application", "Feedback and next-step roadmap"]],
    ],
  },
  {
    matches: ["physics", "chemistry", "biology", "science"],
    outcomes: ["Connect abstract theory to observable examples", "Use diagrams, equations, and evidence together", "Approach practical and exam questions systematically", "Identify misconceptions before they become habits"],
    modules: [
      ["See the big picture", "Key principles and how they connect", ["Concept map and prior-knowledge check", "Real-world demonstration"]],
      ["Reason like a scientist", "From observations to models and predictions", ["Variables, evidence, and explanation", "Guided numerical or practical problem"]],
      ["Master exam application", "Translate knowledge into strong answers", ["Question-language decoding", "Structured response workshop"]],
      ["Test and strengthen", "Retrieve, review, and close knowledge gaps", ["Mixed-topic challenge", "Personal feedback and revision plan"]],
    ],
  },
  {
    matches: ["english", "ielts", "language", "writing", "speaking"],
    outcomes: ["Communicate ideas with a clearer structure", "Use feedback to improve fluency and accuracy", "Build practical vocabulary for your goals", "Develop a repeatable practice routine"],
    modules: [
      ["Find your current level", "A friendly baseline and goal-setting session", ["Skills diagnostic", "Personal vocabulary and fluency goals"]],
      ["Build confident expression", "Structures for speaking and writing clearly", ["Idea generation and organization", "Model response breakdown"]],
      ["Practice in context", "Realistic prompts with live mentor feedback", ["Guided performance task", "Accuracy and fluency coaching"]],
      ["Perform independently", "A complete simulation and improvement plan", ["Timed practice", "Detailed feedback roadmap"]],
    ],
  },
  {
    matches: ["code", "coding", "programming", "computer", "javascript", "python", "web"],
    outcomes: ["Build a working project instead of only watching tutorials", "Read errors and debug with a practical process", "Break features into small, testable steps", "Explain the decisions behind your code"],
    modules: [
      ["Set up and think in code", "Tools, syntax, and a clear mental model", ["Environment and first working program", "Variables, flow, and debugging basics"]],
      ["Build the core feature", "Turn a requirement into working logic", ["Plan the data and behavior", "Implement alongside your mentor"]],
      ["Make it resilient", "Handle edge cases and improve code quality", ["Debugging workshop", "Refactor and test"]],
      ["Ship a mini project", "Combine the skills into something demonstrable", ["Independent build sprint", "Code review and next steps"]],
    ],
  },
  {
    matches: [],
    outcomes: ["Understand the essential ideas without unnecessary jargon", "Apply each concept through guided practice", "Receive specific feedback on your work", "Leave with a practical plan for continued progress"],
    modules: [
      ["Orient and assess", "Define the goal and establish your starting point", ["Goal-setting conversation", "Core concept walkthrough"]],
      ["Learn by doing", "Move from demonstration to supported practice", ["Mentor-led example", "Guided skill exercise"]],
      ["Build independence", "Apply the skill with less support", ["Real-world challenge", "Feedback and refinement"]],
      ["Consolidate and continue", "Turn today’s progress into a lasting routine", ["Final application", "Personal next-step plan"]],
    ],
  },
];

const findBlueprint = (subject = "") => {
  const normalized = subject.toLowerCase();
  return blueprints.find((item) => item.matches.some((term) => normalized.includes(term))) || blueprints.at(-1);
};

const initials = (name = "Mentor") => name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
const today = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);

export default function CourseDetailsPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const videoRef = useRef(null);
  const viewRecorded = useRef(null);
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [videoProgress, setVideoProgress] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [expandedModule, setExpandedModule] = useState(0);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [bookingStatus, setBookingStatus] = useState({ type: "", message: "" });
  const [booking, setBooking] = useState({ class_type: "trial", class_date: "", class_time: "", mode: "online", duration_minutes: 60 });

  useEffect(() => {
    let active = true;
    viewRecorded.current = null;
    setLoading(true);
    setError("");
    setCourse(null);
    setSaved(false);
    api.get(`/tutor-posts/${id}`)
      .then((response) => { if (active) setCourse(response.data.data); })
      .catch((requestError) => { if (active) setError(getErrorMessage(requestError)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  useEffect(() => {
    if (!course?.id || viewRecorded.current === Number(course.id) || !user) return;
    viewRecorded.current = Number(course.id);
    // Engagement is progressive enhancement: older API versions may not expose this endpoint.
    api.post("/course-engagement/views", { course_id: Number(course.id) }).catch(() => {});
  }, [course?.id, user]);

  useEffect(() => {
    if (!course?.id || user?.role !== "student") return;
    let active = true;
    setSaved(false);
    api.get("/course-engagement/saved")
      .then((response) => {
        if (active) setSaved(response.data.data.some((item) => Number(item.id) === Number(course.id)));
      })
      .catch(() => {});
    return () => { active = false; };
  }, [course?.id, user?.role]);

  useEffect(() => {
    if (!course) return;
    setBooking((current) => ({
      ...current,
      class_type: course.has_trial ? "trial" : "one-time",
      mode: course.teaching_mode === "offline" ? "offline" : "online",
    }));
  }, [course]);

  const tutor = useMemo(() => {
    if (!course) return {};
    return course.tutor || {
      id: course.tutor_id,
      full_name: course.tutor_name || course.tutor_full_name || "Mentor Market tutor",
      avatar_url: course.tutor_avatar_url,
      average_rating: course.average_rating,
      is_verified: course.is_verified,
      experience_years: course.experience_years,
      bio: course.tutor_bio,
    };
  }, [course]);
  const reviews = course?.reviews || tutor.reviews || [];
  const rating = Number(tutor.average_rating || course?.average_rating || 0);
  const blueprint = useMemo(() => findBlueprint(course?.subject), [course?.subject]);
  const classModes = course?.teaching_mode === "both" ? ["online", "offline"] : [course?.teaching_mode || "online"];

  const togglePlayback = async () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      try { await videoRef.current.play(); setPlaying(true); } catch { setPlaying(false); }
    } else { videoRef.current.pause(); setPlaying(false); }
  };
  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setMuted(videoRef.current.muted);
  };
  const updateVideoProgress = () => {
    if (!videoRef.current) return;
    const duration = videoRef.current.duration || 0;
    setVideoDuration(duration);
    setVideoProgress(duration ? (videoRef.current.currentTime / duration) * 100 : 0);
  };
  const changeBooking = (event) => setBooking((current) => ({ ...current, [event.target.name]: event.target.value }));
  const submitBooking = async (event) => {
    event.preventDefault();
    setBookingStatus({ type: "", message: "" });
    if (booking.class_date < today()) {
      setBookingStatus({ type: "error", message: "Choose today or a future date." });
      return;
    }
    setBookingStatus({ type: "loading", message: "Sending your class request…" });
    try {
      await api.post("/bookings", {
        ...booking,
        tutor_id: Number(course.tutor_id || tutor.id),
        tutor_post_id: Number(course.id),
        duration_minutes: Number(booking.duration_minutes),
      });
      setBookingStatus({ type: "success", message: `Your request is with ${tutor.full_name?.split(" ")[0] || "the tutor"}. You’ll see updates in My classes.` });
      setBooking((current) => ({ ...current, class_date: "", class_time: "" }));
    } catch (requestError) {
      setBookingStatus({ type: "error", message: getErrorMessage(requestError) });
    }
  };
  const saveCourse = async () => {
    if (!course.id || saving) return;
    setSaving(true);
    try {
      if (saved) await api.delete(`/course-engagement/saved/${course.id}`);
      else await api.put(`/course-engagement/saved/${course.id}`);
      setSaved((current) => !current);
    } catch (requestError) {
      setBookingStatus({ type: "error", message: getErrorMessage(requestError) });
    } finally { setSaving(false); }
  };

  if (loading) return <div className="cx-state"><LoadingSpinner label="Opening the course studio" /></div>;
  if (error || !course) return <div className="cx-state"><div className="cx-state-card"><Video size={30} /><h1>We couldn’t open this course</h1><Alert>{error || "This course is no longer available."}</Alert><Link className="cx-button cx-button-dark" to="/student/discover"><ArrowLeft size={16} /> Return to discovery</Link></div></div>;

  const tutorName = tutor.full_name || "Mentor Market tutor";
  const price = Number(course.price || 0);

  return <section className="course-experience">
    <nav className="cx-topbar" aria-label="Course navigation">
      <Link to="/student/discover"><ArrowLeft size={17} /> Discover</Link>
      <div><span>Course file {String(course.id).padStart(2, "0")}</span><i /> <span>{course.subject}</span><i /> <span>{course.level}</span></div>
      {user?.role === "student" ? <button type="button" onClick={saveCourse} className={saved ? "is-saved" : ""} disabled={saving}><Heart size={17} fill={saved ? "currentColor" : "none"} /> {saved ? "Saved" : "Save course"}</button> : <span />}
    </nav>

    <nav className="cx-chapter-nav" aria-label="On this course page">
      <span>ON THIS PAGE</span>
      <a href="#course-overview">Overview</a>
      <a href="#course-outcomes">Outcomes</a>
      <a href="#learning-path">Learning path</a>
      <a href="#course-mentor">Mentor</a>
      {reviews.length > 0 && <a href="#course-reviews">Reviews</a>}
    </nav>

    <section className="cx-hero" id="course-overview">
      <div className="cx-media-shell">
        <div className="cx-media">
          <CourseArtwork subject={course.subject} decorative={false} />
          {course.demo_video_url ? <video className={playing ? "is-playing" : ""} ref={videoRef} src={course.demo_video_url} muted loop playsInline preload="metadata" onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onLoadedMetadata={updateVideoProgress} onTimeUpdate={updateVideoProgress} /> : null}
          <div className="cx-media-shade" />
          <div className="cx-media-meta"><span><i /> Preview film</span><span>{course.teaching_mode} / {course.level}</span></div>
          {course.demo_video_url && <div className="cx-video-controls">
            <button type="button" onClick={togglePlayback} aria-label={playing ? "Pause preview" : "Play preview"}>{playing ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}</button>
            <button type="button" onClick={toggleMute} aria-label={muted ? "Unmute preview" : "Mute preview"}>{muted ? <VolumeX size={18} /> : <Volume2 size={18} />}</button>
          </div>}
          <div className="cx-media-caption"><span>Learn with</span><strong>{tutorName}</strong></div>
          {course.demo_video_url && <div className="cx-video-timeline"><span style={{ width: `${videoProgress}%` }} /><small>{videoDuration ? `${Math.ceil(videoDuration)} sec preview` : "Loading film"}</small></div>}
        </div>
        <div className="cx-film-index" aria-hidden="true"><span>MM / COURSE PREVIEW</span><strong>{String(course.id).padStart(2, "0")}</strong></div>
      </div>
      <div className="cx-hero-copy">
        <div className="cx-kicker"><Sparkles size={15} /> Mentor-led course</div>
        <h1>{course.title}</h1>
        <p>{course.description}</p>
        <div className="cx-mentor-line">
          <div className="cx-avatar">{tutor.avatar_url ? <img src={tutor.avatar_url} alt="" /> : initials(tutorName)}</div>
          <div><span>Created by</span><strong>{tutorName} {tutor.is_verified ? <BadgeCheck size={15} aria-label="Verified mentor" /> : null}</strong></div>
          {rating > 0 && <div className="cx-rating"><Star size={15} fill="currentColor" /><strong>{rating.toFixed(1)}</strong><span>({reviews.length || "new"})</span></div>}
        </div>
        <div className="cx-facts">
          <div><Clock3 size={18} /><span><strong>{course.duration_minutes || 60} min</strong> suggested session</span></div>
          <div><Globe2 size={18} /><span><strong>{course.teaching_mode}</strong> class format</span></div>
          <div><BookOpen size={18} /><span><strong>{course.level}</strong> level</span></div>
          <div><Zap size={18} /><span><strong>{course.has_trial ? "Trial available" : "Book directly"}</strong> flexible start</span></div>
        </div>
        <div className="cx-hero-actions">
          <button type="button" className="cx-button cx-button-primary" onClick={() => document.getElementById("course-booking")?.scrollIntoView({ behavior: "smooth", block: "center" })}><CalendarDays size={17} /> {course.has_trial ? "Book a trial" : "Book this course"}</button>
          <a className="cx-button cx-button-soft" href="#learning-path"><BookOpen size={17} /> Explore the lessons</a>
        </div>
      </div>
    </section>

    <section className="cx-content-grid">
      <div className="cx-main-column">
        <section className="cx-section cx-outcomes" id="course-outcomes">
          <div className="cx-section-heading"><span>What you’ll gain</span><h2>Progress you can feel after every class</h2><p>A focused, mentor-led experience shaped around your current level and learning goal.</p></div>
          <div className="cx-outcome-grid">{blueprint.outcomes.map((outcome, index) => <article key={outcome}><span>{String(index + 1).padStart(2, "0")}</span><Check size={18} /><p>{outcome}</p></article>)}</div>
        </section>

        <section className="cx-section cx-curriculum" id="learning-path">
          <div className="cx-section-heading cx-heading-row"><div><span>Suggested learning path</span><h2>From first principles to confident practice</h2></div><p>4 modules · adapted live by your mentor</p></div>
          <div className="cx-module-list">{blueprint.modules.map(([title, description, lessons], index) => {
            const open = expandedModule === index;
            return <article className={open ? "is-open" : ""} key={title}>
              <button type="button" onClick={() => setExpandedModule(open ? -1 : index)} aria-expanded={open}>
                <span className="cx-module-number">{String(index + 1).padStart(2, "0")}</span>
                <span className="cx-module-copy"><small>Module {index + 1}</small><strong>{title}</strong><em>{description}</em></span>
                <span className="cx-module-toggle">{open ? <ChevronUp size={19} /> : <ChevronDown size={19} />}</span>
              </button>
              {open && <div className="cx-lessons">{lessons.map((lesson, lessonIndex) => <div key={lesson}><span><Play size={12} fill="currentColor" /></span><p><small>Lesson {index + 1}.{lessonIndex + 1}</small><strong>{lesson}</strong></p><em>{lessonIndex ? "Practice" : "Guided"}</em></div>)}</div>}
            </article>;
          })}</div>
          <p className="cx-curriculum-note"><Sparkles size={15} /> Your mentor may adjust this path after learning about your goals and starting point.</p>
        </section>

        <section className="cx-section cx-mentor-card" id="course-mentor">
          <div className="cx-mentor-portrait">{tutor.avatar_url ? <img src={tutor.avatar_url} alt={tutorName} /> : <span>{initials(tutorName)}</span>}<i><Video size={14} /> Video mentor</i></div>
          <div className="cx-mentor-copy"><span>Meet your mentor</span><h2>{tutorName} {tutor.is_verified ? <BadgeCheck size={20} /> : null}</h2><p>{tutor.bio || course.tutor_bio || `${tutorName} teaches ${course.subject} through clear explanations, active practice, and specific feedback.`}</p><div className="cx-mentor-stats"><span><Award size={17} /><strong>{tutor.experience_years || course.experience_years || "Experienced"}</strong><small>{Number(tutor.experience_years || course.experience_years) ? "years teaching" : "mentor"}</small></span><span><Star size={17} /><strong>{rating ? rating.toFixed(1) : "New"}</strong><small>mentor rating</small></span><span><MapPin size={17} /><strong>{tutor.location || course.location || "Online"}</strong><small>based in</small></span></div><div className="cx-mentor-links"><Link to={`/tutors/${course.tutor_id || tutor.id}`}>View full profile</Link>{user?.role === "student" && <Link to="/student/messages"><MessageCircle size={15} /> Start a conversation</Link>}</div></div>
        </section>

        {reviews.length > 0 && <section className="cx-section cx-reviews" id="course-reviews"><div className="cx-section-heading cx-heading-row"><div><span>Student voices</span><h2>How learning with {tutorName.split(" ")[0]} feels</h2></div><div className="cx-review-score"><Star size={18} fill="currentColor" /><strong>{rating.toFixed(1)}</strong></div></div><div className="cx-review-grid">{reviews.slice(0, 3).map((review, index) => { const reviewerName = review.reviewer_name || review.reviewer?.full_name || "Verified student"; return <blockquote key={review.id || index}><span>{"★".repeat(Number(review.rating || 5))}</span><p>“{review.comment || "A focused, encouraging learning experience."}”</p><footer><div>{initials(reviewerName)}</div><strong>{reviewerName}</strong></footer></blockquote>; })}</div></section>}
      </div>

      <aside className="cx-booking-column" id="course-booking">
        <div className="cx-booking-card">
          <div className="cx-price"><span>{course.has_trial ? "Try it, then decide" : "Reserve your class"}</span><div><strong>৳{price.toLocaleString()}</strong><small>/ session</small></div></div>
          {course.has_trial && <div className="cx-trial-banner"><Zap size={16} fill="currentColor" /><span><strong>Trial class available</strong><small>Meet your mentor and align on a plan.</small></span></div>}
          {user?.role === "student" ? <form onSubmit={submitBooking}>
            <Alert type={bookingStatus.type === "success" ? "success" : "error"}>{bookingStatus.type !== "loading" ? bookingStatus.message : ""}</Alert>
            <label><span>Class type</span><select name="class_type" value={booking.class_type} onChange={changeBooking}>{course.has_trial && <option value="trial">Trial class</option>}<option value="one-time">One-time class</option><option value="weekly">Weekly classes</option><option value="monthly">Monthly plan</option></select></label>
            <div className="cx-form-row"><label><span>Date</span><input name="class_date" type="date" min={today()} value={booking.class_date} onChange={changeBooking} required /></label><label><span>Time</span><input name="class_time" type="time" value={booking.class_time} onChange={changeBooking} required /></label></div>
            <div className="cx-form-row"><label><span>Format</span><select name="mode" value={booking.mode} onChange={changeBooking}>{classModes.map((mode) => <option value={mode} key={mode}>{mode[0].toUpperCase() + mode.slice(1)}</option>)}</select></label><label><span>Duration</span><select name="duration_minutes" value={booking.duration_minutes} onChange={changeBooking}><option value="30">30 minutes</option><option value="60">60 minutes</option><option value="90">90 minutes</option><option value="120">2 hours</option></select></label></div>
            <button className="cx-button cx-button-primary cx-button-wide" disabled={bookingStatus.type === "loading"}>{bookingStatus.type === "loading" ? "Sending request…" : <><CalendarDays size={17} /> Request this class</>}</button>
            <p className="cx-booking-fineprint">No charge today. The tutor confirms your request before a mock payment is created.</p>
          </form> : <div className="cx-login-prompt"><p>Log in with a student account to choose a time and request this class.</p><Link className="cx-button cx-button-primary cx-button-wide" to="/login">Log in to book</Link></div>}
          <div className="cx-booking-trust"><span><ShieldCheck size={16} /><p><strong>Book with confidence</strong><small>Marketplace reporting and admin support</small></p></span><span><CalendarDays size={16} /><p><strong>Flexible scheduling</strong><small>Manage requests from My classes</small></p></span><span><Users size={16} /><p><strong>Human, 1-to-1 support</strong><small>A plan shaped around your pace</small></p></span></div>
        </div>
      </aside>
    </section>
  </section>;
}
