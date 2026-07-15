import {
  BadgeCheck, BarChart3, Bell, BookOpenCheck, CalendarDays, ClipboardCheck, Compass, FileStack,
  LayoutDashboard, MessageCircleMore, Search, ShieldAlert, SquarePlus, UserRound, UsersRound, X,
} from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth.js";

const mobileNavigation = {
  student: [
    { label: "Overview", path: "/student/dashboard", Icon: LayoutDashboard },
    { label: "Classes", path: "/student/bookings", Icon: CalendarDays },
    { label: "Discover", path: "/student/discover", Icon: Compass, featured: true },
    { label: "Messages", path: "/student/messages", Icon: MessageCircleMore },
    { label: "Saved", path: "/student/saved-courses", Icon: BookOpenCheck },
  ],
  tutor: [
    { label: "Overview", path: "/tutor/dashboard", Icon: LayoutDashboard },
    { label: "Requests", path: "/tutor/requests", Icon: FileStack },
    { label: "Create", path: "/tutor/create-service", Icon: SquarePlus, featured: true },
    { label: "Classes", path: "/tutor/bookings", Icon: CalendarDays },
    { label: "Messages", path: "/tutor/messages", Icon: MessageCircleMore },
  ],
  admin: [
    { label: "Pulse", path: "/admin/dashboard", Icon: BarChart3 },
    { label: "Users", path: "/admin/users", Icon: UsersRound },
    { label: "Review", path: "/admin/verifications", Icon: BadgeCheck, featured: true },
    { label: "Reports", path: "/admin/reports", Icon: ShieldAlert },
    { label: "Alerts", path: "/admin/notifications", Icon: Bell },
  ],
};

const quickDestinations = {
  student: [
    { label: "Discover courses", hint: "Video lessons picked for you", path: "/student/discover", Icon: Compass },
    { label: "Browse tutors", hint: "Find a mentor by subject", path: "/student/tutors", Icon: UsersRound },
    { label: "My classes", hint: "Upcoming and past bookings", path: "/student/bookings", Icon: CalendarDays },
    { label: "Assignments", hint: "View work and submit answers", path: "/student/assignments", Icon: ClipboardCheck },
    { label: "Learning progress", hint: "Scores, attendance and feedback", path: "/student/progress", Icon: BarChart3 },
    { label: "Saved courses", hint: "Return to your course library", path: "/student/saved-courses", Icon: BookOpenCheck },
    { label: "My profile", hint: "Goals and account details", path: "/student/profile", Icon: UserRound },
  ],
  tutor: [
    { label: "Teaching overview", hint: "Classes, applications and earnings", path: "/tutor/dashboard", Icon: LayoutDashboard },
    { label: "Create a course", hint: "Publish a new teaching service", path: "/tutor/create-service", Icon: SquarePlus },
    { label: "Student requests", hint: "Find students who need your skills", path: "/tutor/requests", Icon: FileStack },
    { label: "Class schedule", hint: "Manage upcoming bookings", path: "/tutor/bookings", Icon: CalendarDays },
    { label: "Study materials", hint: "Share resources with students", path: "/tutor/materials", Icon: BookOpenCheck },
    { label: "Verification", hint: "Build trust with your credentials", path: "/tutor/verification", Icon: BadgeCheck },
    { label: "Public profile", hint: "Polish how students see you", path: "/tutor/profile", Icon: UserRound },
  ],
  admin: [
    { label: "Marketplace pulse", hint: "Activity and revenue overview", path: "/admin/dashboard", Icon: BarChart3 },
    { label: "All users", hint: "Manage access and account status", path: "/admin/users", Icon: UsersRound },
    { label: "Tutor verification", hint: "Review mentor credentials", path: "/admin/verifications", Icon: BadgeCheck },
    { label: "Safety reports", hint: "Resolve marketplace concerns", path: "/admin/reports", Icon: ShieldAlert },
    { label: "Tutor posts", hint: "Moderate course listings", path: "/admin/tutor-posts", Icon: FileStack },
    { label: "Bookings", hint: "Review class activity", path: "/admin/bookings", Icon: CalendarDays },
    { label: "Notifications", hint: "See recent platform activity", path: "/admin/notifications", Icon: Bell },
  ],
};

const workspaceNames = { student: "Student space", tutor: "Teaching studio", admin: "Control room" };

export default function StudentMobileNav() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const openerRef = useRef(null);
  const dialogRef = useRef(null);
  const inputRef = useRef(null);
  const resultRefs = useRef([]);
  const titleId = useId();
  const role = user?.role;
  const destinations = quickDestinations[role] || [];

  const results = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return destinations;
    return destinations.filter(({ label, hint }) => `${label} ${hint}`.toLowerCase().includes(term));
  }, [destinations, query]);

  const show = () => {
    openerRef.current = document.activeElement;
    setOpen(true);
  };

  const close = (restoreFocus = true) => {
    setOpen(false);
    setQuery("");
    if (restoreFocus) requestAnimationFrame(() => openerRef.current?.focus?.());
  };

  const visit = (path) => {
    close(false);
    navigate(path);
  };

  useEffect(() => {
    const handleShortcut = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        if (open) close(); else show();
      }
    };
    const handleExternalOpen = () => show();
    window.addEventListener("keydown", handleShortcut);
    window.addEventListener("mentor-market:open-command", handleExternalOpen);
    return () => {
      window.removeEventListener("keydown", handleShortcut);
      window.removeEventListener("mentor-market:open-command", handleExternalOpen);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    requestAnimationFrame(() => inputRef.current?.focus());

    const handleDialogKey = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = [...(dialogRef.current?.querySelectorAll("button, input, a[href]") || [])].filter((element) => !element.disabled);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleDialogKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleDialogKey);
    };
  }, [open]);

  if (!role || !mobileNavigation[role]) return null;

  const overlay = open && createPortal(
    <div className={`workspace-command workspace-command-${role}`} role="presentation">
      <button className="workspace-command-backdrop" type="button" onClick={() => close()} aria-label="Close workspace search" />
      <section ref={dialogRef} className="workspace-command-dialog" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <div className="workspace-command-handle" aria-hidden="true" />
        <header className="workspace-command-header">
          <div><span>{workspaceNames[role]}</span><h2 id={titleId}>Where would you like to go?</h2></div>
          <button type="button" onClick={() => close()} aria-label="Close workspace search"><X size={20} /></button>
        </header>
        <label className="workspace-command-search">
          <Search size={19} aria-hidden="true" />
          <span className="workspace-visually-hidden">Search workspace pages</span>
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && results[0]) visit(results[0].path);
              if (event.key === "ArrowDown" && results[0]) { event.preventDefault(); resultRefs.current[0]?.focus(); }
            }}
            placeholder="Search pages and tools"
            autoComplete="off"
          />
          <kbd>Esc</kbd>
        </label>
        <div className="workspace-command-label"><span>Quick destinations</span><small>{results.length} results</small></div>
        <div className="workspace-command-results" aria-live="polite">
          {results.map(({ label, hint, path, Icon }, index) => (
            <button
              key={path}
              ref={(element) => { resultRefs.current[index] = element; }}
              type="button"
              onClick={() => visit(path)}
              onKeyDown={(event) => {
                if (event.key === "ArrowDown") { event.preventDefault(); resultRefs.current[(index + 1) % results.length]?.focus(); }
                if (event.key === "ArrowUp") { event.preventDefault(); (index === 0 ? inputRef.current : resultRefs.current[index - 1])?.focus(); }
              }}
            >
              <span><Icon size={19} aria-hidden="true" /></span>
              <strong>{label}<small>{hint}</small></strong>
              <kbd>{index + 1}</kbd>
            </button>
          ))}
          {!results.length && (
            <div className="workspace-command-empty"><Search size={22} aria-hidden="true" /><strong>No matching destination</strong><span>Try a broader search such as “class” or “profile”.</span></div>
          )}
        </div>
        <footer className="workspace-command-footer"><span><kbd>↑</kbd><kbd>↓</kbd> Browse</span><span><kbd>↵</kbd> Open first result</span><span><kbd>Esc</kbd> Close</span></footer>
      </section>
    </div>,
    document.body,
  );

  return (
    <>
      <nav className="workspace-mobile-nav" aria-label={`${workspaceNames[role]} mobile navigation`}>
        <div className="workspace-mobile-nav-inner">
          {mobileNavigation[role].map(({ label, path, Icon, featured }) => (
            <NavLink
              key={path}
              to={path}
              aria-label={`Go to ${label}`}
              className={({ isActive }) => {
                const isCourse = role === "student" && path === "/student/discover" && location.pathname.startsWith("/student/courses/");
                return `${featured ? "is-featured" : ""}${isActive || isCourse ? " active" : ""}`.trim();
              }}
            >
              <span className="workspace-mobile-nav-icon"><Icon size={featured ? 23 : 20} strokeWidth={featured ? 2.25 : 1.9} aria-hidden="true" /></span>
              <span>{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
      {overlay}
    </>
  );
}
