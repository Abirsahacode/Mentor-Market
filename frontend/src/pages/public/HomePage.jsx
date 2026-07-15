import {
  ArrowRight, BadgeCheck, BookOpen, Check, CirclePlay, Gauge, MapPin, MonitorPlay,
  Search, Sparkles, Target, WalletCards,
} from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import CourseArtwork from "../../components/CourseArtwork.jsx";
import DemoVideo from "../../components/DemoVideo.jsx";
import RequestCard from "../../components/RequestCard.jsx";
import TutorCard from "../../components/TutorCard.jsx";
import UserAvatar from "../../components/UserAvatar.jsx";
import useApi from "../../hooks/useApi.js";

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
  const [subject, setSubject] = useState("");
  const [match, setMatch] = useState({ subject: "Mathematics", mode: "", maxPrice: "" });
  const navigate = useNavigate();
  const { data: tutors, loading: tutorsLoading } = useApi("/tutors?limit=6");
  const { data: requests, loading: requestsLoading } = useApi("/student-requests?status=open&limit=3");
  const submit = (event) => { event.preventDefault(); navigate(`/tutors${subject ? `?subject=${encodeURIComponent(subject)}` : ""}`); };
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

  return (
    <main className="home-page">
      <section className="home-hero">
        <div className="container home-hero-grid">
          <div className="hero-copy">
            <span className="hero-label"><i /> Video-first mentor discovery</span>
            <h1>Meet the mentor.<br /><span>Then learn.</span></h1>
            <p>Watch short teaching previews before you decide. Compare expertise, personality, schedule, and price—then start with a class that feels right.</p>
            <form className="hero-search" onSubmit={submit}>
              <Search size={20} aria-hidden="true" />
              <input value={subject} onChange={(event) => setSubject(event.target.value)} aria-label="Subject" placeholder="What do you want to learn?" />
              <button className="button">Find your mentor <ArrowRight size={16} /></button>
            </form>
            <div className="hero-popular"><span>Start with</span>{subjects.slice(0, 4).map((item) => <button type="button" key={item.name} onClick={() => navigate(`/tutors?subject=${encodeURIComponent(item.name)}`)}>{item.name}</button>)}</div>
            <div className="hero-proof">
              <div className="hero-avatar-stack">{featuredTutors.map((tutor) => <UserAvatar key={tutor.user_id} name={tutor.full_name} image={tutor.avatar_url} size="small" />)}</div>
              <p><strong>Real teaching styles, up front.</strong><span>Preview mentors before sending a message.</span></p>
            </div>
          </div>

          <div className="hero-video-board" aria-label="Featured mentor previews">
            {tutorsLoading ? <div className="hero-film hero-film-loading"><i /><span /><span /></div> : leadTutor ? <article className="hero-film">
              <div className="hero-film-media">
                <CourseArtwork subject={firstSubject(leadTutor.subjects)} />
                <span className="hero-now-playing"><i /> Preview available</span>
                <DemoVideo src={leadTutor.demo_video_url} title={`${leadTutor.full_name} — ${leadTutor.featured_service_title || firstSubject(leadTutor.subjects)}`} variant="icon" />
              </div>
              <div className="hero-film-info">
                <UserAvatar name={leadTutor.full_name} image={leadTutor.avatar_url} size="medium" />
                <div><span>{firstSubject(leadTutor.subjects)} mentor</span><strong>{leadTutor.full_name}</strong><small>{leadTutor.featured_service_title || leadTutor.qualifications}</small></div>
                <Link to={`/tutors/${leadTutor.user_id}`} aria-label={`View ${leadTutor.full_name}'s profile`}><ArrowRight size={18} /></Link>
              </div>
            </article> : <div className="hero-film hero-film-empty"><CirclePlay size={30} /><strong>Mentor previews are coming soon</strong></div>}

            <div className="hero-preview-rail">
              {featuredTutors.slice(1).map((tutor) => <Link className="hero-preview-card" to={`/tutors/${tutor.user_id}`} key={tutor.user_id}>
                <CourseArtwork subject={firstSubject(tutor.subjects)} />
                <span><small>{firstSubject(tutor.subjects)}</small><strong>{tutor.full_name}</strong></span>
                <CirclePlay size={22} />
              </Link>)}
              <Link className="hero-preview-more" to="/tutors"><span>Explore all mentors</span><ArrowRight size={17} /></Link>
            </div>
            <div className="hero-stage-note"><Sparkles size={15} /><span><strong>Watch before you book</strong> Short demos reveal more than a bio.</span></div>
          </div>
        </div>
      </section>

      <div className="home-service-line"><div className="container"><span><Check size={16} /> Teaching previews</span><span><Check size={16} /> Verified profiles</span><span><Check size={16} /> Trial-friendly classes</span><span><Check size={16} /> One learning workspace</span></div></div>

      <section className="container subject-index">
        <div className="section-heading split"><div className="heading-lockup"><span className="section-number">01</span><div><p className="section-kicker">Choose your starting point</p><h2>Follow your curiosity.</h2></div></div><p className="section-side-copy">Find patient fundamentals, focused exam prep, or a practical new skill.</p></div>
        <div className="subject-list">{subjects.map((item, index) => <Link key={item.name} to={`/tutors?subject=${encodeURIComponent(item.name)}`}>
          <CourseArtwork subject={item.name} /><span>{String(index + 1).padStart(2, "0")}</span><div><strong>{item.name}</strong><small>{item.note}</small></div><ArrowRight size={18} />
        </Link>)}</div>
      </section>

      <section className="home-match-section">
        <div className="container">
          <div className="section-heading split match-heading"><div className="heading-lockup"><span className="section-number">02</span><div><p className="section-kicker">A more intentional shortlist</p><h2>Choose the fit, not just the subject.</h2></div></div><p className="section-side-copy">Set the details that shape a good week. We will carry them straight into the mentor directory.</p></div>
          <div className="match-builder">
            <div className="match-controls">
              <div className="match-control-group"><div><span>01</span><div><strong>What are you learning?</strong><small>Start with the clearest signal.</small></div></div><div className="match-choice-grid subject-choices">{subjects.map((item) => <button className={match.subject === item.name ? "active" : ""} type="button" aria-pressed={match.subject === item.name} key={item.name} onClick={() => setMatch((current) => ({ ...current, subject: item.name }))}>{item.name}</button>)}</div></div>
              <div className="match-control-group"><div><span>02</span><div><strong>Where should it happen?</strong><small>Keep the format realistic for your routine.</small></div></div><div className="match-choice-grid three-up">{[["", "Either"], ["online", "Online"], ["offline", "In person"]].map(([value, label]) => <button className={match.mode === value ? "active" : ""} type="button" aria-pressed={match.mode === value} key={label} onClick={() => setMatch((current) => ({ ...current, mode: value }))}>{label}</button>)}</div></div>
              <div className="match-control-group"><div><span>03</span><div><strong>What feels comfortable?</strong><small>Use a ceiling, not a commitment.</small></div></div><div className="match-choice-grid three-up">{[["", "Any rate"], ["800", "Up to ৳800"], ["1200", "Up to ৳1,200"]].map(([value, label]) => <button className={match.maxPrice === value ? "active" : ""} type="button" aria-pressed={match.maxPrice === value} key={label} onClick={() => setMatch((current) => ({ ...current, maxPrice: value }))}>{label}</button>)}</div></div>
            </div>
            <aside className="match-preview">
              <div className="match-preview-top"><span><Target size={16} /> Your match signal</span><small>Updates as you choose</small></div>
              <div className="match-orbit" aria-hidden="true"><i /><i /><i /><div>{shortlist.slice(0, 3).map((tutor) => <UserAvatar key={tutor.user_id} name={tutor.full_name} image={tutor.avatar_url} size="medium" />)}<span><Sparkles size={19} /></span></div></div>
              <div className="match-preview-copy"><small>Current direction</small><h3>{match.subject || "Any subject"}<br /><em>{match.mode ? `${match.mode === "offline" ? "In-person" : "Online"} learning` : "Online or nearby"}</em></h3><p>{tutorsLoading ? "Reading the current mentor directory…" : shortlist.length ? `${shortlist.length} mentor${shortlist.length === 1 ? "" : "s"} in this preview set fit the starting point. Refine the directory to compare the details.` : "No exact match in the first set yet. Open the directory to broaden one detail at a time."}</p></div>
              <div className="match-signal-list"><span><MonitorPlay size={16} /><small>Format</small><strong>{match.mode ? (match.mode === "offline" ? "In person" : "Online") : "Flexible"}</strong></span><span><WalletCards size={16} /><small>Rate</small><strong>{match.maxPrice ? `≤ ৳${Number(match.maxPrice).toLocaleString()}` : "Open"}</strong></span><span><Gauge size={16} /><small>Search</small><strong>{match.subject}</strong></span></div>
              <button className="button button-white match-submit" type="button" onClick={openShortlist}>Build my shortlist <ArrowRight size={16} /></button>
              <p className="match-footnote"><Check size={14} /> Nothing is booked. These choices only tune your search.</p>
            </aside>
          </div>
        </div>
      </section>

      <section className="home-tutors-section">
        <div className="container">
          <div className="section-heading split"><div className="heading-lockup"><span className="section-number">03</span><div><p className="section-kicker">Watch, compare, connect</p><h2>Mentors with something to show.</h2></div></div><Link className="text-link" to="/tutors">See the full directory <ArrowRight size={15} /></Link></div>
          <div className="card-grid tutor-grid">{tutorsLoading ? [0, 1, 2].map((item) => <article className="listing-card-skeleton" key={item}><i /><span /><span /><b /></article>) : featuredTutors.length ? featuredTutors.map((tutor) => <TutorCard key={tutor.user_id} tutor={tutor} previewVideo />) : <p className="empty-inline">No tutors are listed yet.</p>}</div>
        </div>
      </section>

      <section className="container home-requests-section">
        <div className="requests-intro">
          <span className="section-number">04</span>
          <p className="section-kicker">A second way to match</p>
          <h2>Describe the help. Let mentors come to you.</h2>
          <p>Post a clear brief with your subject, schedule, preferred mode, and budget. Relevant tutors can reply with a proposal.</p>
          <Link className="button button-ink" to="/student-requests">Browse open briefs <ArrowRight size={16} /></Link>
          <div className="requests-intro-foot"><MapPin size={15} /><span>Online and local matching across Dhaka</span></div>
        </div>
        <div className="home-request-list">{requestsLoading ? [0, 1, 2].map((item) => <article className="listing-card-skeleton request-skeleton" key={item}><i /><span /><span /><b /></article>) : (requests || []).length ? (requests || []).map((request) => <RequestCard key={request.id} request={request} />) : <p className="empty-inline">No student requests are open right now.</p>}</div>
      </section>

      <section className="home-process">
        <div className="container home-process-grid">
          <div><span className="section-number light">05</span><p className="section-kicker light">A calmer way to choose</p><h2>Less guesswork.<br />More signal.</h2><p>Every part of the marketplace is designed to help you make a thoughtful match, then keep the learning organized.</p></div>
          <ol>
            <li><span>01</span><div><h3>See the teaching style</h3><p>Watch short previews and scan course outcomes before opening a profile.</p></div><CirclePlay size={20} /></li>
            <li><span>02</span><div><h3>Talk through the fit</h3><p>Ask questions, compare proposals, and align on schedule and expectations.</p></div><ArrowRight size={20} /></li>
            <li><span>03</span><div><h3>Keep momentum visible</h3><p>Manage classes, materials, assignments, quizzes, and feedback in one place.</p></div><BadgeCheck size={20} /></li>
          </ol>
        </div>
      </section>

      <section className="container home-final-cta">
        <span className="cta-mark"><BookOpen size={25} /></span>
        <div><small>Your next breakthrough could start here</small><h2>Find a mentor worth learning from.</h2><p>Browse the previews or create a brief in a few minutes.</p></div>
        <div className="home-final-actions"><Link className="button" to="/tutors">Explore mentors <ArrowRight size={16} /></Link><Link className="text-link" to="/register?role=tutor">I want to teach</Link></div>
      </section>
    </main>
  );
}
