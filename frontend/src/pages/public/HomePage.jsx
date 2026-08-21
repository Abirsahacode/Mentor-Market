import {
  ArrowRight, BadgeCheck, BookOpen, Check, CirclePlay, MapPin, MonitorPlay,
  Search, Sparkles, WalletCards,
} from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Alert from "../../components/Alert.jsx";
import CourseArtwork from "../../components/CourseArtwork.jsx";
import DemoVideo from "../../components/DemoVideo.jsx";
import RequestCard from "../../components/RequestCard.jsx";
import TutorCard from "../../components/TutorCard.jsx";
import UserAvatar from "../../components/UserAvatar.jsx";
import useApi from "../../hooks/useApi.js";
import useAuth from "../../hooks/useAuth.js";

const subjects = [
  { name: "Mathematics", note: "Make abstract ideas visible" },
  { name: "Physics", note: "Build intuition, then solve" },
  { name: "English", note: "Write and speak with confidence" },
  { name: "Chemistry", note: "See the patterns in reactions" },
  { name: "IELTS", note: "Practice with useful feedback" },
  { name: "Programming", note: "Learn by building real things" },
];

const firstSubject = (value) => {
  if (Array.isArray(value)) return value[0];
  try { return JSON.parse(value || "[]")[0]; } catch { return "General tutoring"; }
};

export default function HomePage() {
  const { user } = useAuth();
  const [subject, setSubject] = useState("");
  const [match, setMatch] = useState({ subject: "Mathematics", mode: "", maxPrice: "" });
  const navigate = useNavigate();
  const { data: tutors, loading: tutorsLoading, error: tutorsError, reload: reloadTutors } = useApi("/tutors?limit=6");
  const { data: requests, loading: requestsLoading, error: requestsError, reload: reloadRequests } = useApi("/student-requests?status=open&limit=3");
  const { data: featuredReviews, loading: reviewsLoading } = useApi("/reviews/featured");
  const submit = (event) => { event.preventDefault(); navigate(`/tutors${subject ? `?q=${encodeURIComponent(subject.trim())}` : ""}`); };
  const featuredTutors = (tutors || []).slice(0, 3);
  const leadTutor = featuredTutors[0];
  const shortlist = (tutors || []).filter((tutor) => {
    const tutorSubjects = Array.isArray(tutor.subjects) ? tutor.subjects : (() => { try { return JSON.parse(tutor.subjects || "[]"); } catch { return []; } })();
    const subjectMatches = !match.subject || tutorSubjects.some((item) => item.toLowerCase().includes(match.subject.toLowerCase()));
    const modeMatches = !match.mode || tutor.teaching_mode === match.mode || tutor.teaching_mode === "both";
    const priceMatches = !match.maxPrice || Number(tutor.hourly_rate || 0) <= Number(match.maxPrice);
    return subjectMatches && modeMatches && priceMatches;
  });
  const openShortlist = () => {
    const query = new URLSearchParams(Object.entries(match).filter(([, value]) => value));
    navigate(`/tutors?${query.toString()}`);
  };
  const briefPath = user?.role === "student" ? "/student/create-request" : user ? "/student-requests" : "/register";
  const briefLabel = user?.role === "student" ? "Post your brief" : user ? "Browse open briefs" : "Post your brief";
  const briefState = user ? undefined : { from: { pathname: "/student/create-request" } };

  return (
    <main className="home-page">
      <section className="home-hero">
        <div className="container home-hero-grid">
          <div className="hero-copy">
            <span className="hero-label"><i /> One-to-one learning, with context</span>
            <h1>See how they teach.<br /><span>Then choose.</span></h1>
            <p>Meet independent mentors through short teaching previews. Compare their approach, experience, schedule, and rate before the first class.</p>
            <form className="hero-search" onSubmit={submit}>
              <Search size={20} aria-hidden="true" />
              <input value={subject} onChange={(event) => setSubject(event.target.value)} aria-label="Subject" placeholder="What do you want to learn?" />
              <button className="button">Explore mentors <ArrowRight size={16} /></button>
            </form>
            <div className="hero-popular"><span>Start with</span>{subjects.slice(0, 4).map((item) => <button type="button" key={item.name} onClick={() => navigate(`/tutors?subject=${encodeURIComponent(item.name)}`)}>{item.name}</button>)}</div>
            <div className="hero-proof">
              <span><BadgeCheck size={16} /> Reviewed mentor profiles</span>
              <span><CirclePlay size={16} /> Teaching previews before booking</span>
            </div>
          </div>

          <div className="hero-video-board hero-spotlight" aria-label="Featured mentor preview">
            <article className="hero-film">
              <div className="hero-film-media">
                <img className="hero-mentor-portrait" src="/media/mentor-session-atelier.webp" alt="A mentor and student working together at a desk" />
                <span className="hero-now-playing"><i /> A closer look at one-to-one learning</span>
                {leadTutor ? <DemoVideo src={leadTutor.demo_video_url} poster="/media/mentor-session-atelier.webp" title={`${leadTutor.full_name} — ${leadTutor.featured_service_title || firstSubject(leadTutor.subjects)}`} variant="icon" /> : null}
              </div>
              <div className="hero-film-info">
                {leadTutor ? <><UserAvatar name={leadTutor.full_name} image={leadTutor.avatar_url} size="medium" /><div><span>{firstSubject(leadTutor.subjects)} mentor</span><strong>{leadTutor.full_name}</strong><small>{leadTutor.featured_service_title || leadTutor.qualifications}</small></div><Link to={`/tutors/${leadTutor.user_id}`} aria-label={`View ${leadTutor.full_name}'s profile`}><ArrowRight size={18} /></Link></> : <><span className="hero-film-mark"><BookOpen size={18} /></span><div><span>Mentor Market</span><strong>{tutorsLoading ? "Preparing mentor previews…" : "Teaching is personal"}</strong><small>{tutorsError ? "The live directory is temporarily unavailable." : "Watch, compare, and choose with context."}</small></div><Link to="/tutors" aria-label="Explore mentor profiles"><ArrowRight size={18} /></Link></>}
              </div>
              {tutorsError && !leadTutor ? <button className="hero-preview-retry" type="button" onClick={reloadTutors}>Retry live mentor previews</button> : null}
            </article>
          </div>
        </div>
      </section>

      <section className="container subject-index">
        <div className="section-heading split"><div className="heading-lockup"><span className="section-number">01</span><div><p className="section-kicker">Choose your starting point</p><h2>Find your subject.</h2></div></div><p className="section-side-copy">Patient fundamentals, focused exam preparation, or a practical new skill—begin with the clearest need.</p></div>
        <div className="subject-list">{subjects.map((item, index) => <Link key={item.name} to={`/tutors?subject=${encodeURIComponent(item.name)}`}>
          <CourseArtwork subject={item.name} /><span>{String(index + 1).padStart(2, "0")}</span><div><strong>{item.name}</strong><small>{item.note}</small></div><ArrowRight size={18} />
        </Link>)}</div>
      </section>

      <section className="home-match-section">
        <div className="container">
          <div className="section-heading split match-heading"><div className="heading-lockup"><span className="section-number">02</span><div><p className="section-kicker">Build a useful shortlist</p><h2>A good fit has a few dimensions.</h2></div></div><p className="section-side-copy">Choose the subject, format, and comfortable rate. Nothing is booked; the details only tune your search.</p></div>
          <div className="match-builder">
            <div className="match-controls">
              <div className="match-control-group"><div><span>01</span><div><strong>What are you learning?</strong><small>Start with the clearest signal.</small></div></div><div className="match-choice-grid subject-choices">{subjects.map((item) => <button className={match.subject === item.name ? "active" : ""} type="button" aria-pressed={match.subject === item.name} key={item.name} onClick={() => setMatch((current) => ({ ...current, subject: item.name }))}>{item.name}</button>)}</div></div>
              <div className="match-control-group"><div><span>02</span><div><strong>Where should it happen?</strong><small>Keep the format realistic for your routine.</small></div></div><div className="match-choice-grid three-up">{[["", "Either"], ["online", "Online"], ["offline", "In person"]].map(([value, label]) => <button className={match.mode === value ? "active" : ""} type="button" aria-pressed={match.mode === value} key={label} onClick={() => setMatch((current) => ({ ...current, mode: value }))}>{label}</button>)}</div></div>
              <div className="match-control-group"><div><span>03</span><div><strong>What feels comfortable?</strong><small>Use a ceiling, not a commitment.</small></div></div><div className="match-choice-grid three-up">{[["", "Any rate"], ["800", "Up to ৳800"], ["1200", "Up to ৳1,200"]].map(([value, label]) => <button className={match.maxPrice === value ? "active" : ""} type="button" aria-pressed={match.maxPrice === value} key={label} onClick={() => setMatch((current) => ({ ...current, maxPrice: value }))}>{label}</button>)}</div></div>
            </div>
            <aside className="match-preview">
              <div className="match-preview-top"><span><Sparkles size={16} /> Your shortlist</span><small>Updates as you choose</small></div>
              <div className="match-preview-count"><strong>{tutorsLoading ? "—" : shortlist.length}</strong><span>mentor{shortlist.length === 1 ? "" : "s"} in this preview set</span></div>
              <div className="match-preview-copy"><small>Current direction</small><h3>{match.subject || "Any subject"}</h3><p>{shortlist.length ? "Open the full directory to compare teaching style, experience, schedule, and class options." : "No exact match appears in the preview set yet. Open the directory and broaden one detail at a time."}</p></div>
              <div className="match-signal-list"><span><MonitorPlay size={17} /><small>Format</small><strong>{match.mode ? (match.mode === "offline" ? "In person" : "Online") : "Flexible"}</strong></span><span><WalletCards size={17} /><small>Rate</small><strong>{match.maxPrice ? `Up to ৳${Number(match.maxPrice).toLocaleString()}` : "Open"}</strong></span></div>
              <button className="button button-white match-submit" type="button" onClick={openShortlist}>Build my shortlist <ArrowRight size={16} /></button>
              <p className="match-footnote"><Check size={14} /> You can change every filter in the directory.</p>
            </aside>
          </div>
        </div>
      </section>

      <section className="home-tutors-section">
        <div className="container">
          <div className="section-heading split"><div className="heading-lockup"><span className="section-number">03</span><div><p className="section-kicker">Watch, compare, connect</p><h2>Mentors with something to show.</h2></div></div><Link className="text-link" to="/tutors">See the full directory <ArrowRight size={15} /></Link></div>
          {tutorsError && !featuredTutors.length ? <div className="home-section-error"><Alert>{tutorsError}</Alert><button className="button button-ghost button-small" type="button" onClick={reloadTutors}>Retry mentor directory</button></div> : <div className="card-grid tutor-grid">{tutorsLoading ? [0, 1, 2].map((item) => <article className="listing-card-skeleton" key={item}><i /><span /><span /><b /></article>) : featuredTutors.length ? featuredTutors.map((tutor) => <TutorCard key={tutor.user_id} tutor={tutor} previewVideo />) : <p className="empty-inline">No tutors are listed yet.</p>}</div>}
        </div>
      </section>

      <section className="container home-requests-section">
        <div className="requests-intro">
          <span className="section-number">04</span>
          <p className="section-kicker">A second way to match</p>
          <h2>Describe the help. Let mentors come to you.</h2>
          <p>Post a clear brief with your subject, schedule, preferred mode, and budget. Relevant tutors can reply with a proposal.</p>
          <div className="requests-intro-actions"><Link className="button button-ink" to={briefPath} state={briefState}>{briefLabel} <ArrowRight size={16} /></Link><Link className="text-link" to="/student-requests">Browse open briefs</Link></div>
          <div className="requests-intro-foot"><MapPin size={15} /><span>Online and local matching across Dhaka</span></div>
        </div>
        <div className="home-request-list">{requestsError && !(requests || []).length ? <div className="home-section-error"><Alert>{requestsError}</Alert><button className="button button-ghost button-small" type="button" onClick={reloadRequests}>Retry open briefs</button></div> : requestsLoading ? [0, 1, 2].map((item) => <article className="listing-card-skeleton request-skeleton" key={item}><i /><span /><span /><b /></article>) : (requests || []).length ? (requests || []).map((request) => <RequestCard key={request.id} request={request} anonymizeStudent action={<Link className="request-card-link" to="/student-requests">View brief <ArrowRight size={14} /></Link>} />) : <p className="empty-inline">No student requests are open right now.</p>}</div>
      </section>

      {(reviewsLoading || featuredReviews.length > 0) && (
        <section className="container home-testimonials-section">
          <div className="section-heading split"><div className="heading-lockup"><span className="section-number">05</span><div><p className="section-kicker">Real feedback</p><h2>What learners say.</h2></div></div></div>
          <div className="card-grid testimonial-grid">
            {reviewsLoading
              ? [0, 1, 2].map((item) => <article className="listing-card-skeleton" key={item}><i /><span /><span /><b /></article>)
              : featuredReviews.map((review) => (
                <blockquote className="testimonial-card" key={review.id}>
                  <span className="testimonial-rating">{"★".repeat(review.rating)}</span>
                  <p>{review.comment}</p>
                  <footer><UserAvatar name={review.reviewer_name} size="small" /><span><strong>{review.reviewer_name}</strong><small>on {review.receiver_name}'s teaching</small></span></footer>
                </blockquote>
              ))}
          </div>
        </section>
      )}

      <section className="container home-final-cta">
        <span className="cta-mark"><BookOpen size={25} /></span>
        <div><small>Start with a real teaching style</small><h2>Find someone you want to learn from.</h2><p>Browse mentor previews or describe what you need in a student brief.</p></div>
        <div className="home-final-actions"><Link className="button" to="/tutors">Meet the mentors <ArrowRight size={16} /></Link><Link className="text-link" to={briefPath} state={briefState}>{briefLabel}</Link></div>
      </section>
    </main>
  );
}
