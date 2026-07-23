import {
  BadgeCheck, Bell, ChevronDown, ChevronRight, LogOut, Menu, Plus, Search, Settings2, UserRound,
} from "lucide-react";
import { Suspense, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import useApi from "../hooks/useApi.js";
import useAuth from "../hooks/useAuth.js";
import { formatDisplayName } from "../utils/formatters.js";
import Brand from "./Brand.jsx";
import LoadingSpinner from "./LoadingSpinner.jsx";
import Sidebar from "./Sidebar.jsx";
import StudentMobileNav from "./StudentMobileNav.jsx";
import UserAvatar from "./UserAvatar.jsx";

const routeLabels = {
  dashboard: "Overview", discover: "Discover", courses: "Course studio", profile: "Profile",
  tutors: "Tutors", "saved-courses": "Saved courses", "saved-tutors": "Tutor shortlist",
  "create-request": "New tutor request", requests: "Requests", applications: "Applications",
  bookings: "Classes", messages: "Messages", materials: "Study materials", assignments: "Assignments",
  quizzes: "Quizzes", progress: "Progress", payments: "Payments", reviews: "Reviews",
  reports: "Help & safety", notifications: "Notifications", "create-service": "Create course",
  services: "My courses", earnings: "Earnings", verification: "Verification", users: "Users",
  students: "Students", "tutor-posts": "Tutor posts", "student-requests": "Student requests",
  verifications: "Verification queue",
};

const roleLabels = { student: "Learning atelier", tutor: "Teaching atelier", admin: "Marketplace atelier" };

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState(() => typeof window !== "undefined" && window.matchMedia("(max-width: 1024px)").matches);
  const [accountOpen, setAccountOpen] = useState(false);
  const accountRef = useRef(null);
  const sidebarToggleRef = useRef(null);
  const sidebarWasOpenRef = useRef(false);
  const sidebarFocusTimerRef = useRef(null);
  const { user, logout } = useAuth();
  const { data: unreadNotifications, reload: reloadUnreadNotifications } = useApi("/notifications?unread=true");
  const navigate = useNavigate();
  const location = useLocation();
  const role = user.role;
  const displayName = formatDisplayName(user.full_name);
  const commandKey = typeof navigator !== "undefined" && navigator.platform?.toLowerCase().includes("mac") ? "⌘" : "Ctrl";
  const profilePath = role === "admin" ? "/admin/users" : `/${role}/profile`;
  const segment = location.pathname.split("/").filter(Boolean).at(-1);
  const currentLabel = /^\d+$/.test(segment || "") ? "Course details" : (routeLabels[segment] || "Workspace");
  const isOverview = segment === "dashboard";
  const unreadCount = Array.isArray(unreadNotifications) ? unreadNotifications.length : 0;
  const action = role === "student"
    ? { path: "/student/create-request", label: "Post a request", Icon: Plus }
    : role === "tutor"
      ? { path: "/tutor/create-service", label: "Create course", Icon: Plus }
      : { path: "/admin/verifications", label: "Review queue", Icon: BadgeCheck };

  const handleLogout = () => {
    setAccountOpen(false);
    logout();
    navigate("/");
  };

  const openCommand = () => window.dispatchEvent(new CustomEvent("mentor-market:open-command"));
  const toggleSidebar = () => {
    const nextOpen = !sidebarOpen;
    setSidebarOpen(nextOpen);
    window.clearTimeout(sidebarFocusTimerRef.current);
    if (nextOpen && drawerMode) {
      sidebarFocusTimerRef.current = window.setTimeout(
        () => document.querySelector("#workspace-sidebar .sidebar-close")?.focus({ preventScroll: true }),
        50,
      );
    }
  };

  useEffect(() => {
    setSidebarOpen(false);
    setAccountOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const closeAccount = (event) => {
      if (accountRef.current && !accountRef.current.contains(event.target)) setAccountOpen(false);
    };
    const closeOverlays = (event) => {
      if (event.key !== "Escape") return;
      setAccountOpen(false);
      setSidebarOpen(false);
    };
    document.addEventListener("pointerdown", closeAccount);
    document.addEventListener("keydown", closeOverlays);
    return () => {
      document.removeEventListener("pointerdown", closeAccount);
      document.removeEventListener("keydown", closeOverlays);
    };
  }, []);

  useEffect(() => {
    if (!sidebarOpen || !drawerMode) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previousOverflow; };
  }, [drawerMode, sidebarOpen]);

  useEffect(() => {
    const drawerQuery = window.matchMedia("(max-width: 1024px)");
    const updateDrawerMode = (event) => {
      setDrawerMode(event.matches);
      if (!event.matches) setSidebarOpen(false);
    };
    setDrawerMode(drawerQuery.matches);
    drawerQuery.addEventListener("change", updateDrawerMode);
    return () => drawerQuery.removeEventListener("change", updateDrawerMode);
  }, []);

  useLayoutEffect(() => {
    if (!sidebarOpen || !drawerMode) return undefined;
    const drawer = document.getElementById("workspace-sidebar");
    const focusableSelector = "a[href], button:not([disabled]), [tabindex]:not([tabindex='-1'])";
    const focusable = () => [...(drawer?.querySelectorAll(focusableSelector) || [])];
    const focusClose = () => drawer?.querySelector(".sidebar-close")?.focus({ preventScroll: true });
    focusClose();
    const focusTimer = window.setTimeout(focusClose, 0);
    const trapFocus = (event) => {
      if (event.key !== "Tab") return;
      const items = focusable();
      if (!items.length) return;
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
    document.addEventListener("keydown", trapFocus);
    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener("keydown", trapFocus);
    };
  }, [drawerMode, sidebarOpen]);

  useEffect(() => {
    if (sidebarWasOpenRef.current && !sidebarOpen && drawerMode) sidebarToggleRef.current?.focus();
    sidebarWasOpenRef.current = sidebarOpen;
  }, [drawerMode, sidebarOpen]);

  useEffect(() => {
    const refreshUnread = () => reloadUnreadNotifications();
    window.addEventListener("mentor-market:notifications-updated", refreshUnread);
    return () => window.removeEventListener("mentor-market:notifications-updated", refreshUnread);
  }, [reloadUnreadNotifications]);

  useEffect(() => () => window.clearTimeout(sidebarFocusTimerRef.current), []);

  return (
    <div className={`dashboard-shell dashboard-role-${role}`}>
      <a className="shell-skip-link" href="#workspace-content">Skip to workspace content</a>
      <header className="dashboard-topbar">
        <div className="dashboard-topbar-start">
          <button
            ref={sidebarToggleRef}
            className="sidebar-toggle"
            type="button"
            onClick={toggleSidebar}
            aria-label={sidebarOpen ? "Close workspace navigation" : "Open workspace navigation"}
            aria-expanded={sidebarOpen}
            aria-controls="workspace-sidebar"
          ><Menu size={20} /></button>
          <div className="dashboard-mobile-context">
            <div className="dashboard-mobile-brand"><Brand compact /></div>
            <span className="dashboard-mobile-page">{currentLabel}</span>
          </div>
          <div className="workspace-breadcrumb" aria-label="Current location">
            <span>{roleLabels[role]}</span><ChevronRight size={13} aria-hidden="true" /><strong>{currentLabel}</strong>
          </div>
        </div>

        <button className="workspace-command-trigger" type="button" onClick={openCommand} aria-label="Search and jump around the workspace">
          <Search size={17} aria-hidden="true" /><span>Search or jump to…</span><kbd>{commandKey} K</kbd>
        </button>

        <div className="dashboard-user">
          {!isOverview && <Link className="topbar-magic" to={action.path} aria-label={action.label}><action.Icon size={16} aria-hidden="true" /><span>{action.label}</span></Link>}
          <Link className="topbar-icon topbar-notifications" to={`/${role}/notifications`} aria-label={unreadCount ? `Open notifications, ${unreadCount} unread` : "Open notifications"}><Bell size={19} />{unreadCount > 0 && <i aria-hidden="true" />}</Link>
          <div className="topbar-account-wrap" ref={accountRef}>
            <button className="topbar-profile" type="button" onClick={() => setAccountOpen((current) => !current)} aria-haspopup="menu" aria-expanded={accountOpen}>
              <UserAvatar name={displayName} size="small" verified={role === "admin"} />
              <span className="user-copy"><strong>{displayName}</strong><small>{roleLabels[role]}</small></span>
              <ChevronDown size={15} aria-hidden="true" />
            </button>
            {accountOpen && (
              <div className="topbar-account-menu" role="menu">
                <div className="topbar-menu-intro"><UserAvatar name={displayName} size="medium" verified={role === "admin"} /><span><strong>{displayName}</strong><small>{user.email}</small></span></div>
                <Link to={profilePath} role="menuitem"><UserRound size={17} /><span>{role === "admin" ? "Manage accounts" : "View profile"}</span></Link>
                <Link to={`/${role}/notifications`} role="menuitem"><Bell size={17} /><span>Notifications</span></Link>
                <Link to={`/${role}/reports`} role="menuitem"><Settings2 size={17} /><span>Help & safety</span></Link>
                <button type="button" onClick={handleLogout} role="menuitem"><LogOut size={17} /><span>Log out</span></button>
              </div>
            )}
          </div>
        </div>
      </header>

      <Sidebar role={role} open={sidebarOpen} drawerMode={drawerMode} onNavigate={() => setSidebarOpen(false)} />
      {sidebarOpen && <button className="sidebar-scrim" type="button" onClick={() => setSidebarOpen(false)} aria-label="Close workspace navigation" />}
      <main id="workspace-content" className="dashboard-main" tabIndex="-1">
        <Suspense fallback={<LoadingSpinner label={`Loading ${currentLabel.toLowerCase()}`} detail="Opening this workspace view" />}>
          <Outlet />
        </Suspense>
      </main>
      <StudentMobileNav />
    </div>
  );
}
