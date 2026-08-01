import {
  ArrowRight, BadgeCheck, BarChart3, Bookmark, Check, ChevronDown,
  Clock3, GitCompare, Play, RotateCcw, Search, SlidersHorizontal,
  Sparkles, Star, Video, X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import api, { getErrorMessage } from "../api/axios.js";
import Alert from "../components/Alert.jsx";
import CourseArtwork from "../components/CourseArtwork.jsx";
import CoursePin from "../components/CoursePin.jsx";
import DemoVideo from "../components/DemoVideo.jsx";
import EmptyState from "../components/EmptyState.jsx";
import Skeleton, { SkeletonCard } from "../components/Skeleton.jsx";
import useApi from "../hooks/useApi.js";
import useAuth from "../hooks/useAuth.js";
import { firstDisplayName } from "../utils/formatters.js";

const greeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
};

const readInterests = () => {
  try { return JSON.parse(localStorage.getItem("mentor_market_interests") || "[]"); }
  catch { return []; }
};

const courseId = (course) => Number(course.course_id || course.tutor_post_id || course.id);
const formatRating = (course) => Number(course.tutor?.average_rating || 0).toFixed(1);

const focusableSelector = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

function useAccessibleDialog(open, onClose) {
  const dialogRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    const dialog = dialogRef.current;
    const focusable = () => [...(dialog?.querySelectorAll(focusableSelector) || [])];
    const frame = window.requestAnimationFrame(() => {
      const first = focusable()[0];
      (first || dialog)?.focus();
    });
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab") return;
      const items = focusable();
      if (!items.length) {
        event.preventDefault();
        dialog?.focus();
        return;
      }
      const first = items[0];
      const last = items.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      window.cancelAnimationFrame(frame);
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      if (previousFocus instanceof HTMLElement) previousFocus.focus();
    };
  }, [onClose, open]);

  return dialogRef;
}

export default function CourseDiscoveryPage() {
  const { user } = useAuth();
  const catalog = useApi("/tutor-posts?status=active&limit=100");
  const saved = useApi("/course-engagement/saved");
  const recent = useApi("/course-engagement/recent?limit=6");
  const progress = useApi("/students/progress", {});
  const courses = catalog.data;

  const [query, setQuery] = useState("");
  const [subject, setSubject] = useState("All");
  const [sort, setSort] = useState("recommended");
  const [mode, setMode] = useState("all");
  const [trialOnly, setTrialOnly] = useState(false);
  const [maxPrice, setMaxPrice] = useState(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [displayCount, setDisplayCount] = useState(8);
  const [interests, setInterests] = useState(readInterests);
  const [draftInterests, setDraftInterests] = useState(interests);
  const [personalizeOpen, setPersonalizeOpen] = useState(false);
  const [compared, setCompared] = useState([]);
  const [compareOpen, setCompareOpen] = useState(false);
  const closePreferences = useCallback(() => setPersonalizeOpen(false), []);
  const closeComparison = useCallback(() => setCompareOpen(false), []);
  const preferenceDialogRef = useAccessibleDialog(personalizeOpen, closePreferences);
  const comparisonDialogRef = useAccessibleDialog(compareOpen, closeComparison);

  const subjects = useMemo(
    () => ["All", ...new Set(courses.map((course) => course.subject).filter(Boolean))],
    [courses],
  );
  const savedIds = useMemo(() => new Set(saved.data.map(courseId)), [saved.data]);
  const maxCatalogPrice = Math.max(1000, ...courses.map((course) => Number(course.price || 0)));
  const activeFilterCount = Number(mode !== "all") + Number(trialOnly) + Number(maxPrice !== null);

  const visibleCourses = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const filtered = courses.filter((course) => {
      const tutorName = course.tutor?.full_name || "";
      const haystack = `${course.title} ${course.subject} ${course.level} ${course.description} ${tutorName}`.toLowerCase();
      const matchesMode = mode === "all" || course.teaching_mode === mode || course.teaching_mode === "both";
      return (!normalized || haystack.includes(normalized))
        && (subject === "All" || course.subject === subject)
        && matchesMode
        && (!trialOnly || Boolean(course.has_trial))
        && (maxPrice === null || Number(course.price) <= maxPrice);
    });

    return [...filtered].sort((a, b) => {
      if (sort === "rating") return Number(b.tutor?.average_rating || 0) - Number(a.tutor?.average_rating || 0);
      if (sort === "price") return Number(a.price) - Number(b.price);
      if (sort === "newest") return Number(b.id) - Number(a.id);
      const score = (course) => Number(interests.includes(course.subject)) * 12
        + Number(course.tutor?.is_verified) * 3
        + Number(course.has_trial) * 2
        + Number(course.tutor?.average_rating || 0);
      return score(b) - score(a);
    });
  }, [courses, interests, maxPrice, mode, query, sort, subject, trialOnly]);

  useEffect(() => { setDisplayCount(8); }, [query, subject, sort, mode, trialOnly, maxPrice]);

  const spotlight = courses.find((course) => interests.includes(course.subject) && course.demo_video_url)
    || courses.find((course) => course.demo_video_url)
    || courses[0];
  const spotlightTutor = spotlight?.tutor || {};

  const toggleSave = async (course) => {
    const id = courseId(course);
    const wasSaved = savedIds.has(id);
    const previous = saved.data;
    setMessage("");
    saved.setData((items) => (wasSaved
      ? items.filter((item) => courseId(item) !== id)
      : [{ ...course, course_id: id }, ...items]));
    try {
      if (wasSaved) {
        await api.delete(`/course-engagement/saved/${id}`);
        setMessage("Removed from your library.");
      } else {
        await api.put(`/course-engagement/saved/${id}`);
        setMessage("Saved to your learning library.");
      }
    } catch (requestError) {
      saved.setData(previous);
      setMessage(getErrorMessage(requestError));
    }
  };

  const toggleCompare = (course) => {
    setMessage("");
    if (compared.some((item) => Number(item.id) === Number(course.id))) {
      setCompared((items) => items.filter((item) => Number(item.id) !== Number(course.id)));
      return;
    }
    if (compared.length >= 3) {
      setMessage("Your comparison board can hold three courses at a time.");
      return;
    }
    setCompared((items) => [...items, course]);
  };

  const saveInterests = () => {
    setInterests(draftInterests);
    localStorage.setItem("mentor_market_interests", JSON.stringify(draftInterests));
    setPersonalizeOpen(false);
    setSort("recommended");
    setMessage("Your learning feed has been retuned.");
  };

  const clearFilters = () => {
    setMode("all");
    setTrialOnly(false);
    setMaxPrice(null);
  };

  const clearAllFilters = () => {
    setQuery("");
    setSubject("All");
    clearFilters();
  };

  const shownCourses = visibleCourses.slice(0, displayCount);
  const isPositiveMessage = /saved|removed|retuned/i.test(message);
  const hasCatalogFilters = Boolean(query.trim()) || subject !== "All" || activeFilterCount > 0;

  return (
    <section className="course-discovery-page">
      <header className="course-feed-hero">
        <div className="course-feed-edition" aria-hidden="true">
          <span>MENTOR MARKET / COURSE DISCOVERY</span>
          <span>{catalog.loading ? "—" : String(courses.length).padStart(2, "0")} TEACHING PREVIEWS</span>
        </div>

        <div className="course-feed-copy">
          <span className="course-feed-eyebrow"><Sparkles size={15} /> {greeting()}, {firstDisplayName(user.full_name)}</span>
          <h1>Find a teaching style <span>that clicks.</span></h1>
          <p>Watch real course previews, compare the details that matter, and choose a mentor with more confidence.</p>
          <label className="course-feed-search">
            <Search size={20} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Try ‘calculus’, ‘IELTS’, or a mentor name"
              aria-label="Search the course catalog"
            />
            {query && <button type="button" onClick={() => setQuery("")}>Clear</button>}
          </label>
        </div>

        <article className="course-spotlight">
          {catalog.loading ? (
            <div className="course-spotlight-placeholder" role="status" aria-label="Loading featured course preview">
              <Skeleton variant="media" />
              <Skeleton variant="title" className="skeleton-medium" />
            </div>
          ) : spotlight ? (
            <>
              <div className="course-spotlight-media">
                {spotlightTutor.avatar_url
                  ? <img className="course-spotlight-portrait" src={spotlightTutor.avatar_url} alt={`${spotlightTutor.full_name}, ${spotlight.subject} mentor`} />
                  : <CourseArtwork subject={spotlight.subject} decorative={false} />}
                <span className="course-spotlight-signal"><i /> Featured preview</span>
                <DemoVideo src={spotlight.demo_video_url} title={spotlight.title} variant="icon" />
              </div>
              <div className="course-spotlight-copy">
                <div>
                  <small>{spotlight.subject} · {spotlight.level}</small>
                  <span>{spotlightTutor.is_verified && <BadgeCheck size={14} />} {spotlightTutor.full_name || "Mentor Market mentor"}</span>
                </div>
                <strong>{spotlight.title}</strong>
                <div className="course-spotlight-footer">
                  <span><Star size={13} fill="currentColor" /> {formatRating(spotlight)} · ৳{Number(spotlight.price || 0).toLocaleString()}</span>
                  <Link to={`/student/courses/${spotlight.id}`} aria-label={`Explore ${spotlight.title}`}><ArrowRight size={17} /></Link>
                </div>
              </div>
            </>
          ) : (
            <div className="course-spotlight-placeholder"><Video size={28} /><span>Course previews will appear here.</span></div>
          )}
        </article>
      </header>

      <div className="learning-pulse" aria-busy={recent.loading || saved.loading || progress.loading}>
        {recent.loading ? (
          <div className="learning-pulse-label" role="status" aria-label="Loading recent learning activity">
            <Skeleton className="skeleton-short" />
            <Skeleton className="skeleton-medium" />
          </div>
        ) : recent.data[0] ? (
          <Link className="learning-pulse-label learning-pulse-continue" to={`/student/courses/${courseId(recent.data[0])}`}>
            <span className="learning-pulse-thumb"><CourseArtwork subject={recent.data[0].subject} /></span>
            <div><small>Continue learning</small><strong>{recent.data[0].title}</strong></div>
            <ArrowRight size={16} />
          </Link>
        ) : (
          <div className="learning-pulse-label"><span>YOUR LEARNING</span><strong>Everything in one place</strong></div>
        )}
        <button type="button" onClick={() => { setDraftInterests(interests); setPersonalizeOpen(true); }}>
          <span><Sparkles size={18} /></span>
          <div><small>Interests</small><strong>{interests.length ? interests.slice(0, 2).join(" + ") : "Tune your feed"}</strong></div>
          <ChevronDown size={16} />
        </button>
        <Link to="/student/saved-courses">
          <span><Bookmark size={18} /></span>
          <div><small>Saved for later</small><strong>{saved.loading ? <Skeleton className="skeleton-medium" /> : `${saved.data.length} courses`}</strong></div>
          <ArrowRight size={16} />
        </Link>
        <Link to="/student/progress">
          <span><BarChart3 size={18} /></span>
          <div><small>Performance</small><strong>{progress.loading ? <Skeleton className="skeleton-medium" /> : `${Number(progress.data?.average_performance || 0)}% average`}</strong></div>
          <ArrowRight size={16} />
        </Link>
      </div>

      <div className="course-feed-notices" aria-live="polite">
        <Alert type={isPositiveMessage ? "success" : "error"}>{message}</Alert>
        <Alert>{catalog.error}</Alert>
      </div>

      <div className="course-feed-heading">
        <div>
          <span>ALL COURSES</span>
          <h2>{subject === "All" ? "Compare courses before you commit" : `${subject}, taught differently`}</h2>
        </div>
        <p>{catalog.loading ? "Curating your feed…" : `${visibleCourses.length} matches · video previews included`}</p>
      </div>

      <div className="course-feed-controls">
        <div className="course-topic-scroll" aria-label="Course subjects">
          {subjects.map((item) => (
            <button type="button" className={subject === item ? "active" : ""} aria-pressed={subject === item} onClick={() => setSubject(item)} key={item}>
              {item}{item !== "All" && <small>{courses.filter((course) => course.subject === item).length}</small>}
            </button>
          ))}
        </div>
        <button type="button" className={`course-filter-toggle ${activeFilterCount ? "active" : ""}`} onClick={() => setFiltersOpen(!filtersOpen)} aria-expanded={filtersOpen} aria-controls="course-advanced-filters">
          <SlidersHorizontal size={15} /> Filters{activeFilterCount ? <b>{activeFilterCount}</b> : null}
        </button>
        <label className="course-sort">
          <span>Order</span>
          <select value={sort} onChange={(event) => setSort(event.target.value)}>
            <option value="recommended">For you</option>
            <option value="rating">Top rated</option>
            <option value="price">Lowest price</option>
            <option value="newest">Newest</option>
          </select>
        </label>
      </div>

      {filtersOpen && (
        <div className="course-advanced-filters" id="course-advanced-filters">
          <div>
            <span>Teaching format</span>
            <div className="course-mode-options">
              {["all", "online", "offline"].map((item) => <button type="button" className={mode === item ? "active" : ""} aria-pressed={mode === item} onClick={() => setMode(item)} key={item}>{item}</button>)}
            </div>
          </div>
          <label className="course-trial-filter">
            <input type="checkbox" checked={trialOnly} onChange={(event) => setTrialOnly(event.target.checked)} />
            <span><Check size={13} /></span>
            <div><strong>Trial class available</strong><small>Meet first, decide after</small></div>
          </label>
          <label className="course-price-filter">
            <span>Maximum class price <b>{maxPrice === null ? "No limit" : `৳${maxPrice.toLocaleString()}`}</b></span>
            <input type="range" min="500" max={Math.max(maxCatalogPrice, 1000)} step="50" value={maxPrice ?? Math.max(maxCatalogPrice, 1000)} onChange={(event) => setMaxPrice(Number(event.target.value))} />
          </label>
          <button type="button" className="course-filter-reset" onClick={clearFilters}><RotateCcw size={14} /> Reset all</button>
        </div>
      )}

      {catalog.loading ? (
        <SkeletonCard count={8} label="Curating your course feed" />
      ) : catalog.error && !courses.length ? (
        <EmptyState
          icon={RotateCcw}
          title="The course catalog could not load"
          description="Try again to restore the latest mentor courses and teaching previews."
          action={<button type="button" className="button button-ghost" onClick={catalog.reload}>Try again</button>}
        />
      ) : visibleCourses.length ? (
        <>
          <div className="course-masonry">
            {shownCourses.map((course, index) => (
              <CoursePin
                course={course}
                index={index}
                saved={savedIds.has(Number(course.id))}
                compared={compared.some((item) => Number(item.id) === Number(course.id))}
                onToggleSave={toggleSave}
                onToggleCompare={toggleCompare}
                key={course.id}
              />
            ))}
          </div>
          {displayCount < visibleCourses.length && (
            <div className="course-load-more">
              <button type="button" onClick={() => setDisplayCount((count) => count + 8)}>Reveal the next edit <ArrowRight size={15} /></button>
              <span>{shownCourses.length} of {visibleCourses.length} courses on the wall</span>
            </div>
          )}
        </>
      ) : courses.length && hasCatalogFilters ? (
        <EmptyState
          icon={Search}
          title="No courses match these filters"
          description="Try another subject, widen your price range, or reset the current search."
          action={<button type="button" className="button button-ghost" onClick={clearAllFilters}>Reset filters</button>}
        />
      ) : (
        <EmptyState
          icon={Video}
          title="No courses are available yet"
          description="Tell mentors what you want to learn while new course previews are being prepared."
          action={<Link className="button button-ghost" to="/student/create-request">Post what you need</Link>}
        />
      )}

      {recent.data.length > 1 && (
        <section className="recent-course-section recent-course-section-lower">
          <div className="recent-course-head">
            <div><span>VIEWING HISTORY</span><h2>More from your recent activity</h2></div>
            <small>Synced across your devices</small>
          </div>
          <div className="recent-course-rail">
            {recent.data.slice(1).map((course, index) => (
              <Link to={`/student/courses/${courseId(course)}`} key={courseId(course)}>
                <span className="recent-course-thumb">
                  <CourseArtwork subject={course.subject} />
                  <i><Play size={12} fill="currentColor" /></i>
                </span>
                <div>
                  <small>{String(index + 2).padStart(2, "0")} / {course.subject}</small>
                  <strong>{course.title}</strong>
                  <span>Open preview <ArrowRight size={12} /></span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {compared.length > 0 && (
        <aside className="course-compare-tray" aria-label="Course comparison board">
          <div><GitCompare size={18} /><span><strong>Comparison board</strong><small>{compared.length} of 3 selected</small></span></div>
          <div className="course-compare-thumbs">
            {compared.map((course) => (
              <button type="button" onClick={() => toggleCompare(course)} title={`Remove ${course.title}`} key={course.id}>
                <CourseArtwork subject={course.subject} /><X size={12} />
              </button>
            ))}
          </div>
          <button type="button" className="course-compare-action" disabled={compared.length < 2} onClick={() => setCompareOpen(true)}>Compare side by side</button>
        </aside>
      )}

      {personalizeOpen && (
        <div className="modal-backdrop preference-backdrop" onMouseDown={closePreferences}>
          <section ref={preferenceDialogRef} className="preference-dialog" role="dialog" aria-modal="true" aria-labelledby="preference-title" tabIndex="-1" onMouseDown={(event) => event.stopPropagation()}>
            <button type="button" className="modal-close" onClick={closePreferences} aria-label="Close preferences"><X size={18} /></button>
            <span className="eyebrow">Shape the edit</span>
            <h2 id="preference-title">What deserves more space in your feed?</h2>
            <p>Choose the subjects you want to move toward. Recommendations reorder instantly around your intent.</p>
            <div className="preference-subjects">
              {subjects.filter((item) => item !== "All").map((item) => (
                <button type="button" className={draftInterests.includes(item) ? "active" : ""} onClick={() => setDraftInterests((current) => current.includes(item) ? current.filter((value) => value !== item) : [...current, item])} key={item}>
                  {draftInterests.includes(item) ? <Check size={15} /> : <span />}{item}
                </button>
              ))}
            </div>
            <button type="button" className="preference-save" onClick={saveInterests}>Retune my recommendations <ArrowRight size={16} /></button>
          </section>
        </div>
      )}

      {compareOpen && (
        <div className="modal-backdrop course-compare-backdrop" onMouseDown={closeComparison}>
          <section ref={comparisonDialogRef} className="course-compare-dialog" role="dialog" aria-modal="true" aria-labelledby="compare-title" tabIndex="-1" onMouseDown={(event) => event.stopPropagation()}>
            <div className="course-compare-dialog-head">
              <div><span className="eyebrow">Side by side</span><h2 id="compare-title">A closer look at your shortlist</h2><p>Compare the details that matter before you meet the mentor.</p></div>
              <button type="button" onClick={closeComparison} aria-label="Close comparison"><X size={20} /></button>
            </div>
            <div className="course-compare-grid">
              {compared.map((course, index) => (
                <article key={course.id}>
                  <div className="course-compare-cover"><CourseArtwork subject={course.subject} /><span>{String(index + 1).padStart(2, "0")}</span></div>
                  <small>{course.subject}</small><h3>{course.title}</h3>
                  <dl>
                    <div><dt>Mentor</dt><dd>{course.tutor?.full_name}</dd></div>
                    <div><dt>Rating</dt><dd>{Number(course.tutor?.average_rating || 0).toFixed(1)} / 5</dd></div>
                    <div><dt>Price</dt><dd>৳{Number(course.price).toLocaleString()}</dd></div>
                    <div><dt>Format</dt><dd>{course.teaching_mode}</dd></div>
                    <div><dt>Trial</dt><dd>{course.has_trial ? "Available" : "Not included"}</dd></div>
                    <div><dt>Schedule</dt><dd>{course.availability}</dd></div>
                  </dl>
                  <Link className="course-compare-link" to={`/student/courses/${course.id}`}>Open course <ArrowRight size={15} /></Link>
                </article>
              ))}
            </div>
          </section>
        </div>
      )}
    </section>
  );
}
