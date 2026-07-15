import { ArrowRight, ArrowUpRight, CirclePlay } from "lucide-react";
import { Link } from "react-router-dom";
import Brand from "./Brand.jsx";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-marquee">
        <div><span className="footer-kicker"><CirclePlay size={16} /> See how mentors teach</span><h2>Find the person who makes it click.</h2></div>
        <div><p>Watch teaching previews, compare real context, then start with a trial class.</p><Link className="button button-white" to="/tutors">Explore mentors <ArrowRight size={16} /></Link></div>
      </div>
      <div className="container footer-main">
        <div className="footer-brand"><Brand light /><p>A video-first tutoring marketplace for students who want to understand the person behind the profile.</p><Link to="/register">Create your account <ArrowUpRight size={15} /></Link></div>
        <div className="footer-grid">
        <div><h4>Marketplace</h4><Link to="/tutors">Explore mentors</Link><Link to="/student-requests">Open student briefs</Link><Link to="/become-a-tutor">Become a tutor</Link></div>
        <div><h4>Information</h4><Link to="/how-it-works">How it works</Link><Link to="/about">About</Link><Link to="/contact">Contact</Link></div>
        <div><h4>Account</h4><Link to="/register">Register</Link><Link to="/login">Log in</Link></div>
        </div>
      </div>
      <div className="container footer-bottom"><span>© 2026 Mentor Market</span><span>Designed and built in Dhaka</span><span>React · Express · MySQL</span></div>
    </footer>
  );
}
