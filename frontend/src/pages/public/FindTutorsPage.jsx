import {
  BadgeCheck, ChevronDown, CirclePlay, Filter, MapPin, RotateCcw, Search, SlidersHorizontal, Sparkles, X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Alert from "../../components/Alert.jsx";
import DemoVideo from "../../components/DemoVideo.jsx";
import EmptyState from "../../components/EmptyState.jsx";
import LoadingSpinner from "../../components/LoadingSpinner.jsx";
import TutorCard from "../../components/TutorCard.jsx";
import useApi from "../../hooks/useApi.js";

const subjects = ["Mathematics", "Physics", "English", "Chemistry", "IELTS", "Programming"];

export default function FindTutorsPage() {
  const [searchParams] = useSearchParams();
  const initial = { q: searchParams.get("q") || "", subject: searchParams.get("subject") || "", mode: searchParams.get("mode") || "", location: searchParams.get("location") || "", maxPrice: searchParams.get("maxPrice") || "", minRating: searchParams.get("minRating") || "" };
  const [filters, setFilters] = useState(initial);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sort, setSort] = useState("recommended");
  const filterButtonRef = useRef(null);
  const filterPanelRef = useRef(null);
  const query = useMemo(() => new URLSearchParams(Object.entries(filters).filter(([, value]) => value)).toString(), [filters]);
  const { data, loading, error } = useApi(`/tutors?${query}`);
  const change = (event) => setFilters((current) => ({ ...current, [event.target.name]: event.target.value }));
  const clear = () => setFilters({ q: "", subject: "", mode: "", location: "", maxPrice: "", minRating: "" });
  const activeCount = Object.values(filters).filter(Boolean).length;
  const results = useMemo(() => {
    const items = [...(data || [])];
    if (sort === "rating") return items.sort((a, b) => Number(b.average_rating || 0) - Number(a.average_rating || 0));
    if (sort === "price") return items.sort((a, b) => Number(a.hourly_rate || 0) - Number(b.hourly_rate || 0));
    if (sort === "experience") return items.sort((a, b) => Number(b.experience_years || 0) - Number(a.experience_years || 0));
    return items.sort((a, b) => Number(b.is_verified || 0) - Number(a.is_verified || 0) || Number(b.average_rating || 0) - Number(a.average_rating || 0));
  }, [data, sort]);
  const featured = results.find((tutor) => tutor.demo_video_url) || results[0];

  useEffect(() => {
    if (!filtersOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    const focusFrame = window.requestAnimationFrame(() => {
      filterPanelRef.current?.querySelector("button, select, input")?.focus();
    });
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setFiltersOpen(false);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
      filterButtonRef.current?.focus();
    };
  }, [filtersOpen]);

  return <main className="discovery-page">
    <header className="marketplace-header directory-header">
      <div className="container marketplace-header-grid">
        <div className="marketplace-header-copy">
          <span className="page-index"><i /> Mentor directory · Bangladesh</span>
          <h1>Find how you<br /><em>learn best.</em></h1>
          <p>Preview real teaching styles, then compare expertise, availability, reviews, and rate.</p>
          <form className="marketplace-search" onSubmit={(event) => { event.preventDefault(); document.querySelector(".discovery-results")?.scrollIntoView({ behavior: "smooth", block: "start" }); }}><Search size={19} /><input aria-label="Search mentors" name="q" value={filters.q} onChange={change} placeholder="Search a subject, mentor, or qualification" /><button type="submit">Search</button></form>
          <div className="directory-quick-topics">{subjects.slice(0, 4).map((subject) => <button className={filters.subject === subject ? "active" : ""} type="button" key={subject} onClick={() => setFilters((current) => ({ ...current, subject: current.subject === subject ? "" : subject }))}>{subject}</button>)}</div>
        </div>
        <div className="directory-feature">
          {featured ? <>
            <div className="directory-feature-media">
              {featured.demo_video_url ? <video src={featured.demo_video_url} poster={featured.thumbnail_url} autoPlay muted loop playsInline preload="metadata" aria-label={`${featured.full_name} mentor preview`} /> : <img src={featured.thumbnail_url || "/media/math-studio.svg"} alt="" />}
              <span><i /> Teaching preview</span>
              <DemoVideo src={featured.demo_video_url} poster={featured.thumbnail_url} title={`${featured.full_name} teaching preview`} variant="icon" />
            </div>
            <div className="directory-feature-caption"><div><small>Featured mentor</small><strong>{featured.full_name}</strong></div><Link to={`/tutors/${featured.user_id}`}>View profile</Link></div>
          </> : <div className="directory-feature-placeholder"><CirclePlay size={30} /><span>Mentor previews load here</span></div>}
          <div className="directory-feature-note"><Sparkles size={15} /><span><strong>A profile can tell you what.</strong> A preview helps you see how.</span></div>
        </div>
      </div>
    </header>
    <section className="container discovery-body">
      <button ref={filterButtonRef} type="button" className="mobile-filter-button" aria-expanded={filtersOpen} aria-controls="tutor-filter-panel" onClick={() => setFiltersOpen(!filtersOpen)}><Filter size={16} /> Refine results {activeCount > 0 && <b>{activeCount}</b>}</button>
      {filtersOpen && <button type="button" className="filter-scrim" aria-label="Close filters" onClick={() => setFiltersOpen(false)} />}
      <aside ref={filterPanelRef} id="tutor-filter-panel" className={filtersOpen ? "filter-sidebar is-open" : "filter-sidebar"} aria-label="Tutor filters">
        <div className="filter-heading"><span><SlidersHorizontal size={17} /> Refine your match</span><button type="button" onClick={() => setFiltersOpen(false)} className="filter-mobile-close" aria-label="Close tutor filters"><X size={17} /></button></div>
        <p className="filter-intro">Start broad, then narrow by the details that matter to your week.</p>
        <label className="filter-control"><span>Subject</span><select name="subject" value={filters.subject} onChange={change}><option value="">All subjects</option>{subjects.map((subject) => <option key={subject}>{subject}</option>)}</select><ChevronDown size={14} /></label>
        <div className="filter-control"><span>Teaching mode</span><div className="segmented-filter"><button className={!filters.mode ? "active" : ""} onClick={() => setFilters((current) => ({ ...current, mode: "" }))} type="button">Any</button><button className={filters.mode === "online" ? "active" : ""} onClick={() => setFilters((current) => ({ ...current, mode: "online" }))} type="button">Online</button><button className={filters.mode === "offline" ? "active" : ""} onClick={() => setFilters((current) => ({ ...current, mode: "offline" }))} type="button">Offline</button></div></div>
        <label className="filter-control"><span>Location</span><div className="input-with-icon"><MapPin size={15} /><input name="location" value={filters.location} onChange={change} placeholder="e.g. Dhanmondi" /></div></label>
        <label className="filter-control"><span>Maximum hourly rate</span><div className="price-input"><b>৳</b><input name="maxPrice" type="number" min="0" value={filters.maxPrice} onChange={change} placeholder="Any budget" /></div></label>
        <label className="filter-control"><span>Minimum rating</span><select name="minRating" value={filters.minRating} onChange={change}><option value="">Any rating</option><option value="4">4.0 and above</option><option value="4.5">4.5 and above</option></select><ChevronDown size={14} /></label>
        <div className="filter-note"><BadgeCheck size={18} /><p><strong>What verified means</strong><small>The mentor submitted professional information for admin review.</small></p></div>
        <button type="button" className="filter-clear" onClick={clear}><RotateCcw size={14} /> Reset all filters</button>
      </aside>
      <div className="discovery-results">
        <div className="results-toolbar"><div><span className="results-kicker">Curated marketplace</span><strong>{loading ? "Finding mentors…" : `${results.length} mentor${results.length === 1 ? "" : "s"} to explore`}</strong><p>Each card includes a teaching preview when one is available.</p></div><label>Sort by <select value={sort} onChange={(event) => setSort(event.target.value)}><option value="recommended">Recommended</option><option value="rating">Highest rated</option><option value="price">Lowest rate</option><option value="experience">Most experienced</option></select></label></div>
        {activeCount > 0 && <div className="active-filters" aria-label="Active filters">{Object.entries(filters).filter(([, value]) => value).map(([key, value]) => <button type="button" key={key} onClick={() => setFilters((current) => ({ ...current, [key]: "" }))}><span>{key === "q" ? "Search" : key.replace(/([A-Z])/g, " $1")}</span>{value}<X size={12} /></button>)}</div>}
        <Alert>{error}</Alert>{loading ? <LoadingSpinner label="Loading tutors" /> : results.length ? <div className="card-grid tutor-grid">{results.map((tutor) => <TutorCard key={tutor.user_id} tutor={tutor} previewVideo />)}</div> : <EmptyState title="No matching mentors" text="Try removing one or two filters to open up the directory." />}
      </div>
    </section>
  </main>;
}
