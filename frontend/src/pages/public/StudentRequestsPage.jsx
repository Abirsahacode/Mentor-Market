import { ArrowRight, Clock3, MapPin, Search, Send, Sparkles } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import Alert from "../../components/Alert.jsx";
import EmptyState from "../../components/EmptyState.jsx";
import LoadingSpinner from "../../components/LoadingSpinner.jsx";
import RequestCard from "../../components/RequestCard.jsx";
import useApi from "../../hooks/useApi.js";

const popularSubjects = ["Mathematics", "Physics", "English", "Chemistry"];

export default function StudentRequestsPage() {
  const [subject, setSubject] = useState("");
  const { data, loading, error } = useApi(`/student-requests?status=open${subject ? `&q=${encodeURIComponent(subject)}` : ""}`);
  const requests = data || [];
  const previewRequests = requests.slice(0, 2);

  return <main className="opportunities-page">
    <header className="marketplace-header request-marketplace-header">
      <div className="container marketplace-header-grid">
        <div className="marketplace-header-copy">
          <span className="page-index"><i /> Live student briefs · For mentors</span>
          <h1>Good teaching<br /><em>starts with a need.</em></h1>
          <p>Browse clear student briefs, find the ones that match your expertise, and respond with a thoughtful proposal.</p>
          <div className="request-hero-actions"><Link className="button" to="/register?role=tutor">Join as a mentor <ArrowRight size={16} /></Link><a className="text-link" href="#open-requests">See open briefs</a></div>
        </div>
        <div className="brief-preview-board">
          <div className="brief-board-head"><span><i /> Open right now</span><strong>{loading ? "—" : String(requests.length).padStart(2, "0")}</strong></div>
          <div className="brief-board-list">{loading ? [0, 1].map((item) => <div className="brief-mini brief-mini-loading" key={item}><i /><span /><span /></div>) : previewRequests.length ? previewRequests.map((request) => <article className="brief-mini" key={request.id}>
            <span>{request.subject}</span><strong>{request.class_level}</strong><div><small><MapPin size={12} /> {request.location || "Remote"}</small><small><Clock3 size={12} /> {request.preferred_time}</small></div><b>৳{Number(request.budget || 0).toLocaleString()}</b>
          </article>) : <div className="brief-board-empty">New student briefs will appear here.</div>}</div>
          <div className="brief-board-foot"><Sparkles size={15} /><span>Clear proposals beat generic replies.</span></div>
        </div>
      </div>
    </header>
    <section className="container opportunities-body" id="open-requests">
      <div className="opportunities-toolbar"><div><span className="section-kicker">Fresh opportunities</span><h2>Find the right brief for you.</h2><p>Search by subject, level, or neighborhood.</p></div><label><Search size={17} /><input value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="Search briefs" aria-label="Search student briefs" /></label></div>
      <div className="request-topic-row"><span>Quick filter</span>{popularSubjects.map((item) => <button type="button" className={subject === item ? "active" : ""} key={item} onClick={() => setSubject(subject === item ? "" : item)}>{item}</button>)}</div>
      <div className="opportunities-meta"><span>{loading ? "Refreshing the board…" : `${requests.length} open brief${requests.length === 1 ? "" : "s"}`}</span><p><Send size={14} /> Sign in as a tutor to send a proposal.</p></div>
      <Alert>{error}</Alert>{loading ? <LoadingSpinner label="Loading requests" /> : requests.length ? <div className="card-grid request-grid">{requests.map((request) => <RequestCard key={request.id} request={request} />)}</div> : <EmptyState title="No open requests" text="Try another subject or check back when students post new briefs." />}
    </section>
  </main>;
}
