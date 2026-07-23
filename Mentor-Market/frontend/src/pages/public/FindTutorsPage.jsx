import {
  BadgeCheck, CalendarDays, ChevronDown, Filter, MapPin, RotateCcw, Search, SlidersHorizontal, X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Alert from "../../components/Alert.jsx";
import EmptyState from "../../components/EmptyState.jsx";
import LoadingSpinner from "../../components/LoadingSpinner.jsx";
import Pagination from "../../components/Pagination.jsx";
import TutorCard from "../../components/TutorCard.jsx";
import useApi from "../../hooks/useApi.js";
import useDebouncedValue from "../../hooks/useDebouncedValue.js";
import useReducedMotion from "../../hooks/useReducedMotion.js";

// Shown immediately while /tutors/subjects loads (and used as a fallback if
// that request ever fails), so the filter panel is never empty. The real
// source of truth is the backend, which derives the list from active tutor
// profiles instead of a value that silently drifts out of date here.
const fallbackSubjects = ["Mathematics", "Physics", "English", "Chemistry", "IELTS", "Programming"];
const days = [["mon", "Mon"], ["tue", "Tue"], ["wed", "Wed"], ["thu", "Thu"], ["fri", "Fri"], ["sat", "Sat"], ["sun", "Sun"]];
const emptyFilters = { q: "", subject: "", mode: "", location: "", minPrice: "", maxPrice: "", minRating: "", days: "" };

export default function FindTutorsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const reducedMotion = useReducedMotion();
  const filters = useMemo(
    () => Object.fromEntries(Object.keys(emptyFilters).map((key) => [key, searchParams.get(key) || ""])),
    [searchParams],
  );
  const sort = searchParams.get("sort") || "recommended";
  const page = Math.max(Number.parseInt(searchParams.get("page"), 10) || 1, 1);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filterButtonRef = useRef(null);
  const filterPanelRef = useRef(null);

  // Free-text inputs are debounced so every keystroke doesn't trigger a
  // request; selects, chips, and toggles apply immediately since they don't
  // suffer from the same "typing storm" problem.
  const debouncedQuery = useDebouncedValue(filters.q);
  const debouncedLocation = useDebouncedValue(filters.location);
  const debouncedMinPrice = useDebouncedValue(filters.minPrice);
  const debouncedMaxPrice = useDebouncedValue(filters.maxPrice);

  const query = useMemo(() => new URLSearchParams(Object.entries({
    ...filters,
    q: debouncedQuery,
    location: debouncedLocation,
    minPrice: debouncedMinPrice,
    maxPrice: debouncedMaxPrice,
    page,
    limit: 12,
    sort,
  }).filter(([, value]) => value !== "")).toString(), [debouncedLocation, debouncedMaxPrice, debouncedMinPrice, debouncedQuery, filters, page, sort]);

  const { data, meta, loading, error } = useApi(`/tutors?${query}`);
  const { data: subjectOptions } = useApi("/tutors/subjects", fallbackSubjects);
  const subjects = subjectOptions?.length ? subjectOptions : fallbackSubjects;

  const updateParams = (updates, keepPage = false) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => (value ? next.set(key, value) : next.delete(key)));
    if (!keepPage) next.delete("page");
    setSearchParams(next, { replace: true });
  };
  const change = (event) => updateParams({ [event.target.name]: event.target.value });
  const clear = () => setSearchParams(sort === "recommended" ? {} : { sort }, { replace: true });

  const selectedSubjects = filters.subject ? filters.subject.split(",") : [];
  const toggleSubject = (subject) => updateParams({
    subject: selectedSubjects.includes(subject)
      ? selectedSubjects.filter((item) => item !== subject).join(",")
      : [...selectedSubjects, subject].join(","),
  });
  const selectedDays = filters.days ? filters.days.split(",") : [];
  const toggleDay = (day) => updateParams({
    days: selectedDays.includes(day) ? selectedDays.filter((item) => item !== day).join(",") : [...selectedDays, day].join(","),
  });

  const activeCount = Object.values(filters).filter(Boolean).length;
  const results = data || [];
  const total = meta?.total ?? results.length;
  const pages = meta?.pages ?? 1;
  const changePage = (nextPage) => {
    updateParams({ page: String(nextPage) }, true);
    window.requestAnimationFrame(() => document.querySelector(".discovery-results")?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" }));
  };

  useEffect(() => {
    if (!filtersOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    const focusFrame = window.requestAnimationFrame(() => {
      filterPanelRef.current?.querySelector("button, select, input")?.focus();
    });
    const handleDialogKeys = (event) => {
      if (event.key === "Escape") setFiltersOpen(false);
      if (event.key !== "Tab") return;
      const focusable = [...(filterPanelRef.current?.querySelectorAll("a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex='-1'])") || [])];
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleDialogKeys);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleDialogKeys);
      filterButtonRef.current?.focus();
    };
  }, [filtersOpen]);

  return <main className="discovery-page">
    <header className="marketplace-header directory-header">
      <div className="container marketplace-header-grid">
        <div className="marketplace-header-copy">
          <span className="page-index"><i /> Independent mentors across Bangladesh</span>
          <h1>Find a teaching style<br /><em>that feels right.</em></h1>
          <p>Search by subject or mentor, then refine the details that matter to your schedule and budget.</p>
          <form className="marketplace-search" onSubmit={(event) => { event.preventDefault(); document.querySelector(".discovery-results")?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" }); }}>
            <Search size={19} /><input aria-label="Search mentors" name="q" value={filters.q} onChange={change} placeholder="Search a subject, mentor, or qualification" /><button type="submit">Search</button>
          </form>
          <div className="directory-quick-topics">{fallbackSubjects.slice(0, 4).map((subject) => <button className={selectedSubjects.includes(subject) ? "active" : ""} aria-pressed={selectedSubjects.includes(subject)} type="button" key={subject} onClick={() => toggleSubject(subject)}>{subject}</button>)}</div>
        </div>
      </div>
    </header>
    <section className="container discovery-body">
      <button ref={filterButtonRef} type="button" className="mobile-filter-button" aria-expanded={filtersOpen} aria-controls="tutor-filter-panel" onClick={() => setFiltersOpen(!filtersOpen)}><Filter size={16} /> Refine results {activeCount > 0 && <b>{activeCount}</b>}</button>
      {filtersOpen && <button type="button" className="filter-scrim" aria-label="Close filters" onClick={() => setFiltersOpen(false)} />}
      <aside ref={filterPanelRef} id="tutor-filter-panel" className={filtersOpen ? "filter-sidebar is-open" : "filter-sidebar"} aria-labelledby="tutor-filter-title" aria-modal={filtersOpen ? "true" : undefined} role={filtersOpen ? "dialog" : undefined}>
        <div className="filter-heading"><span id="tutor-filter-title"><SlidersHorizontal size={17} /> Refine your match</span><button type="button" onClick={() => setFiltersOpen(false)} className="filter-mobile-close" aria-label="Close tutor filters"><X size={17} /></button></div>
        <p className="filter-intro">Start broad, then narrow by the details that matter to your week.</p>

        <div className="filter-control">
          <span>Subjects</span>
          <div className="filter-chip-row" role="group" aria-label="Filter by subject">
            {subjects.map((subject) => <button key={subject} type="button" className={selectedSubjects.includes(subject) ? "active" : ""} aria-pressed={selectedSubjects.includes(subject)} onClick={() => toggleSubject(subject)}>{subject}</button>)}
          </div>
        </div>

        <div className="filter-control"><span>Teaching mode</span><div className="segmented-filter"><button className={!filters.mode ? "active" : ""} aria-pressed={!filters.mode} onClick={() => updateParams({ mode: "" })} type="button">Any</button><button className={filters.mode === "online" ? "active" : ""} aria-pressed={filters.mode === "online"} onClick={() => updateParams({ mode: "online" })} type="button">Online</button><button className={filters.mode === "offline" ? "active" : ""} aria-pressed={filters.mode === "offline"} onClick={() => updateParams({ mode: "offline" })} type="button">Offline</button></div></div>

        <label className="filter-control"><span>Location</span><div className="input-with-icon"><MapPin size={15} /><input name="location" value={filters.location} onChange={change} placeholder="e.g. Dhanmondi" /></div></label>

        <div className="filter-control">
          <span>Hourly rate (৳)</span>
          <div className="price-range-inputs">
            <div className="price-input"><b>৳</b><input name="minPrice" type="number" min="0" value={filters.minPrice} onChange={change} placeholder="Min" /></div>
            <div className="price-input"><b>৳</b><input name="maxPrice" type="number" min="0" value={filters.maxPrice} onChange={change} placeholder="Max" /></div>
          </div>
        </div>

        <label className="filter-control"><span>Minimum rating</span><select name="minRating" value={filters.minRating} onChange={change}><option value="">Any rating</option><option value="4">4.0 and above</option><option value="4.5">4.5 and above</option></select><ChevronDown size={14} /></label>

        <div className="filter-control">
          <span><CalendarDays size={13} /> Available on</span>
          <div className="filter-chip-row" role="group" aria-label="Filter by available day">
            {days.map(([value, label]) => <button key={value} type="button" className={selectedDays.includes(value) ? "active" : ""} aria-pressed={selectedDays.includes(value)} onClick={() => toggleDay(value)}>{label}</button>)}
          </div>
        </div>

        <div className="filter-note"><BadgeCheck size={18} /><p><strong>What verified means</strong><small>The mentor submitted professional information for admin review.</small></p></div>
        <button type="button" className="filter-clear" onClick={clear}><RotateCcw size={14} /> Reset all filters</button>
      </aside>
      <div className="discovery-results">
        <div className="results-toolbar"><div><span className="results-kicker">Mentor directory</span><strong>{loading ? "Finding mentors…" : `${total} mentor${total === 1 ? "" : "s"} to explore`}</strong><p>Open a profile to see classes, availability, reviews, and a teaching preview.</p></div><label>Sort by <select value={sort} onChange={(event) => updateParams({ sort: event.target.value === "recommended" ? "" : event.target.value })}><option value="recommended">Recommended</option><option value="rating">Highest rated</option><option value="price">Lowest rate</option><option value="experience">Most experienced</option><option value="newest">Newest mentors</option></select></label></div>
        {activeCount > 0 && <div className="active-filters" aria-label="Active filters">{Object.entries(filters).filter(([, value]) => value).map(([key, value]) => <button type="button" key={key} aria-label={`Remove ${key === "q" ? "search" : key.replace(/([A-Z])/g, " $1")} filter: ${value}`} onClick={() => updateParams({ [key]: "" })}><span>{key === "q" ? "Search" : key.replace(/([A-Z])/g, " $1")}</span>{value}<X size={12} /></button>)}</div>}
        <Alert>{error}</Alert>
        <div aria-live="polite" aria-busy={loading}>
          {loading ? <LoadingSpinner label="Loading tutors" /> : results.length ? <>
            <div className="card-grid tutor-grid">{results.map((tutor) => <TutorCard key={tutor.user_id} tutor={tutor} previewVideo />)}</div>
            <Pagination page={page} pages={pages} onChange={changePage} label="Mentor directory pages" />
          </> : <EmptyState title="No matching mentors" text="Try removing one or two filters to open up the directory." />}
        </div>
      </div>
    </section>
  </main>;
}
