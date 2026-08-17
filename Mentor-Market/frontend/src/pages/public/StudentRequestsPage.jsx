import { ArrowRight, Clock3, MapPin, Search, Send, Sparkles } from "lucide-react";
import { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Alert from "../../components/Alert.jsx";
import EmptyState from "../../components/EmptyState.jsx";
import LoadingSpinner from "../../components/LoadingSpinner.jsx";
import Pagination from "../../components/Pagination.jsx";
import RequestCard from "../../components/RequestCard.jsx";
import useApi from "../../hooks/useApi.js";
import useAuth from "../../hooks/useAuth.js";
import useDebouncedValue from "../../hooks/useDebouncedValue.js";
import useReducedMotion from "../../hooks/useReducedMotion.js";

const popularSubjects = ["Mathematics", "Physics", "English", "Chemistry"];

export default function StudentRequestsPage() {
  const { user } = useAuth();
  const reducedMotion = useReducedMotion();
  const [searchParams, setSearchParams] = useSearchParams();
  const subject = searchParams.get("q") || "";
  const page = Math.max(Number.parseInt(searchParams.get("page"), 10) || 1, 1);
  const debouncedSubject = useDebouncedValue(subject);
  const query = useMemo(() => new URLSearchParams({ status: "open", page: String(page), limit: "12", ...(debouncedSubject ? { q: debouncedSubject } : {}) }).toString(), [debouncedSubject, page]);
  const { data, meta, loading, error } = useApi(`/student-requests?${query}`);
  const requests = data || [];
  const total = meta?.total ?? requests.length;
  const pages = meta?.pages ?? 1;
  const previewRequests = requests.slice(0, 2);
  const updateSearch = (value) => setSearchParams(value ? { q: value } : {}, { replace: true });
  const changePage = (nextPage) => {
    const next = new URLSearchParams(searchParams);
    next.set("page", String(nextPage));
    setSearchParams(next, { replace: true });
    window.requestAnimationFrame(() => document.getElementById("open-requests")?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" }));
  };
  const requestAction = (request) => {
    if (user?.role === "tutor") return <Link className="request-card-link" to={`/tutor/requests?request=${request.id}`}>Send proposal <ArrowRight size={14} /></Link>;
    if (user?.role === "student") return <Link className="request-card-link" to="/student/create-request">Post a brief <ArrowRight size={14} /></Link>;
    if (user) return null;
    return <Link className="request-card-link" to="/register?role=tutor" state={{ from: { pathname: "/tutor/requests", search: `?request=${request.id}` } }}>Respond <ArrowRight size={14} /></Link>;
  };
  const heroAction = user?.role === "tutor"
    ? { to: "/tutor/requests", label: "Open mentor workspace", eyebrow: "Live student briefs · Matched to your practice", meta: "Choose a brief to send a focused proposal." }
    : user?.role === "student"
      ? { to: "/student/create-request", label: "Post your learning brief", eyebrow: "Live student briefs · Start with your need", meta: "Post your own brief so mentors can respond thoughtfully." }
      : user?.role === "admin"
        ? { to: "/admin/student-requests", label: "Review brief board", eyebrow: "Live student briefs · Marketplace overview", meta: "Review active briefs from the marketplace workspace." }
        : { to: "/register?role=tutor", label: "Join as a mentor", eyebrow: "Live student briefs · For mentors", meta: "Join as a mentor to send a proposal.", state: { from: { pathname: "/tutor/requests" } } };

  return <main className="opportunities-page">
    <header className="marketplace-header request-marketplace-header">
      <div className="container marketplace-header-grid">
        <div className="marketplace-header-copy">
          <span className="page-index"><i /> {heroAction.eyebrow}</span>
          <h1>Good teaching<br /><em>starts with a need.</em></h1>
          <p>Browse clear student briefs, find the ones that match your expertise, and respond with a thoughtful proposal.</p>
          <div className="request-hero-actions"><Link className="button" to={heroAction.to} state={heroAction.state}>{heroAction.label} <ArrowRight size={16} /></Link><a className="text-link" href="#open-requests">See open briefs</a></div>
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
      <div className="opportunities-toolbar"><div><span className="section-kicker">Fresh opportunities</span><h2>Find the right brief for you.</h2><p>Search by subject, level, or neighborhood.</p></div><label><Search size={17} /><input value={subject} onChange={(event) => updateSearch(event.target.value)} placeholder="Search briefs" aria-label="Search student briefs" /></label></div>
      <div className="request-topic-row"><span>Quick filter</span>{popularSubjects.map((item) => <button type="button" aria-pressed={subject === item} className={subject === item ? "active" : ""} key={item} onClick={() => updateSearch(subject === item ? "" : item)}>{item}</button>)}</div>
      <div className="opportunities-meta" aria-live="polite"><span>{loading ? "Refreshing the board…" : `${total} open brief${total === 1 ? "" : "s"}`}</span><p><Send size={14} /> {heroAction.meta}</p></div>
      <Alert>{error}</Alert><div aria-busy={loading}>{loading ? <LoadingSpinner label="Loading requests" /> : requests.length ? <><div className="card-grid request-grid">{requests.map((request) => <RequestCard key={request.id} request={request} anonymizeStudent action={requestAction(request)} />)}</div><Pagination page={page} pages={pages} onChange={changePage} label="Student brief pages" /></> : <EmptyState title="No open requests" text="Try another subject or check back when students post new briefs." />}</div>
    </section>
  </main>;
}
