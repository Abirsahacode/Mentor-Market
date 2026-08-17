import { ArrowRight, ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import useAuth from "../hooks/useAuth.js";
import { roleHome } from "../utils/roleHome.js";
import Brand from "./Brand.jsx";

export default function Footer() {
  const { user } = useAuth();
  return (
    <footer className="footer">
      <div className="container footer-callout">
        <div><span className="footer-kicker">A thoughtful first step</span><h2>See the teaching style before you choose the teacher.</h2></div>
        <Link className="button button-white" to="/tutors">Meet the mentors <ArrowRight size={16} /></Link>
      </div>
      <div className="container footer-main">
        <div className="footer-brand"><Brand light /><p>A more human way to find one-to-one learning—built around teaching previews, useful context, and a good fit.</p><Link to={user ? roleHome(user.role) : "/register"}>{user ? "Open your workspace" : "Create your free account"} <ArrowUpRight size={15} /></Link></div>
        <div className="footer-grid">
        <nav aria-labelledby="footer-marketplace"><h3 id="footer-marketplace">Marketplace</h3><Link to="/tutors">Explore mentors</Link><Link to="/student-requests">Student briefs</Link><Link to="/become-a-tutor">Become a mentor</Link></nav>
        <nav aria-labelledby="footer-information"><h3 id="footer-information">Information</h3><Link to="/how-it-works">How it works</Link><Link to="/about">About</Link><Link to="/contact">Contact</Link></nav>
        <nav aria-labelledby="footer-account"><h3 id="footer-account">Account</h3>{user ? <Link to={roleHome(user.role)}>Open workspace</Link> : <><Link to="/register">Register</Link><Link to="/login">Log in</Link></>}</nav>
        </div>
      </div>
      <div className="container footer-bottom"><span>© 2026 Mentor Market</span><span>Made in Dhaka, Bangladesh</span><span>Learning begins with a good match.</span></div>
    </footer>
  );
}
