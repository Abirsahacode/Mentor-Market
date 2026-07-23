import {
  ArrowRight, BadgeCheck, Banknote, BarChart3, BookOpenCheck, CalendarDays,
  CheckCircle2, Clock3, Compass, FileCheck2, MessageCircleMore, Plus, Search,
  ShieldAlert, ShieldCheck, UserPlus, UsersRound,
} from "lucide-react";
import { Link } from "react-router-dom";
import Alert from "../components/Alert.jsx";
import LiveClassAction from "../components/LiveClassAction.jsx";
import LoadingSpinner from "../components/LoadingSpinner.jsx";
import StatCard from "../components/StatCard.jsx";
import UserAvatar from "../components/UserAvatar.jsx";
import useApi from "../hooks/useApi.js";
import useAuth from "../hooks/useAuth.js";
import { firstDisplayName } from "../utils/formatters.js";
import { isLiveClassUrl } from "../utils/liveClass.js";

const today = () => new Date().toLocaleDateString("en-GB", {
  weekday: "long",
  day: "numeric",
  month: "long",
});
const activeBookingStatuses = new Set(["pending", "confirmed", "rescheduled"]);

const bookingStartTimestamp = (booking) => {
  const dateMatch = String(booking.class_date || "").match(/^(\d{4})-(\d{2})-(\d{2})/);
  const timeMatch = String(booking.class_time || "").match(/^(\d{1,2}):(\d{2})/);
  if (!dateMatch || !timeMatch) return Number.NaN;

  return new Date(
    Number(dateMatch[1]),
    Number(dateMatch[2]) - 1,
    Number(dateMatch[3]),
    Number(timeMatch[1]),
    Number(timeMatch[2]),
  ).getTime();
};

const bookingDateLabel = (booking) => {
  const startsAt = bookingStartTimestamp(booking);
  if (!Number.isFinite(startsAt)) return "Date to be confirmed";
  return new Date(startsAt).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
};

function TodayMasthead({
  role,
  displayName,
  title,
  description,
  actions,
  children,
}) {
  return (
    <article className={`dashboard-today dashboard-${role}-hero`}>
      <div className="dashboard-today-copy">
        <span className="dashboard-today-kicker">
          <i aria-hidden="true" />
          {today()} · {role === "admin" ? "Marketplace desk" : role === "tutor" ? "Teaching studio" : "Learning studio"}
        </span>
        <p className="dashboard-today-greeting">Hello, {displayName}</p>
        <h1>{title}</h1>
        <p className="dashboard-today-description">{description}</p>
        <div className="dashboard-hero-actions">{actions}</div>
      </div>
      {children}
    </article>
  );
}

function AdminDashboard({ displayName }) {
  const { data, loading, error } = useApi("/admin/dashboard", {});
  if (loading) return <LoadingSpinner label="Loading dashboard" />;

  const maxSubject = Math.max(...(data.popular_subjects || []).map((item) => Number(item.total)), 1);
  const attentionTotal = Number(data.pending_verifications || 0) + Number(data.open_reports || 0);

  return (
    <>
      <Alert>{error}</Alert>
      <TodayMasthead
        role="admin"
        displayName={displayName}
        title="Keep trust high and learning moving."
        description="Start with the records that need judgment. The rest of the marketplace can keep moving quietly in the background."
        actions={(
          <>
            <Link className="button" to="/admin/verifications"><BadgeCheck size={16} /> Review queue</Link>
            <Link className="button button-ghost" to="/admin/reports">Open safety desk</Link>
          </>
        )}
      >
        <aside className="dashboard-focus-card dashboard-admin-focus">
          <span className="dashboard-focus-label"><ShieldCheck size={15} /> Today’s review</span>
          <strong className="dashboard-focus-value">{attentionTotal}</strong>
          <h2>{attentionTotal === 1 ? "decision needs attention" : "decisions need attention"}</h2>
          <div className="dashboard-focus-split">
            <span><b>{data.pending_verifications || 0}</b> verifications</span>
            <span><b>{data.open_reports || 0}</b> reports</span>
          </div>
          <Link to="/admin/verifications">Open review workspace <ArrowRight size={15} /></Link>
        </aside>
      </TodayMasthead>

      <div className="stats-grid" aria-label="Marketplace summary">
        <StatCard icon={UsersRound} label="Users" value={data.total_users} hint={`${data.total_students || 0} students · ${data.total_tutors || 0} tutors`} tone="green" />
        <StatCard icon={CalendarDays} label="Bookings" value={data.total_bookings} hint="Across every status" tone="blue" />
        <StatCard icon={Banknote} label="Commission" value={`৳${Number(data.total_revenue || 0).toLocaleString()}`} hint={`${data.total_payments || 0} payments`} tone="amber" />
        <StatCard icon={BadgeCheck} label="Pending review" value={data.pending_verifications} hint="Mentor credentials" tone="purple" />
      </div>

      <div className="dashboard-two-column">
        <article className="panel analytics-panel">
          <div className="panel-heading">
            <div><span className="panel-eyebrow">Learning demand</span><h2>Popular subjects</h2></div>
            <span className="panel-period">All time</span>
          </div>
          <div className="analytics-bars">
            {data.popular_subjects?.map((item, index) => (
              <div key={item.subject}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <strong>{item.subject}</strong>
                <div><i style={{ width: `${Math.max((Number(item.total) / maxSubject) * 100, 4)}%` }} /></div>
                <b>{item.total}</b>
              </div>
            ))}
          </div>
        </article>

        <article className="panel trust-queue">
          <div className="panel-heading"><div><span className="panel-eyebrow">Priority desk</span><h2>Needs attention</h2></div></div>
          <Link to="/admin/verifications"><BadgeCheck size={18} /><div><strong>Mentor verifications</strong><small>Review credentials</small></div><b>{data.pending_verifications || 0}</b><ArrowRight size={15} /></Link>
          <Link to="/admin/reports"><ShieldAlert size={18} /><div><strong>Open reports</strong><small>Review complaints</small></div><b>{data.open_reports || 0}</b><ArrowRight size={15} /></Link>
          <Link to="/admin/users"><UserPlus size={18} /><div><strong>Manage users</strong><small>Roles and account status</small></div><b>{data.total_users || 0}</b><ArrowRight size={15} /></Link>
        </article>
      </div>

      <article className="panel activity-summary">
        <div className="panel-heading"><div><span className="panel-eyebrow">Marketplace</span><h2>Current totals</h2></div></div>
        <div>
          <span><small>Tutor posts</small><strong>{data.total_tutor_posts || 0}</strong></span>
          <span><small>Student requests</small><strong>{data.total_student_requests || 0}</strong></span>
          <span><small>Applications</small><strong>{data.total_applications ?? 0}</strong></span>
          <span><small>Bookings</small><strong>{data.total_bookings || 0}</strong></span>
        </div>
      </article>
    </>
  );
}

function NextClassCard({ booking, role }) {
  const personName = role === "student" ? booking.tutor_name : booking.student_name;
  return (
    <aside className="dashboard-focus-card dashboard-next-class">
      <span className="dashboard-focus-label"><CalendarDays size={15} /> Next class</span>
      <div className="dashboard-focus-person">
        <UserAvatar name={personName} size="medium" />
        <span><small>{role === "student" ? "Learning with" : "Teaching"}</small><strong>{personName}</strong></span>
      </div>
      <div className="dashboard-focus-time">
        <strong>{bookingDateLabel(booking)}</strong>
        <span>{booking.class_time?.slice(0, 5)} · {booking.mode}</span>
      </div>
      <Link to={`/${role}/bookings`}>Open class schedule <ArrowRight size={15} /></Link>
    </aside>
  );
}

function OpenWeekCard({ role }) {
  const isStudent = role === "student";
  return (
    <aside className="dashboard-focus-card dashboard-open-week">
      <span className="dashboard-focus-label"><Compass size={15} /> Today’s next move</span>
      <span className="dashboard-focus-icon" aria-hidden="true">{isStudent ? <Search size={24} /> : <BookOpenCheck size={24} />}</span>
      <h2>{isStudent ? "Choose a mentor for your next goal." : "Meet a student who needs your expertise."}</h2>
      <p>{isStudent ? "Compare teaching styles before you commit." : "Browse focused requests and send a thoughtful proposal."}</p>
      <Link to={isStudent ? "/student/tutors" : "/tutor/requests"}>
        {isStudent ? "Browse mentors" : "Browse student requests"} <ArrowRight size={15} />
      </Link>
    </aside>
  );
}

function UserDashboard({ role, displayName }) {
  const bookings = useApi("/bookings");
  const applications = useApi("/applications");
  const third = useApi(role === "student" ? "/students/progress" : "/tutors/earnings", {});
  const loading = bookings.loading || applications.loading || third.loading;
  if (loading) return <LoadingSpinner label="Loading dashboard" />;

  const bookingRows = Array.isArray(bookings.data) ? bookings.data : [];
  const applicationRows = Array.isArray(applications.data) ? applications.data : [];
  const performanceData = third.data || {};
  const now = Date.now();
  const upcoming = bookingRows
    .map((booking) => ({ booking, startsAt: bookingStartTimestamp(booking) }))
    .filter(({ booking, startsAt }) => activeBookingStatuses.has(booking.status) && Number.isFinite(startsAt) && startsAt >= now)
    .sort((left, right) => left.startsAt - right.startsAt)
    .map(({ booking }) => booking);
  const completed = bookingRows.filter((booking) => booking.status === "completed").length;
  const performance = Number(performanceData.average_performance || 0);
  const primaryAction = role === "student" ? "/student/create-request" : "/tutor/create-service";
  const browseAction = role === "student" ? "/student/tutors" : "/tutor/requests";
  const isStudent = role === "student";

  return (
    <>
      <Alert>{bookings.error || applications.error || third.error}</Alert>
      <TodayMasthead
        role={role}
        displayName={displayName}
        title={isStudent ? "Shape your next learning step." : "Make today’s teaching count."}
        description={isStudent
          ? "Your classes, progress, and strongest mentor matches—together in one calm place."
          : "Keep an eye on your learners, new opportunities, and the work that grows your practice."}
        actions={(
          <>
            <Link className="button" to={browseAction}><Search size={15} /> {isStudent ? "Explore mentors" : "Find students"}</Link>
            <Link className="button button-ghost" to={primaryAction}><Plus size={15} /> {isStudent ? "Post a request" : "Create a course"}</Link>
          </>
        )}
      >
        {upcoming[0] ? <NextClassCard booking={upcoming[0]} role={role} /> : <OpenWeekCard role={role} />}
      </TodayMasthead>

      <div className="stats-grid" aria-label={isStudent ? "Learning summary" : "Teaching summary"}>
        <StatCard icon={CalendarDays} label="Upcoming" value={upcoming.length} hint="Classes ahead" tone="blue" />
        <StatCard icon={CheckCircle2} label="Completed" value={completed} hint="All-time classes" tone="green" />
        <StatCard
          icon={isStudent ? BarChart3 : Banknote}
          label={isStudent ? "Performance" : "Earnings"}
          value={isStudent ? `${performance}%` : `৳${Number(performanceData.total_earnings || 0).toLocaleString()}`}
          hint={isStudent ? "Assignments and quizzes" : "After commission"}
          tone={isStudent ? "purple" : "amber"}
        />
        <StatCard icon={FileCheck2} label="Applications" value={applicationRows.length} hint={isStudent ? "Received" : "Sent"} tone="neutral" />
      </div>

      <div className="dashboard-two-column dashboard-user-columns">
        <article className="panel schedule-panel">
          <div className="panel-heading">
            <div><span className="panel-eyebrow">Your week</span><h2>Upcoming classes</h2></div>
            <Link to={`/${role}/bookings`}>View schedule <ArrowRight size={14} /></Link>
          </div>
          {upcoming.length ? upcoming.slice(0, 5).map((booking) => (
            <div className="activity-row" key={booking.id}>
              <span className="activity-date"><strong>{new Date(booking.class_date).getDate()}</strong><small>{new Date(booking.class_date).toLocaleString("en", { month: "short" })}</small></span>
              <UserAvatar name={isStudent ? booking.tutor_name : booking.student_name} size="tiny" />
              <div>
                <strong>{isStudent ? booking.tutor_name : booking.student_name}</strong>
                <p><Clock3 size={13} /> {booking.class_time?.slice(0, 5)} · {booking.class_type} · {booking.mode}</p>
                {booking.mode === "online" && isLiveClassUrl(booking.meeting_link_or_location) && booking.status === "confirmed" ? (
                  <LiveClassAction
                    href={booking.meeting_link_or_location}
                    variant="link"
                    purpose="join"
                    title={`${booking.class_type} class with ${isStudent ? booking.tutor_name : booking.student_name}`}
                  />
                ) : null}
              </div>
              <span className={`status-badge status-${booking.status}`}>{booking.status}</span>
            </div>
          )) : (
            <div className="calm-empty"><CalendarDays size={23} /><strong>Your week is open</strong><p>Newly booked classes will appear here.</p></div>
          )}
        </article>

        <article className="panel quick-panel">
          <div className="panel-heading"><div><span className="panel-eyebrow">Atelier tools</span><h2>Continue your work</h2></div></div>
          <Link to={browseAction}><Search size={17} /><span><strong>{isStudent ? "Browse tutors" : "Browse student requests"}</strong><small>Open the marketplace</small></span><ArrowRight size={15} /></Link>
          <Link to={`/${role}/messages`}><MessageCircleMore size={17} /><span><strong>Messages</strong><small>Continue conversations</small></span><ArrowRight size={15} /></Link>
          <Link to={`/${role}/${isStudent ? "assignments" : "materials"}`}><BookOpenCheck size={17} /><span><strong>{isStudent ? "Assignments" : "Study materials"}</strong><small>{isStudent ? "View due work" : "Share a resource"}</small></span><ArrowRight size={15} /></Link>
        </article>
      </div>
    </>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const displayName = firstDisplayName(user.full_name);
  return (
    <section className="dashboard-overview">
      {user.role === "admin"
        ? <AdminDashboard displayName={displayName} />
        : <UserDashboard role={user.role} displayName={displayName} />}
    </section>
  );
}
