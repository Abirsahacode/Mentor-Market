import { ArrowRight, LayoutDashboard, LogOut, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth.js";
import { roleHome } from "../utils/roleHome.js";
import Brand from "./Brand.jsx";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrollState, setScrollState] = useState({ elevated: false, progress: 0 });
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
    const closeOnEscape = (event) => { if (event.key === "Escape") close(); };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [open]);

  return (
    <header className={`navbar ${scrollState.elevated ? "is-elevated" : ""}`} style={{ "--nav-progress": `${scrollState.progress}%` }}>
      <div className="container nav-inner">
        <div className="nav-brand-lockup"><Brand onClick={close} /><span>Learn with proof</span></div>
        <button className="nav-toggle" aria-label={open ? "Close navigation" : "Open navigation"} aria-expanded={open} aria-controls="public-navigation" onClick={() => setOpen(!open)}>
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
        <nav id="public-navigation" className={open ? "nav-links is-open" : "nav-links"} aria-label="Primary navigation">
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
    </header>
  );
}
