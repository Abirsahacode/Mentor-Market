import { ArrowRight, Bookmark, Search, Sparkles, Video, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api, { getErrorMessage } from "../api/axios.js";
import Alert from "../components/Alert.jsx";
import CoursePin from "../components/CoursePin.jsx";
import EmptyState from "../components/EmptyState.jsx";
import LoadingSpinner from "../components/LoadingSpinner.jsx";
import useApi from "../hooks/useApi.js";

const normalizeCourse = (item) => ({
  ...item,
  id: Number(item.course_id || item.tutor_post_id || item.id),
  tutor: item.tutor || {
    id: item.tutor_id,
    full_name: item.tutor_name,
    avatar_url: item.tutor_avatar_url || item.avatar_url,
    average_rating: item.average_rating,
    is_verified: item.is_verified,
  },
});

export default function SavedCoursesPage() {
  const saved = useApi("/course-engagement/saved");
  const [message, setMessage] = useState("");
  const [query, setQuery] = useState("");
  const [subject, setSubject] = useState("All");
  const [sort, setSort] = useState("recent");
  const courses = useMemo(() => saved.data.map(normalizeCourse), [saved.data]);
  const subjects = useMemo(() => ["All", ...new Set(courses.map((course) => course.subject).filter(Boolean))], [courses]);

  const visibleCourses = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const matches = courses.filter((course) => (!normalized
      || `${course.title} ${course.subject} ${course.tutor?.full_name || ""}`.toLowerCase().includes(normalized))
      && (subject === "All" || course.subject === subject));
    return [...matches].sort((a, b) => {
      if (sort === "rating") return Number(b.tutor?.average_rating || 0) - Number(a.tutor?.average_rating || 0);
      if (sort === "price") return Number(a.price || 0) - Number(b.price || 0);
      return Number(b.saved_at ? new Date(b.saved_at) : b.id) - Number(a.saved_at ? new Date(a.saved_at) : a.id);
    });
  }, [courses, query, sort, subject]);

  const remove = async (course) => {
    const previous = saved.data;
    setMessage("");
    saved.setData((items) => items.filter((item) => Number(item.course_id || item.tutor_post_id || item.id) !== Number(course.id)));
    try {
      await api.delete(`/course-engagement/saved/${course.id}`);
      setMessage("Removed from your learning library.");
    } catch (requestError) {
      saved.setData(previous);
      setMessage(getErrorMessage(requestError));
    }
  };

  return (
    <section className="saved-course-page">
      <header className="saved-course-hero">
        <div className="saved-course-mark"><Bookmark size={24} fill="currentColor" /><span>PRIVATE LEARNING LIBRARY</span></div>
        <div className="saved-course-title">
          <div><span>YOUR EDIT / {String(courses.length).padStart(2, "0")}</span><h1>Classes worth<br />{" "}coming back to.</h1></div>
          <p>Your quiet corner of Mentor Market. Rewatch the previews, compare the teaching, and book when the choice feels obvious.</p>
        </div>
        <div className="saved-course-hero-footer">
          <span><Video size={16} /> {courses.filter((course) => course.demo_video_url).length} video previews</span>
          <span><Sparkles size={16} /> Synced to your account</span>
          <Link to="/student/discover">Keep discovering <ArrowRight size={15} /></Link>
        </div>
      </header>

      <Alert type={message.includes("Removed") ? "success" : "error"}>{message}</Alert>
      <Alert>{saved.error}</Alert>

      {!saved.loading && courses.length > 0 && (
        <div className="saved-course-toolbar">
          <label>
            <Search size={18} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search your library" aria-label="Search saved courses" />
            {query && <button type="button" onClick={() => setQuery("")} aria-label="Clear search"><X size={15} /></button>}
          </label>
          <div className="saved-subjects" aria-label="Filter saved courses by subject">
            {subjects.map((item) => <button type="button" className={subject === item ? "active" : ""} onClick={() => setSubject(item)} key={item}>{item}</button>)}
          </div>
          <select value={sort} onChange={(event) => setSort(event.target.value)} aria-label="Sort saved courses">
            <option value="recent">Recently saved</option>
            <option value="rating">Highest rated</option>
            <option value="price">Lowest price</option>
          </select>
        </div>
      )}

      {saved.loading ? (
        <LoadingSpinner label="Opening your learning library" />
      ) : visibleCourses.length ? (
        <>
          <div className="saved-course-heading"><span>THE SHORTLIST</span><p>{visibleCourses.length} {visibleCourses.length === 1 ? "course" : "courses"} in this view</p></div>
          <div className="course-masonry saved-course-masonry">
            {visibleCourses.map((course, index) => <CoursePin course={course} index={index} saved onToggleSave={remove} key={course.id} />)}
          </div>
        </>
      ) : courses.length ? (
        <EmptyState icon={Search} title="No saved course matches" text="Try another subject or clear your library search." />
      ) : (
        <div className="saved-course-empty">
          <div className="saved-course-empty-film"><Bookmark size={30} /><span>00</span></div>
          <div><span>YOUR FIRST SAVE STARTS HERE</span><h2>Build a library around how you want to learn.</h2><p>Browse real teaching previews, then bookmark the mentors and classes that make difficult ideas feel possible.</p><Link to="/student/discover">Explore the moving catalog <ArrowRight size={16} /></Link></div>
        </div>
      )}
    </section>
  );
}
