import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";

const publicMeta = {
  "/": ["Mentor Market · Learning made personal", "Watch teaching previews, compare mentor expertise and rates, and find a tutor who fits how you learn."],
  "/tutors": ["Explore mentors · Mentor Market", "Search teaching previews and compare mentors by subject, format, location, rating, and price."],
  "/student-requests": ["Open student briefs · Mentor Market", "Browse current student learning needs and respond with a focused teaching proposal."],
  "/about": ["About · Mentor Market", "Learn why Mentor Market puts teaching style and real context at the center of tutor discovery."],
  "/how-it-works": ["How it works · Mentor Market", "See how students and mentors move from discovery and proposals to classes and learning tools."],
  "/become-a-tutor": ["Teach on Mentor Market", "Show students how you teach, publish focused services, and manage classes in one workspace."],
  "/contact": ["Support · Mentor Market", "Find Mentor Market support, safety, and contact information."],
  "/login": ["Log in · Mentor Market", "Return to your Mentor Market student, mentor, or admin workspace."],
  "/register": ["Create an account · Mentor Market", "Join Mentor Market as a student or mentor."],
};

const humanize = (value) => value.replaceAll("-", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

export default function RouteEffects() {
  const location = useLocation();
  const initialRender = useRef(true);
  const [announcement, setAnnouncement] = useState("");

  useEffect(() => {
    const isTutorProfile = /^\/tutors\/[^/]+$/.test(location.pathname);
    const fallbackLabel = humanize(location.pathname.split("/").filter(Boolean).at(-1) || "Mentor Market");
    const [title, description] = publicMeta[location.pathname]
      || (isTutorProfile
        ? ["Mentor profile · Mentor Market", "Review this mentor's teaching preview, classes, experience, and booking options."]
        : [`${fallbackLabel} · Mentor Market`, "Learn, teach, and manage your Mentor Market workspace."]);
    document.title = title;
    document.querySelector('meta[name="description"]')?.setAttribute("content", description);
    document.querySelector('meta[property="og:title"]')?.setAttribute("content", title);
    document.querySelector('meta[property="og:description"]')?.setAttribute("content", description);
    document.querySelector('meta[name="twitter:title"]')?.setAttribute("content", title);
    document.querySelector('meta[name="twitter:description"]')?.setAttribute("content", description);
    setAnnouncement(title.replace(" · Mentor Market", ""));

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!location.hash) window.scrollTo({ top: 0, behavior: "auto" });

    if (initialRender.current) {
      initialRender.current = false;
      return undefined;
    }

    let timeout;
    let observer;
    const finishNavigation = () => {
      const heading = document.querySelector("main h1, .dashboard-main h1, [role='main'] h1");
      if (!heading) return false;
      heading.setAttribute("tabindex", "-1");
      heading.focus({ preventScroll: Boolean(location.hash) });
      heading.addEventListener("blur", () => heading.removeAttribute("tabindex"), { once: true });
      if (location.hash) {
        const target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
        target?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
      }
      return true;
    };
    if (!finishNavigation()) {
      observer = new MutationObserver(() => { if (finishNavigation()) observer.disconnect(); });
      observer.observe(document.getElementById("root"), { childList: true, subtree: true });
      timeout = window.setTimeout(() => observer.disconnect(), 2500);
    }
    return () => { observer?.disconnect(); window.clearTimeout(timeout); };
  }, [location.hash, location.pathname]);

  return <span className="sr-only" role="status" aria-live="polite" aria-atomic="true">{announcement}</span>;
}
