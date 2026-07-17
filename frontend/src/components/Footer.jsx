import { ArrowRight, ArrowUpRight, CirclePlay } from "lucide-react";
import { Link } from "react-router-dom";
import useAuth from "../hooks/useAuth.js";
import { roleHome } from "../utils/roleHome.js";
import Brand from "./Brand.jsx";

export default function Footer() {
  const { user } = useAuth();
  return (
    <footer className="footer">
      <div className="container footer-marquee">
        <div><span className="footer-kicker"><CirclePlay size={16} /> See how mentors teach</span><h2>Find the person who makes it click.</h2></div>
        <div><p>Watch teaching previews, compare real context, then start with a trial class.</p><Link className="button button-white" to="/tutors">Explore mentors <ArrowRight size={16} /></Link></div>
      </div>
      <div className="container footer-main">
        <div className="footer-brand"><Brand light /><p>A video-first tutoring marketplace for students who want to understand the person behind the profile.</p><Link to={user ? roleHome(user.role) : "/register"}>{user ? "Open your workspace" : "Create your account"} <ArrowUpRight size={15} /></Link></div>
        <div className="footer-grid">
        <nav aria-labelledby="footer-marketplace"><h3 id="footer-marketplace">Marketplace</h3><Link to="/tutors">Explore mentors</Link><Link to="/student-requests">Open student briefs</Link><Link to="/become-a-tutor">Become a mentor</Link></nav>
        <nav aria-labelledby="footer-information"><h3 id="footer-information">Information</h3><Link to="/how-it-works">How it works</Link><Link to="/about">About</Link><Link to="/contact">Contact</Link></nav>
        <nav aria-labelledby="footer-account"><h3 id="footer-account">Account</h3>{user ? <Link to={roleHome(user.role)}>Open workspace</Link> : <><Link to="/register">Register</Link><Link to="/login">Log in</Link></>}</nav>
        </div>
      </div>
      <div className="container footer-bottom"><span>© 2026 Mentor Market</span><span>Designed and built in Dhaka</span><span>React · Express · MySQL</span></div>
    </footer>
  );
}
