import {
  ArrowLeft, BadgeCheck, BookOpenCheck, CalendarCheck2, Check, Clock3, Heart, MapPin,
  MonitorPlay, ShieldCheck, Sparkles, Star,
} from "lucide-react";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import api, { getErrorMessage } from "../../api/axios.js";
import Alert from "../../components/Alert.jsx";
import DemoVideo from "../../components/DemoVideo.jsx";
import FormField from "../../components/FormField.jsx";
import LoadingSpinner from "../../components/LoadingSpinner.jsx";
import UserAvatar from "../../components/UserAvatar.jsx";
import useApi from "../../hooks/useApi.js";
import useAuth from "../../hooks/useAuth.js";

const parseSubjects = (value) => {
  if (Array.isArray(value)) return value;
  try { return JSON.parse(value || "[]"); } catch { return []; }
};

export default function TutorDetailsPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { data: tutor, loading, error } = useApi(`/tutors/${id}`, null);
  const [feedback, setFeedback] = useState("");
  const [booking, setBooking] = useState({ class_type: "trial", class_date: "", class_time: "", mode: "online", duration_minutes: 60 });
  const change = (event) => setBooking((current) => ({ ...current, [event.target.name]: event.target.value }));
  const book = async (event) => {
    event.preventDefault(); setFeedback("");
    try { await api.post("/bookings", { ...booking, tutor_id: Number(id), tutor_post_id: tutor.posts?.[0]?.id }); setFeedback("Booking request sent successfully."); }
    catch (requestError) { setFeedback(getErrorMessage(requestError)); }
  };
  const save = async () => { try { await api.post(`/students/saved-tutors/${id}`); setFeedback("Tutor saved to your favorites."); } catch (requestError) { setFeedback(getErrorMessage(requestError)); } };
  if (loading) return <main className="center-page"><LoadingSpinner label="Preparing mentor profile" /></main>;
  if (error || !tutor) return <main className="center-page"><Alert>{error || "Tutor not found"}</Alert></main>;
  const subjects = parseSubjects(tutor.subjects);
  const rating = Number(tutor.average_rating || 0);
  const featuredService = tutor.posts?.find((post) => post.demo_video_url) || tutor.posts?.[0];
  const isStudent = user?.role === "student";
  const firstName = tutor.full_name.split(" ")[0];

  return <main className="tutor-profile-page">
    <section className="profile-cover">
      <div className="container">
        <Link className="profile-back" to="/tutors"><ArrowLeft size={15} /> Back to mentor directory</Link>
        <div className="profile-cinema">
          <div className="profile-cinema-media">
            {featuredService?.demo_video_url ? <video src={featuredService.demo_video_url} poster={featuredService.thumbnail_url} autoPlay muted loop playsInline preload="metadata" aria-label={`${tutor.full_name} teaching preview`} /> : <img src={featuredService?.thumbnail_url || "/media/math-studio.svg"} alt="" />}
            <span className="profile-preview-label"><i /> Teaching preview</span>
            <DemoVideo src={featuredService?.demo_video_url} poster={featuredService?.thumbnail_url} title={`${tutor.full_name} — ${featuredService?.title || "Demo lesson"}`} variant="icon" />
            <div className="profile-cinema-caption"><small>Featured class</small><strong>{featuredService?.title || `${subjects[0] || "Subject"} mentoring`}</strong><span>{featuredService?.level || tutor.qualifications}</span></div>
          </div>
          <div className="profile-summary">
            <div className="profile-identity-top"><UserAvatar name={tutor.full_name} image={tutor.avatar_url} size="profile" verified={Boolean(tutor.is_verified)} /><div className="profile-labels"><span className="hero-kicker">Independent mentor</span>{tutor.is_verified ? <span className="verified-badge"><BadgeCheck size={15} /> Verified</span> : null}</div></div>
            <div className="profile-summary-main"><h1>{tutor.full_name}</h1><p>{tutor.qualifications || "Independent subject tutor"}</p><div className="profile-subject-line">{subjects.slice(0, 3).map((subject) => <span key={subject}>{subject}</span>)}</div></div>
            <div className="profile-highlights"><span><Star size={17} fill="currentColor" /><b>{rating ? rating.toFixed(1) : "New"}</b><small>student rating</small></span><span><Clock3 size={17} /><b>{tutor.experience_years} years</b><small>experience</small></span><span><MapPin size={17} /><b>{tutor.location || "Remote"}</b><small>location</small></span><span><MonitorPlay size={17} /><b>{tutor.teaching_mode}</b><small>teaching mode</small></span></div>
            <div className="profile-cover-actions">{isStudent ? <button className="button button-ghost" type="button" onClick={save}><Heart size={16} /> Save mentor</button> : !user ? <Link className="button button-ghost" to="/login"><Heart size={16} /> Log in to save</Link> : null}<a className="button" href="#book">Request a class</a></div>
          </div>
        </div>
        <div className="profile-proof-strip"><span><ShieldCheck size={17} /><strong>Profile context</strong><small>Credentials and verification status shown clearly</small></span><span><MonitorPlay size={17} /><strong>See how they teach</strong><small>Watch the class preview before reaching out</small></span><span><CalendarCheck2 size={17} /><strong>Flexible booking</strong><small>Request trial or regular sessions</small></span></div>
      </div>
    </section>
    <div className="profile-subnav"><div className="container"><a href="#about">About</a><a href="#services">Classes</a><a href="#reviews">Reviews</a><span><i /> {tutor.availability || "Contact for current availability"}</span></div></div>
    <section className="container tutor-detail-grid"><div className="profile-panel">
      <article className="profile-section" id="about"><span className="section-mini-label">Meet your mentor</span><h2>About {firstName}</h2><p className="profile-bio">{tutor.bio || "This tutor has not added a biography yet."}</p><div className="profile-about-grid"><div><small>Subjects</small><div className="tag-row profile-subjects">{subjects.map((subject) => <span className="tag" key={subject}>{subject}</span>)}</div></div><div><small>Working style</small><p>{tutor.teaching_mode === "online" ? "Remote classes with a schedule arranged together." : tutor.teaching_mode === "offline" ? "In-person teaching in the listed location." : "Available for both online and in-person teaching."}</p></div></div></article>
      <article className="profile-section" id="services"><div className="profile-section-heading"><div><span className="section-mini-label">Choose a starting point</span><h2>Available classes</h2></div><span>{tutor.posts?.length || 0} active</span></div>{tutor.posts?.length ? <div className="service-list">{tutor.posts.map((post, index) => <article className="service-row" key={post.id}><span className="service-index">{String(index + 1).padStart(2, "0")}</span><span className="service-thumb"><BookOpenCheck size={20} />{post.thumbnail_url ? <img src={post.thumbnail_url} alt="" onError={(event) => { event.currentTarget.hidden = true; }} /> : null}</span><div className="service-copy"><div><strong>{post.title}</strong>{post.has_trial ? <span>Trial available</span> : null}</div><p>{post.description}</p><small><MonitorPlay size={14} /> {post.teaching_mode} · {post.level} · {post.availability}</small><DemoVideo src={post.demo_video_url} poster={post.thumbnail_url} title={`${tutor.full_name} — ${post.title}`} label="Watch class preview" variant="text" /></div><div className="service-price"><strong>৳{Number(post.price).toLocaleString()}</strong><small>per session</small></div></article>)}</div> : <p className="muted">No active services.</p>}</article>
      <article className="profile-section" id="reviews"><div className="profile-section-heading"><div><span className="section-mini-label">From past classes</span><h2>Student reviews</h2></div><div className="review-summary"><Star size={17} fill="currentColor" /><strong>{rating.toFixed(1)}</strong><small>{tutor.reviews?.length || 0} reviews</small></div></div>{tutor.reviews?.length ? <div className="review-grid">{tutor.reviews.map((review) => <blockquote key={review.id}><span className="proof-stars">{"★".repeat(review.rating)}</span><p>“{review.comment}”</p><div><UserAvatar name={review.reviewer_name} size="tiny" /><small>{review.reviewer_name}</small></div></blockquote>)}</div> : <p className="muted">No reviews yet.</p>}</article>
    </div><aside className="booking-panel" id="book"><div className="booking-card"><div className="booking-card-head"><span>Private classes from</span><h2>৳{Number(tutor.hourly_rate).toLocaleString()} <small>/ hour</small></h2><div><Star size={14} fill="currentColor" /> {rating.toFixed(1)} <span>·</span> {tutor.experience_years} years teaching</div></div>{isStudent ? <><Alert type={feedback.includes("success") || feedback.includes("saved") ? "success" : "error"}>{feedback}</Alert><form onSubmit={book}><FormField label="Class type" name="class_type" value={booking.class_type} onChange={change} options={["trial", "one-time", "weekly", "monthly"]} /><div className="booking-form-row"><FormField label="Date" name="class_date" type="date" value={booking.class_date} onChange={change} required /><FormField label="Time" name="class_time" type="time" value={booking.class_time} onChange={change} required /></div><FormField label="Teaching mode" name="mode" value={booking.mode} onChange={change} options={["online", "offline"]} /><button className="button button-block"><CalendarCheck2 size={17} /> Request a class</button></form><button className="button button-block button-ghost" type="button" onClick={save}><Heart size={16} /> Save for later</button></> : <><p className="booking-login-copy">Log in as a student to request a trial or regular class with {firstName}.</p><Link className="button button-block" to="/login">Log in to book</Link></>}<ul className="trust-list"><li><ShieldCheck size={15} /><span><strong>Marketplace safeguards</strong><small>Admin moderation and reporting tools</small></span></li><li><CalendarCheck2 size={15} /><span><strong>Schedule with context</strong><small>Manage changes from your dashboard</small></span></li><li><Check size={15} /><span><strong>Mock payment only</strong><small>No real payment is processed</small></span></li></ul><p className="booking-footnote"><Sparkles size={13} /> You are requesting a time, not confirming a charge.</p></div></aside></section>
  </main>;
}
