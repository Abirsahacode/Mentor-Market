import {
  ArrowLeft, BadgeCheck, BookOpenCheck, CalendarCheck2, Check, Clock3, Heart, MapPin,
  MessageCircle, MonitorPlay, ShieldCheck, Sparkles, Star,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import api, { getErrorMessage } from "../../api/axios.js";
import Alert from "../../components/Alert.jsx";
import AmbientVideo from "../../components/AmbientVideo.jsx";
import DemoVideo from "../../components/DemoVideo.jsx";
import FormField from "../../components/FormField.jsx";
import LoadingSpinner from "../../components/LoadingSpinner.jsx";
import UserAvatar from "../../components/UserAvatar.jsx";
import useApi from "../../hooks/useApi.js";
import useAuth from "../../hooks/useAuth.js";
import useReducedMotion from "../../hooks/useReducedMotion.js";
import { roleHome } from "../../utils/roleHome.js";

const parseSubjects = (value) => {
  if (Array.isArray(value)) return value;
  try { return JSON.parse(value || "[]"); } catch { return []; }
};
const today = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
const addDays = (value, days) => {
  const date = new Date(`${value}T12:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
};

export default function TutorDetailsPage() {
  const { id } = useParams();
  const location = useLocation();
  const { user } = useAuth();
  const reducedMotion = useReducedMotion();
  const { data: tutor, loading, error } = useApi(`/tutors/${id}`, null);
  const [feedback, setFeedback] = useState("");
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [booking, setBooking] = useState({ class_type: "one-time", class_date: "", class_time: "", mode: "online", duration_minutes: 60, meeting_link_or_location: "" });
  const [availabilitySlots, setAvailabilitySlots] = useState([]);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [availabilityError, setAvailabilityError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [saving, setSaving] = useState(false);

  const posts = Array.isArray(tutor?.posts) ? tutor.posts : [];
  const reviews = Array.isArray(tutor?.reviews) ? tutor.reviews : [];
  const change = (event) => {
    const { name, value } = event.target;
    setBooking((current) => ({
      ...current,
      [name]: value,
      ...(name === "class_date" ? { class_time: "" } : {}),
    }));
  };
  useEffect(() => {
    if (!posts.length) {
      setSelectedPostId(null);
      return;
    }
    const selected = posts.find((post) => post.demo_video_url) || posts[0];
    setSelectedPostId((current) => posts.some((post) => post.id === current) ? current : selected.id);
    setBooking((current) => ({
      ...current,
      class_type: selected.has_trial ? "trial" : "one-time",
      mode: selected.teaching_mode === "offline" ? "offline" : "online",
    }));
  }, [posts]);
  const book = async (event) => {
    event.preventDefault(); setFeedback(""); setSubmitting(true);
    try { await api.post("/bookings", { ...booking, tutor_id: Number(id), tutor_post_id: selectedPostId }); setFeedback("Booking request sent successfully."); }
    catch (requestError) { setFeedback(getErrorMessage(requestError)); }
    finally { setSubmitting(false); }
  };
  const save = async () => { setSaving(true); try { await api.post(`/students/saved-tutors/${id}`); setFeedback("Tutor saved to your favorites."); } catch (requestError) { setFeedback(getErrorMessage(requestError)); } finally { setSaving(false); } };

  useEffect(() => {
    if (!booking.class_date) {
      setBooking((current) => ({ ...current, class_date: today() }));
      setAvailabilitySlots([]);
      return;
    }
    const loadAvailability = async () => {
      setAvailabilityLoading(true);
      setAvailabilityError("");
      try {
        const response = await api.get("/bookings/availability", { params: { tutor_id: Number(id), from_date: booking.class_date, to_date: addDays(booking.class_date, 14) } });
        const slots = response.data.data || [];
        const requestedDateSlots = slots.filter((slot) => slot.date === booking.class_date);
        if (!requestedDateSlots.length && slots.length) {
          const nextDate = slots[0].date;
          setBooking((current) => current.class_date === booking.class_date ? { ...current, class_date: nextDate, class_time: "" } : current);
          setAvailabilitySlots(slots.filter((slot) => slot.date === nextDate));
          return;
        }
        setAvailabilitySlots(slots);
      } catch {
        setAvailabilitySlots([]);
        setAvailabilityError("Availability could not be checked right now. Try another date or message the mentor.");
      } finally {
        setAvailabilityLoading(false);
      }
    };
    loadAvailability();
  }, [booking.class_date, id]);

  if (loading) return <main className="center-page"><LoadingSpinner label="Preparing mentor profile" /></main>;
  if (error || !tutor) return <main className="center-page"><Alert>{error || "Tutor not found"}</Alert></main>;
  const subjects = parseSubjects(tutor.subjects);
  const rating = Number(tutor.average_rating || 0);
  const featuredService = posts.find((post) => post.demo_video_url) || posts[0];
  const selectedService = posts.find((post) => post.id === selectedPostId) || featuredService;
  const isStudent = user?.role === "student";
  const firstName = String(tutor.full_name || "Mentor").split(" ")[0];
  const returnState = { from: { pathname: location.pathname, search: location.search, hash: "#book" } };
  const messagePath = `/student/messages?recipient=${id}&name=${encodeURIComponent(tutor.full_name)}`;
  const classModes = selectedService?.teaching_mode === "both" ? ["online", "offline"] : [selectedService?.teaching_mode || (tutor.teaching_mode === "offline" ? "offline" : "online")];
  const classTypes = [...(selectedService?.has_trial ? ["trial"] : []), "one-time", "weekly", "monthly"];
  const selectedDateSlots = availabilitySlots.filter((slot) => slot.date === booking.class_date);
  const chooseService = (post) => {
    setSelectedPostId(post.id);
    setBooking((current) => ({ ...current, class_type: post.has_trial ? "trial" : "one-time", mode: post.teaching_mode === "offline" ? "offline" : "online" }));
    window.requestAnimationFrame(() => document.getElementById("book")?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "center" }));
  };

  return <main className="tutor-profile-page">
    <section className="profile-cover">
      <div className="container">
        <Link className="profile-back" to="/tutors"><ArrowLeft size={15} /> Back to mentor directory</Link>
        <div className="profile-cinema">
          <div className="profile-cinema-media">
            {featuredService?.demo_video_url ? <AmbientVideo src={featuredService.demo_video_url} poster={featuredService.thumbnail_url} label={`${tutor.full_name} teaching preview`} /> : <img src={featuredService?.thumbnail_url || "/media/math-studio.svg"} alt="" />}
            <span className="profile-preview-label"><i /> Teaching preview</span>
            <DemoVideo src={featuredService?.demo_video_url} poster={featuredService?.thumbnail_url} title={`${tutor.full_name} — ${featuredService?.title || "Demo lesson"}`} variant="icon" />
            <div className="profile-cinema-caption"><small>Featured class</small><strong>{featuredService?.title || `${subjects[0] || "Subject"} mentoring`}</strong><span>{featuredService?.level || tutor.qualifications}</span></div>
          </div>
          <div className="profile-summary">
            <div className="profile-identity-top"><UserAvatar name={tutor.full_name} image={tutor.avatar_url} size="profile" verified={Boolean(tutor.is_verified)} /><div className="profile-labels"><span className="hero-kicker">Independent mentor</span>{tutor.is_verified ? <span className="verified-badge"><BadgeCheck size={15} /> Verified</span> : null}</div></div>
            <div className="profile-summary-main"><h1>{tutor.full_name}</h1><p>{tutor.qualifications || "Independent subject tutor"}</p><div className="profile-subject-line">{subjects.slice(0, 3).map((subject) => <span key={subject}>{subject}</span>)}</div><div className="profile-hero-rate"><span>Private classes from</span><strong>৳{Number(featuredService?.price || tutor.hourly_rate || 0).toLocaleString()} <small>/ session</small></strong></div></div>
            <div className="profile-highlights"><span><Star size={17} fill="currentColor" /><b>{rating ? rating.toFixed(1) : "New"}</b><small>{rating ? "student rating" : "No reviews yet"}</small></span><span><Clock3 size={17} /><b>{tutor.experience_years} years</b><small>experience</small></span><span><MapPin size={17} /><b>{tutor.location || "Remote"}</b><small>location</small></span><span><MonitorPlay size={17} /><b>{tutor.teaching_mode}</b><small>teaching mode</small></span></div>
            <div className="profile-cover-actions">{isStudent ? <><button className="button button-ghost" type="button" onClick={save} disabled={saving}><Heart size={16} /> {saving ? "Saving…" : "Save mentor"}</button><Link className="button button-ghost" to={messagePath}><MessageCircle size={16} /> Message mentor</Link><a className="button" href="#book">Request a class</a></> : !user ? <><Link className="button button-ghost" to="/login" state={returnState}><Heart size={16} /> Log in to save</Link><a className="button" href="#book">Request a class</a></> : <Link className="button" to={roleHome(user.role)}>Return to your workspace</Link>}</div>
          </div>
        </div>
        <div className="profile-proof-strip"><span><ShieldCheck size={17} /><strong>Profile context</strong><small>Credentials and verification status shown clearly</small></span><span><MonitorPlay size={17} /><strong>See how they teach</strong><small>Watch the class preview before reaching out</small></span><span><CalendarCheck2 size={17} /><strong>Flexible booking</strong><small>Request trial or regular sessions</small></span></div>
      </div>
    </section>
    <div className="profile-subnav"><div className="container"><a href="#about">About</a><a href="#services">Classes</a><a href="#reviews">Reviews</a><span><i /> {tutor.availability || "Contact for current availability"}</span></div></div>
    <section className="container tutor-detail-grid"><div className="profile-panel">
      <article className="profile-section" id="about"><span className="section-mini-label">Meet your mentor</span><h2>About {firstName}</h2><p className="profile-bio">{tutor.bio || "This tutor has not added a biography yet."}</p><div className="profile-about-grid"><div><small>Subjects</small><div className="tag-row profile-subjects">{subjects.map((subject) => <span className="tag" key={subject}>{subject}</span>)}</div></div><div><small>Working style</small><p>{tutor.teaching_mode === "online" ? "Remote classes with a schedule arranged together." : tutor.teaching_mode === "offline" ? "In-person teaching in the listed location." : "Available for both online and in-person teaching."}</p></div></div></article>
      <article className="profile-section" id="services"><div className="profile-section-heading"><div><span className="section-mini-label">Choose a starting point</span><h2>Available classes</h2></div><span>{posts.length} active</span></div>{posts.length ? <div className="service-list">{posts.map((post, index) => <article className={selectedPostId === post.id ? "service-row selected" : "service-row"} key={post.id}><span className="service-index">{String(index + 1).padStart(2, "0")}</span><span className="service-thumb"><BookOpenCheck size={20} />{post.thumbnail_url ? <img src={post.thumbnail_url} alt="" onError={(event) => { event.currentTarget.hidden = true; }} /> : null}</span><div className="service-copy"><div><strong>{post.title}</strong>{post.has_trial ? <span>Trial available</span> : null}</div><p>{post.description}</p><small><MonitorPlay size={14} /> {post.teaching_mode} · {post.level} · {post.availability}</small><DemoVideo src={post.demo_video_url} poster={post.thumbnail_url} title={`${tutor.full_name} — ${post.title}`} label="Watch class preview" variant="text" /></div><div className="service-price"><strong>৳{Number(post.price).toLocaleString()}</strong><small>per session</small><button type="button" aria-pressed={selectedPostId === post.id} onClick={() => chooseService(post)}>{selectedPostId === post.id ? "Selected" : "Choose class"}</button></div></article>)}</div> : <p className="muted">No active services.</p>}</article>
      <article className="profile-section" id="reviews"><div className="profile-section-heading"><div><span className="section-mini-label">From past classes</span><h2>Student reviews</h2></div><div className="review-summary"><Star size={17} fill="currentColor" /><strong>{rating ? rating.toFixed(1) : "New"}</strong><small>{reviews.length ? `${reviews.length} review${reviews.length === 1 ? "" : "s"}` : "No reviews yet"}</small></div></div>{reviews.length ? <div className="review-grid">{reviews.map((review) => <blockquote key={review.id}><span className="proof-stars">{"★".repeat(review.rating)}</span><p>“{review.comment}”</p><div><UserAvatar name={review.reviewer_name} size="tiny" /><small>{review.reviewer_name}</small></div></blockquote>)}</div> : <p className="muted">No reviews yet.</p>}</article>
    </div>
    <aside className="booking-panel" id="book">
      <div className="booking-card">
        <div className="booking-card-head">
          <span>{selectedService ? "Selected class" : "Private classes from"}</span>
          {selectedService ? <p className="booking-selected-title">{selectedService.title}</p> : null}
          <h2>৳{Number(selectedService?.price || tutor.hourly_rate || 0).toLocaleString()} <small>/ session</small></h2>
          <div><Star size={14} fill="currentColor" /> {rating ? rating.toFixed(1) : "New"} <span>·</span> {tutor.experience_years || 0} years teaching</div>
        </div>
        {isStudent ? (
          <>
            <Alert type={feedback.includes("success") || feedback.includes("saved") ? "success" : "error"}>{feedback}</Alert>
            <form onSubmit={book}>
              <FormField label="Class type" name="class_type" value={booking.class_type} onChange={change} options={classTypes} required />
              <div className="booking-form-row">
                <FormField label="Date" name="class_date" type="date" min={today()} value={booking.class_date} onChange={change} required />
                <label className="form-field" htmlFor="class_time">
                  <span>Time</span>
                  <select id="class_time" name="class_time" value={booking.class_time} onChange={change} required disabled={!booking.class_date || availabilityLoading}>
                    {booking.class_date ? <option value="">{availabilityLoading ? "Loading slots…" : "Choose a time"}</option> : <option value="">Pick a date first</option>}
                    {selectedDateSlots.map((slot) => <option value={slot.time} key={slot.label}>{slot.time}</option>)}
                  </select>
                </label>
              </div>
              <p className={`booking-footnote${availabilityError ? " is-error" : ""}`}>{availabilityError || (booking.class_date && !availabilityLoading && !selectedDateSlots.length ? "No calendar slots are open for this date yet. Pick another day." : "Times come from the tutor’s calendar and booked sessions.")}</p>
              <p className="booking-footnote">Share a live-session link for online classes so both sides can join quickly.</p>
              <FormField label="Teaching mode" name="mode" value={booking.mode} onChange={change} options={classModes} required />
              {booking.mode === "online" ? <FormField label="Join link / class video" name="meeting_link_or_location" type="url" value={booking.meeting_link_or_location} onChange={change} placeholder="Zoom, Meet, Teams, Loom, YouTube, or a class video URL" /> : null}
              <button className="button button-block" disabled={submitting || !selectedPostId}><CalendarCheck2 size={17} /> {submitting ? "Sending request…" : "Request this class"}</button>
            </form>
            <Link className="button button-block button-ghost" to={messagePath}><MessageCircle size={16} /> Message mentor</Link>
            <button className="button button-block button-ghost" type="button" onClick={save} disabled={saving}><Heart size={16} /> {saving ? "Saving…" : "Save for later"}</button>
          </>
        ) : !user ? (
          <>
            <p className="booking-login-copy">Log in as a student to request a trial or regular class with {firstName}.</p>
            <Link className="button button-block" to="/login" state={returnState}>Log in to book</Link>
          </>
        ) : (
          <>
            <p className="booking-login-copy">Booking is available from a student account. You are currently signed in as {user.role}.</p>
            <Link className="button button-block" to={roleHome(user.role)}>Return to your workspace</Link>
          </>
        )}
        <ul className="trust-list">
          <li><ShieldCheck size={15} /><span><strong>Marketplace safeguards</strong><small>Admin moderation and reporting tools</small></span></li>
          <li><CalendarCheck2 size={15} /><span><strong>Schedule with context</strong><small>Manage changes from your dashboard</small></span></li>
          <li><Check size={15} /><span><strong>Mock payment only</strong><small>No real payment is processed</small></span></li>
        </ul>
        <p className="booking-footnote"><Sparkles size={13} /> You are requesting a time, not confirming a charge.</p>
      </div>
    </aside>
    </section>
    <div className="profile-mobile-cta"><span><small>{selectedService ? "Selected class" : "Private class"}</small><strong>৳{Number(selectedService?.price || tutor.hourly_rate || 0).toLocaleString()} / session</strong></span>{isStudent || !user ? <a className="button" href="#book">Request a class</a> : <Link className="button" to={roleHome(user.role)}>Workspace</Link>}</div>
  </main>;
}
