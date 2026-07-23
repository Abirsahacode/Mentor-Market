import {
  ArrowRight, BadgeCheck, Banknote, BarChart3, BookOpenCheck, CalendarDays,
  CheckCircle2, Clock3, Compass, FileCheck2, MessageCircleMore, Plus, Search, ShieldAlert, ShieldCheck, UserPlus, UsersRound,
} from "lucide-react";
import { Link } from "react-router-dom";
import LiveClassAction from "../components/LiveClassAction.jsx";
import Alert from "../components/Alert.jsx";
import LoadingSpinner from "../components/LoadingSpinner.jsx";
import PageHeader from "../components/PageHeader.jsx";
import StatCard from "../components/StatCard.jsx";
import UserAvatar from "../components/UserAvatar.jsx";

import useApi from "../hooks/useApi.js";
import useAuth from "../hooks/useAuth.js";
import { firstDisplayName } from "../utils/formatters.js";

const today = () => new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });

function AdminDashboard() {
  const { data, loading, error } = useApi("/admin/dashboard", {});
  if (loading) return <LoadingSpinner label="Loading dashboard" />;
  const maxSubject = Math.max(...(data.popular_subjects || []).map((item) => Number(item.total)), 1);
  return <>
    <Alert>{error}</Alert>
    <article className="dashboard-hero-band dashboard-admin-hero">
      <div><span className="dashboard-hero-kicker"><ShieldCheck size={14} /> Marketplace control room</span><h2>Keep trust high and learning moving.</h2><p>Review the small number of records that need judgment, then step back and let the marketplace work.</p></div>
      <div className="dashboard-hero-actions"><Link className="button" to="/admin/verifications">Review verification queue</Link><Link className="button button-ghost" to="/admin/reports">Open safety desk</Link></div>
    </article>
    <div className="stats-grid"><StatCard icon={UsersRound} label="Users" value={data.total_users} hint={`${data.total_students || 0} students · ${data.total_tutors || 0} tutors`} /><StatCard icon={CalendarDays} label="Bookings" value={data.total_bookings} hint="All statuses" /><StatCard icon={Banknote} label="Payments" value={data.total_payments} hint={`৳${Number(data.total_revenue || 0).toLocaleString()} commission`} /><StatCard icon={BadgeCheck} label="Pending verification" value={data.pending_verifications} hint="Requires review" /></div>
    <div className="dashboard-two-column">
      <article className="panel analytics-panel"><div className="panel-heading"><div><span className="panel-eyebrow">Demand</span><h2>Popular subjects</h2></div><span className="panel-period">All time</span></div><div className="analytics-bars">{data.popular_subjects?.map((item, index) => <div key={item.subject}><span>{String(index + 1).padStart(2, "0")}</span><strong>{item.subject}</strong><div><i style={{ width: `${Math.max((Number(item.total) / maxSubject) * 100, 4)}%` }} /></div><b>{item.total}</b></div>)}</div></article>
      <article className="panel trust-queue"><div className="panel-heading"><div><span className="panel-eyebrow">Admin queue</span><h2>Needs attention</h2></div></div><Link to="/admin/verifications"><BadgeCheck size={18} /><div><strong>Mentor verifications</strong><small>Review credentials</small></div><b>{data.pending_verifications || 0}</b><ArrowRight size={15} /></Link><Link to="/admin/reports"><ShieldAlert size={18} /><div><strong>Open reports</strong><small>Review complaints</small></div><b>{data.open_reports || 0}</b><ArrowRight size={15} /></Link><Link to="/admin/users"><UserPlus size={18} /><div><strong>Manage users</strong><small>Roles and account status</small></div><b>{data.total_users || 0}</b><ArrowRight size={15} /></Link></article>
    </div>
    <article className="panel activity-summary"><div className="panel-heading"><div><span className="panel-eyebrow">Marketplace</span><h2>Current totals</h2></div></div><div><span><small>Tutor posts</small><strong>{data.total_tutor_posts || 0}</strong></span><span><small>Student requests</small><strong>{data.total_student_requests || 0}</strong></span><span><small>Applications</small><strong>{data.total_applications || 0}</strong></span><span><small>Bookings</small><strong>{data.total_bookings || 0}</strong></span></div></article>
  </>;
}

function UserDashboard({ role }) {
  const bookings = useApi("/bookings");
  const applications = useApi("/applications");
  const third = useApi(role === "student" ? "/students/progress" : "/tutors/earnings", {});
  const loading = bookings.loading || applications.loading || third.loading;
  if (loading) return <LoadingSpinner label="Loading dashboard" />;
  const bookingRows = Array.isArray(bookings.data) ? bookings.data : [];
  const applicationRows = Array.isArray(applications.data) ? applications.data : [];
  const performanceData = third.data || {};
  const upcoming = bookingRows.filter((booking) => ["pending", "confirmed", "rescheduled"].includes(booking.status));
  const completed = bookingRows.filter((booking) => booking.status === "completed").length;
  const performance = Number(performanceData.average_performance || 0);
  const primaryAction = role === "student" ? "/student/create-request" : "/tutor/create-service";
  const browseAction = role === "student" ? "/student/tutors" : "/tutor/requests";
  return <>
    <Alert>{bookings.error || applications.error || third.error}</Alert>
    <article className={`dashboard-hero-band dashboard-${role}-hero`}>
      <div><span className="dashboard-hero-kicker"><Compass size={14} /> {role === "student" ? "Your learning studio" : "Your teaching studio"}</span><h2>{role === "student" ? (upcoming.length ? `${upcoming.length} class${upcoming.length === 1 ? "" : "es"} ahead. Keep the momentum.` : "Find the mentor who makes it click.") : (upcoming.length ? `${upcoming.length} student session${upcoming.length === 1 ? "" : "s"} on your horizon.` : "Turn what you know into someone’s breakthrough.")}</h2><p>{role === "student" ? "Explore short mentor previews, save the strongest matches, and build a learning rhythm that fits your week." : "Publish a sharp teaching offer, respond to high-intent requests, and keep every learner on track."}</p></div>
      <div className="dashboard-hero-actions"><Link className="button" to={browseAction}><Search size={15} /> {role === "student" ? "Explore mentors" : "Find students"}</Link><Link className="button button-ghost" to={primaryAction}><Plus size={15} /> {role === "student" ? "Post a request" : "Create a service"}</Link></div>
    </article>
    <div className="stats-grid"><StatCard icon={CalendarDays} label="Upcoming classes" value={upcoming.length} hint="Pending or confirmed" /><StatCard icon={CheckCircle2} label="Completed classes" value={completed} hint="All time" /><StatCard icon={role === "student" ? BarChart3 : Banknote} label={role === "student" ? "Average performance" : "Total earnings"} value={role === "student" ? `${performance}%` : `৳${Number(performanceData.total_earnings || 0).toLocaleString()}`} hint={role === "student" ? "Assignments and quizzes" : "After commission"} /><StatCard icon={FileCheck2} label="Applications" value={applicationRows.length} hint={role === "student" ? "Received" : "Sent"} /></div>
    <div className="dashboard-two-column dashboard-user-columns">
      <article className="panel schedule-panel"><div className="panel-heading"><div><span className="panel-eyebrow">Schedule</span><h2>Upcoming classes</h2></div><Link to={`/${role}/bookings`}>View all <ArrowRight size={14} /></Link></div>{upcoming.length ? upcoming.slice(0, 5).map((booking) => <div className="activity-row" key={booking.id}><span className="activity-date"><strong>{new Date(booking.class_date).getDate()}</strong><small>{new Date(booking.class_date).toLocaleString("en", { month: "short" })}</small></span><UserAvatar name={role === "student" ? booking.tutor_name : booking.student_name} size="tiny" /><div><strong>{role === "student" ? booking.tutor_name : booking.student_name}</strong><p><Clock3 size={13} /> {booking.class_time?.slice(0, 5)} · {booking.class_type} · {booking.mode}</p>{booking.mode === "online" && booking.meeting_link_or_location && booking.status === "confirmed" ? <LiveClassAction href={booking.meeting_link_or_location} variant="link" purpose="join" title={`${booking.class_type} class with ${role === "student" ? booking.tutor_name : booking.student_name}`} /> : null}</div><span className={`status-badge status-${booking.status}`}>{booking.status}</span></div>) : <div className="calm-empty"><CalendarDays size={23} /><strong>No upcoming classes</strong><p>Booked classes will appear here.</p></div>}</article>
      <article className="panel quick-panel"><div className="panel-heading"><div><span className="panel-eyebrow">Shortcuts</span><h2>Common tasks</h2></div></div><Link to={browseAction}><Search size={17} /><span><strong>{role === "student" ? "Browse tutors" : "Browse student requests"}</strong><small>Open the marketplace</small></span><ArrowRight size={15} /></Link><Link to={`/${role}/messages`}><MessageCircleMore size={17} /><span><strong>Messages</strong><small>Continue conversations</small></span><ArrowRight size={15} /></Link><Link to={`/${role}/${role === "student" ? "assignments" : "materials"}`}><BookOpenCheck size={17} /><span><strong>{role === "student" ? "Assignments" : "Study materials"}</strong><small>{role === "student" ? "View due work" : "Share a resource"}</small></span><ArrowRight size={15} /></Link></article>
    </div>
  </>;
}

export default function DashboardPage() {
  const { user } = useAuth();
  return <section className="dashboard-overview"><PageHeader eyebrow={`${today()} · ${user.role}`} title={`Hello, ${firstDisplayName(user.full_name)}`} description={user.role === "admin" ? "Marketplace activity and moderation at a glance." : undefined} />{user.role === "admin" ? <AdminDashboard /> : <UserDashboard role={user.role} />}</section>;
}
