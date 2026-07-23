import { ArrowRight, CirclePlay, Mail, MapPin, ShieldCheck, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import AmbientVideo from "../../components/AmbientVideo.jsx";
import DemoVideo from "../../components/DemoVideo.jsx";

const content = {
  about: {
    label: "About Mentor Market",
    title: "A better match starts with more context.",
    text: "Mentor Market is a university software engineering project built around one practical idea: students should be able to see how someone teaches—not just read what they teach.",
    note: "Built for thoughtful independent tutoring.",
    media: "/media/math-demo.mp4",
    poster: "/media/math-studio.svg",
    items: [["For students", "Watch previews, search profiles, publish a brief, compare proposals, book classes, and keep coursework organized."], ["For mentors", "Show your teaching style, publish focused services, respond to relevant needs, and manage classes in one workspace."], ["For trust", "Verification context, reports, reviews, and moderation tools help people make more informed decisions."]],
  },
  "how-it-works": {
    label: "How the marketplace works",
    title: "From first impression to first class.",
    text: "There are two ways to find a match: explore mentors through their teaching previews, or publish exactly what you need and invite relevant proposals.",
    note: "You choose the path. The workspace keeps both organized.",
    media: "/media/physics-demo.mp4",
    poster: "/media/physics-studio.svg",
    items: [["Explore or describe", "Browse by subject, mode, location, price, and rating—or write a student brief with the details that matter."], ["Watch and talk", "Use class previews to understand teaching style, then message or compare proposals before deciding."], ["Book and build momentum", "Request a trial or regular class, then manage materials, assignments, quizzes, reviews, and progress."]],
  },
  "become-a-tutor": {
    label: "Teach on Mentor Market",
    title: "Your teaching style is your strongest profile.",
    text: "Create a mentor account, show students how you explain, and connect with learners actively looking for your subjects.",
    note: "A focused six-second preview can say more than a long generic bio.",
    media: "/media/code-demo.mp4",
    poster: "/media/code-studio.svg",
    items: [["Build a credible profile", "Add qualifications, experience, subjects, fees, availability, location, and your preferred teaching mode."], ["Show, do not only tell", "Add course artwork and a short demo so students can understand your energy, clarity, and approach."], ["Find the right students", "Browse open briefs, send specific proposals, accept bookings, and manage teaching from your dashboard."]],
  },
  contact: {
    label: "Support and safety",
    title: "Questions deserve a human answer.",
    text: "This demonstration project does not send external support tickets, but these details represent the intended support and safety flow.",
    note: "For urgent safety concerns, use the report tools inside your account.",
    media: "/media/english-demo.mp4",
    poster: "/media/english-studio.svg",
    items: [["Email", "hello@mentormarket.test"], ["Phone", "+880 1700 000 000"], ["Office", "Dhaka, Bangladesh"]],
  },
};

export default function StaticPage({ page }) {
  const item = content[page];
  const isTutor = page === "become-a-tutor";
  const isContact = page === "contact";
  const primaryAction = isContact
    ? <a className="button" href="mailto:hello@mentormarket.test">Email support <ArrowRight size={16} /></a>
    : <Link className="button" to={isTutor ? "/register?role=tutor" : "/tutors"}>{isTutor ? "Start teaching" : "Explore mentors"} <ArrowRight size={16} /></Link>;
  return <main className={`information-page information-${page}`}>
    <section className="simple-hero"><div className="container simple-hero-grid"><div className="simple-hero-copy"><span className="page-index"><i /> {item.label}</span><h1>{item.title}</h1><p>{item.text}</p><div className="simple-hero-actions">{primaryAction}{!isContact && page !== "how-it-works" && <Link className="text-link" to="/how-it-works">See how it works</Link>}</div></div><div className="information-visual"><AmbientVideo src={item.media} poster={item.poster} label={`${item.label} preview`} /><span className="information-video-label"><i /> Mentor Market in motion</span><DemoVideo src={item.media} poster={item.poster} title={item.label} variant="icon" /><div><CirclePlay size={17} /><p>{item.note}</p></div></div></div></section>
    <section className="section container information-layout"><aside><span>What to know</span><p>Three useful details before you get started.</p><div><Sparkles size={16} /><small>Clear context creates better matches.</small></div></aside><div className="information-list">{item.items.map(([title, text], index) => <article key={title}><span>{String(index + 1).padStart(2, "0")}</span><h2>{title}</h2><p>{isContact && title === "Email" ? <a href={`mailto:${text}`}>{text}</a> : isContact && title === "Phone" ? <a href={`tel:${text.replaceAll(" ", "")}`}>{text}</a> : text}</p>{isContact && index === 0 ? <Mail size={20} /> : isContact && index === 2 ? <MapPin size={20} /> : <ArrowRight size={20} />}</article>)}</div></section>
    <section className="container information-principle"><ShieldCheck size={23} /><div><span>{isContact ? "Support principle" : "Marketplace principle"}</span><h2>{isContact ? "Make concerns easy to raise and clear to follow." : "Enough signal to choose. Enough structure to keep going."}</h2></div><p>{isContact ? "Messages, reports, and admin review are designed as simple database-backed workflows in this project." : "Mentor discovery is only the beginning. Bookings, messages, learning tools, and feedback carry the relationship forward."}</p></section>
    <section className="container information-cta"><div><small>{isContact ? "We are here to help" : isTutor ? "Your experience belongs in view" : "Ready when you are"}</small><h2>{isContact ? "Tell us what you need." : isTutor ? "Show students how you teach." : "Find a mentor who feels right."}</h2><p>{isContact ? "Share the account, booking, or safety context and we will point you to the right next step." : isTutor ? "Create your mentor profile and publish your first teaching service." : "Create an account or explore teaching previews first."}</p></div>{isContact ? <a className="button" href="mailto:hello@mentormarket.test">Email support <ArrowRight size={15} /></a> : <Link className="button" to={isTutor ? "/register?role=tutor" : "/register"}>{isTutor ? "Become a mentor" : "Create an account"} <ArrowRight size={15} /></Link>}<Link className="text-link" to="/tutors">Browse mentors</Link></section>
  </main>;
}
