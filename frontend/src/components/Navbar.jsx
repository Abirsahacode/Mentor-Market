import { ArrowRight, LayoutDashboard, LogOut, Menu, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth.js";
import { roleHome } from "../utils/roleHome.js";
import Brand from "./Brand.jsx";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrollState, setScrollState] = useState({ elevated: false, progress: 0 });
  const toggleRef = useRef(null);
  const navRef = useRef(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const close = () => setOpen(false);
  const handleLogout = () => { logout(); close(); navigate("/"); };

  useEffect(() => { close(); }, [location.pathname]);
  useEffect(() => {
    let frame;
    const updateScrollState = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        const scrollable = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
        setScrollState({
          elevated: window.scrollY > 18,
          progress: Math.min((window.scrollY / scrollable) * 100, 100),
        });
      });
    };
    updateScrollState();
    window.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", updateScrollState);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, []);
  useEffect(() => {
    if (!open) return undefined;
    const previousOverflow = document.body.style.overflow;
    const frame = window.requestAnimationFrame(() => navRef.current?.querySelector("a, button")?.focus());
    const handleKeyDown = (event) => {
      if (event.key === "Escape") { event.preventDefault(); close(); return; }
      if (event.key !== "Tab") return;
      const focusable = [...(navRef.current?.querySelectorAll("a[href], button:not([disabled])") || [])];
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    const closeOnDesktop = () => { if (window.innerWidth > 920) close(); };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", closeOnDesktop);
    return () => {
      window.cancelAnimationFrame(frame);
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", closeOnDesktop);
      toggleRef.current?.focus();
    };
  }, [open]);

  return (
    <><header className={`navbar ${scrollState.elevated ? "is-elevated" : ""}`} style={{ "--nav-progress": `${scrollState.progress}%` }}>
      <div className="container nav-inner">
        <div className="nav-brand-lockup"><Brand onClick={close} /><span>Learn with proof</span></div>
        <button ref={toggleRef} className="nav-toggle" aria-label={open ? "Close navigation" : "Open navigation"} aria-expanded={open} aria-controls="public-navigation" onClick={() => setOpen(!open)}>
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
        <nav ref={navRef} id="public-navigation" className={open ? "nav-links is-open" : "nav-links"} aria-label="Primary navigation">
          <div className="nav-primary">
            <NavLink to="/tutors" onClick={close}>Explore mentors</NavLink>
            <NavLink to="/student-requests" onClick={close}>Open briefs</NavLink>
            <NavLink to="/how-it-works" onClick={close}>How it works</NavLink>
          </div>
          <div className="nav-actions">
            <Link className="nav-teach" to="/become-a-tutor" onClick={close}>Teach on Mentor Market</Link>
            {user ? <><Link className="button button-small" to={roleHome(user.role)} onClick={close}><LayoutDashboard size={15} /> {user.role === "student" ? "Explore" : "Dashboard"}</Link><button className="nav-logout" onClick={handleLogout}><LogOut size={15} /> Log out</button></> : <><Link className="nav-login" to="/login" onClick={close}>Log in</Link><Link className="button button-small" to="/register" onClick={close}>Get started <ArrowRight size={15} /></Link></>}
          </div>
        </nav>
      </div>
      <span className="nav-scroll-progress" aria-hidden="true" />
    </header>{open ? <button type="button" className="public-nav-scrim" aria-label="Close navigation" onClick={close} /> : null}</>
  );
}
