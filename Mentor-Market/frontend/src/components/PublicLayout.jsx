import { ArrowUp } from "lucide-react";
import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Footer from "./Footer.jsx";
import Navbar from "./Navbar.jsx";

export default function PublicLayout() {
  const location = useLocation();
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowBackToTop(window.scrollY > 720);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return <div className="public-shell">
    <a className="public-skip-link" href="#public-content">Skip to content</a>
    <Navbar />
    <div id="public-content" tabIndex="-1"><div className="public-route-frame" key={location.pathname}><Outlet /></div></div>
    <Footer />
    <button className={`public-back-to-top ${showBackToTop ? "is-visible" : ""}`} type="button" onClick={() => window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" })} aria-label="Back to top"><ArrowUp size={18} /></button>
  </div>;
}
