import {
  BadgeCheck, Banknote, BarChart3, BookOpenCheck, Bookmark, BriefcaseBusiness, CalendarDays,
  ChevronDown, ChevronRight, CircleUserRound, ClipboardCheck, Compass, FileStack, GraduationCap, Heart,
  LayoutDashboard, LifeBuoy, ListChecks, MessageCircleMore, NotebookPen, Search, ShieldAlert,
  ShieldCheck, Sparkles, SquarePlus, Star, UserRoundCheck, UsersRound, X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import useAuth from "../hooks/useAuth.js";
import { formatDisplayName } from "../utils/formatters.js";
import { BrandMark } from "./Brand.jsx";
import UserAvatar from "./UserAvatar.jsx";

export const workspaceNavigation = {
  student: [
    { label: "Start here", items: [["discover", "Discover courses", Compass], ["dashboard", "Overview", LayoutDashboard], ["profile", "Learning profile", CircleUserRound]] },
    { label: "Find a mentor", items: [["tutors", "Browse tutors", Search], ["saved-courses", "Saved courses", Bookmark], ["saved-tutors", "Tutor shortlist", Heart], ["create-request", "Post a request", SquarePlus], ["requests", "My requests", FileStack], ["applications", "Applications", BriefcaseBusiness]] },
    { label: "My learning", items: [["bookings", "Classes", CalendarDays], ["messages", "Messages", MessageCircleMore], ["materials", "Study materials", BookOpenCheck], ["assignments", "Assignments", ClipboardCheck], ["quizzes", "Quizzes", ListChecks], ["progress", "Progress", BarChart3]] },
    { label: "Your account", items: [["payments", "Payments", Banknote], ["reviews", "Reviews", Star], ["reports", "Safety reports", ShieldAlert]] },
  ],
  tutor: [
    { label: "Teaching studio", items: [["dashboard", "Studio overview", LayoutDashboard], ["profile", "Public profile", CircleUserRound], ["create-service", "Create a course", SquarePlus]] },
    { label: "Marketplace", items: [["requests", "Student requests", Search], ["services", "My courses", FileStack], ["applications", "Applications", BriefcaseBusiness], ["bookings", "Class schedule", CalendarDays]] },
    { label: "Classroom", items: [["messages", "Messages", MessageCircleMore], ["materials", "Study materials", BookOpenCheck], ["assignments", "Assignments", NotebookPen], ["quizzes", "Quizzes", ListChecks]] },
    { label: "Your practice", items: [["earnings", "Earnings", Banknote], ["reviews", "Reviews", Star], ["verification", "Verification", BadgeCheck], ["reports", "Safety reports", ShieldAlert]] },
  ],
  admin: [
    { label: "Overview", items: [["dashboard", "Marketplace pulse", LayoutDashboard], ["users", "All users", UsersRound], ["students", "Students", GraduationCap], ["tutors", "Tutors", UserRoundCheck]] },
    { label: "Marketplace", items: [["tutor-posts", "Tutor posts", FileStack], ["student-requests", "Student requests", Search], ["applications", "Applications", BriefcaseBusiness], ["bookings", "Bookings", CalendarDays]] },
    { label: "Trust & finance", items: [["payments", "Payments", Banknote], ["reviews", "Reviews", Star], ["verifications", "Verification queue", BadgeCheck], ["reports", "Safety reports", ShieldAlert]] },
  ],
};

const roleMeta = {
  student: { label: "Learning atelier", detail: "Build your next breakthrough", Icon: GraduationCap },
  tutor: { label: "Teaching atelier", detail: "Grow a thoughtful practice", Icon: Sparkles },
  admin: { label: "Marketplace atelier", detail: "Keep learning trusted", Icon: ShieldCheck },
};

export default function Sidebar({ role, open, drawerMode, onNavigate }) {
  const { user } = useAuth();
  const location = useLocation();
  const meta = roleMeta[role];
  const RoleIcon = meta.Icon;
  const profilePath = role === "admin" ? "/admin/users" : `/${role}/profile`;
  const homePath = role === "student" ? "/student/discover" : `/${role}/dashboard`;
  const displayName = formatDisplayName(user?.full_name);
  const activeGroup = workspaceNavigation[role].find((group) => group.items.some(([path]) => {
    const destination = `/${role}/${path}`;
    return location.pathname === destination
      || location.pathname.startsWith(`${destination}/`)
      || (role === "student" && path === "discover" && location.pathname.startsWith("/student/courses/"));
  }))?.label;
  const [expandedGroups, setExpandedGroups] = useState(() => new Set([activeGroup || workspaceNavigation[role][0].label]));

  useEffect(() => {
    if (activeGroup) setExpandedGroups((current) => new Set([...current, activeGroup]));
  }, [activeGroup]);

  const toggleGroup = (label) => setExpandedGroups((current) => {
    const next = new Set(current);
    if (next.has(label) && label !== activeGroup) next.delete(label);
    else next.add(label);
    return next;
  });

  const navClass = (path, isActive) => {
    const courseRoute = role === "student" && path === "discover" && location.pathname.startsWith("/student/courses/");
    return isActive || courseRoute ? "sidebar-link active" : "sidebar-link";
  };

  return (
    <aside
      id="workspace-sidebar"
      className={open ? "sidebar is-open" : "sidebar"}
      role={drawerMode ? "dialog" : undefined}
      aria-modal={drawerMode && open ? "true" : undefined}
      aria-hidden={drawerMode && !open ? "true" : undefined}
      inert={drawerMode && !open ? true : undefined}
      aria-label={`${meta.label} navigation`}
    >
      <div className="sidebar-brand-row">
        <Link className="sidebar-brand" to={homePath} onClick={onNavigate} aria-label="Mentor Market workspace home">
          <BrandMark size={34} />
          <span><strong>Mentor Market</strong><small>Learning, made personal</small></span>
        </Link>
        <button className="sidebar-close" type="button" onClick={onNavigate} aria-label="Close navigation"><X size={19} /></button>
      </div>

      <div className="sidebar-workspace-card">
        <span className="sidebar-workspace-icon"><RoleIcon size={18} aria-hidden="true" /></span>
        <div><small>Workspace</small><strong>{meta.label}</strong><span>{meta.detail}</span></div>
        <i aria-label="Workspace active" title="Workspace active" />
      </div>

      <nav aria-label={`${role} workspace sections`}>
        {workspaceNavigation[role].map((group) => (
          <div className="sidebar-group" key={group.label}>
            <button
              className="sidebar-group-toggle"
              type="button"
              aria-expanded={expandedGroups.has(group.label)}
              aria-controls={`sidebar-group-${role}-${group.label.toLowerCase().replaceAll(" ", "-").replaceAll("&", "and")}`}
              onClick={() => toggleGroup(group.label)}
            >
              <span>{group.label}</span><ChevronDown size={14} aria-hidden="true" />
            </button>
            <div id={`sidebar-group-${role}-${group.label.toLowerCase().replaceAll(" ", "-").replaceAll("&", "and")}`} hidden={!expandedGroups.has(group.label)}>
            {group.items.map(([path, label, Icon]) => (
              <NavLink
                key={path}
                to={`/${role}/${path}`}
                onClick={onNavigate}
                title={label}
                className={({ isActive }) => navClass(path, isActive)}
              >
                <span className="sidebar-nav-icon"><Icon size={18} strokeWidth={1.85} aria-hidden="true" /></span>
                <span className="sidebar-nav-copy">{label}</span>
                <ChevronRight className="sidebar-nav-arrow" size={14} aria-hidden="true" />
              </NavLink>
            ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <Link className="sidebar-support" to={`/${role}/reports`} onClick={onNavigate}>
          <span><LifeBuoy size={18} aria-hidden="true" /></span>
          <div><strong>Help & safety</strong><small>Get support or report an issue</small></div>
          <ChevronRight size={14} aria-hidden="true" />
        </Link>
        <Link className="sidebar-account" to={profilePath} onClick={onNavigate}>
          <UserAvatar name={displayName} size="small" verified={role === "admin"} />
          <span><strong>{displayName}</strong><small>{user?.email}</small></span>
          <ChevronRight size={15} aria-hidden="true" />
        </Link>
      </div>
    </aside>
  );
}
