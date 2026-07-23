import {
  ArrowLeft, ArrowRight, BookOpen, Check, CirclePlay, Eye, EyeOff, GraduationCap, ShieldCheck, Sparkles,
} from "lucide-react";
import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { getErrorMessage } from "../../api/axios.js";
import Alert from "../../components/Alert.jsx";
import AmbientVideo from "../../components/AmbientVideo.jsx";
import Brand from "../../components/Brand.jsx";
import DemoVideo from "../../components/DemoVideo.jsx";
import FormField from "../../components/FormField.jsx";
import useAuth from "../../hooks/useAuth.js";
import { roleHome } from "../../utils/roleHome.js";

export default function AuthPage({ mode }) {
  const [searchParams] = useSearchParams();
  const requestedRole = searchParams.get("role");
  const [form, setForm] = useState({ full_name: "", email: "", password: "", role: ["student", "tutor"].includes(requestedRole) ? requestedRole : "student" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { user, login, register } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  if (user) return <Navigate to={roleHome(user.role)} replace />;
  const change = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  const submit = async (event) => {
    event.preventDefault(); setSubmitting(true); setError("");
    try {
      const nextUser = mode === "login" ? await login({ email: form.email, password: form.password }) : await register(form);
      const from = location.state?.from;
      const requestedPath = from?.pathname?.startsWith("/") && !from.pathname.startsWith("//")
        ? `${from.pathname}${from.search || ""}${from.hash || ""}`
        : "";
      navigate(requestedPath || roleHome(nextUser.role), { replace: true });
    } catch (requestError) { setError(getErrorMessage(requestError)); }
    finally { setSubmitting(false); }
  };
  const isLogin = mode === "login";
  const useDemo = (email) => setForm((current) => ({ ...current, email, password: "Password123!" }));
  const passwordChecks = [form.password.length >= 8, /[A-Z]/.test(form.password), /[0-9]/.test(form.password), /[^A-Za-z0-9]/.test(form.password)];
  const passwordScore = passwordChecks.filter(Boolean).length;
  const storyMedia = isLogin ? { video: "/media/physics-demo.mp4", poster: "/media/physics-studio.svg", subject: "Physics", title: "Mechanics Exam Sprint" } : form.role === "tutor" ? { video: "/media/code-demo.mp4", poster: "/media/code-studio.svg", subject: "Programming", title: "Learn by building" } : { video: "/media/math-demo.mp4", poster: "/media/math-studio.svg", subject: "Mathematics", title: "Ideas made visible" };

  return (
    <main className="auth-page auth-premium">
      <section className="auth-story" aria-label="Mentor Market preview">
        <AmbientVideo key={storyMedia.video} className="auth-story-video" src={storyMedia.video} poster={storyMedia.poster} label="background learning preview" decorative />
        <div className="auth-story-shade" />
        <div className="auth-story-top"><Brand light /><Link to="/"><ArrowLeft size={15} /> Back to site</Link></div>
        <div className="auth-story-content">
          <span className="auth-overline"><i /> Learning, in motion</span>
          <h1>{isLogin ? <>Pick up where<br />you left off.</> : form.role === "tutor" ? <>Teach what<br />you know well.</> : <>Find the person<br />who makes it click.</>}</h1>
          <p>{isLogin ? "Your classes, messages, coursework, and next steps are waiting in one calm workspace." : form.role === "tutor" ? "Show your approach, connect with the right students, and keep the work organized." : "Watch teaching previews, compare context, and begin with a class that feels right."}</p>
        </div>
        <div className="auth-preview-card">
          <div><span><i /> Previewing · {storyMedia.subject}</span><strong>{storyMedia.title}</strong><small>A short look at the video-first marketplace.</small></div>
          <DemoVideo src={storyMedia.video} poster={storyMedia.poster} title={storyMedia.title} variant="icon" />
        </div>
        <div className="auth-story-foot"><ShieldCheck size={16} /><span>JWT-secured accounts · Role-based workspaces</span><small>University software engineering project</small></div>
      </section>

      <section className="auth-form-wrap">
        <div className="auth-mobile-head"><Brand /><Link to="/"><ArrowLeft size={14} /> Back to site</Link></div>
        <form className="auth-form" onSubmit={submit}>
          <div className="auth-form-heading"><span>{isLogin ? "Welcome back" : "Create your workspace"}</span><h1>{isLogin ? "Log in to continue" : "Start with your role"}</h1><p>{isLogin ? "Use your account details or choose a demo workspace below." : "You can build your profile after creating the account."}</p></div>
          <Alert>{error}</Alert>
          {!isLogin && <FormField label="Full name" name="full_name" value={form.full_name} onChange={change} required placeholder="Your full name" autoComplete="name" />}
          <FormField label="Email address" name="email" type="email" value={form.email} onChange={change} required placeholder="you@example.com" autoComplete="email" />
          <div className="password-field"><FormField label="Password" name="password" type={showPassword ? "text" : "password"} value={form.password} onChange={change} required placeholder={isLogin ? "Enter your password" : "At least 8 characters"} autoComplete={isLogin ? "current-password" : "new-password"} /><button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div>
          {!isLogin && form.password && <div className="password-strength" aria-live="polite"><div aria-hidden="true">{[0, 1, 2, 3].map((step) => <i className={step < passwordScore ? "active" : ""} key={step} />)}</div><span>{passwordScore < 2 ? "Keep going" : passwordScore < 4 ? "Good password" : "Strong password"}</span><small>Use 8+ characters with a number and symbol.</small></div>}
          {!isLogin && <fieldset className="role-selector"><legend>I am joining as</legend><div><label className={form.role === "student" ? "selected" : ""}><input type="radio" name="role" value="student" checked={form.role === "student"} onChange={change} /><BookOpen size={20} /><span><b>Student</b><small>Find a mentor and manage learning</small></span><Check size={15} /></label><label className={form.role === "tutor" ? "selected" : ""}><input type="radio" name="role" value="tutor" checked={form.role === "tutor"} onChange={change} /><GraduationCap size={20} /><span><b>Mentor</b><small>Teach, connect, and organize classes</small></span><Check size={15} /></label></div></fieldset>}
          {isLogin && <div className="auth-options"><span><Sparkles size={14} /> Your role opens the right workspace automatically.</span><Link to="/contact">Need help?</Link></div>}
          <button className="button button-block auth-submit" disabled={submitting}>{submitting ? "Opening your workspace…" : isLogin ? <>Log in <ArrowRight size={17} /></> : <>Create account <ArrowRight size={17} /></>}</button>
          <div className="auth-switch">{isLogin ? "New to Mentor Market?" : "Already have an account?"} <Link to={isLogin ? "/register" : "/login"} state={location.state}>{isLogin ? "Create an account" : "Log in"}</Link></div>
          {isLogin && <details className="demo-access"><summary><CirclePlay size={16} /><span>Use a demo workspace<small>Explore the product with a ready-made account.</small></span></summary><div className="demo-access-grid"><button type="button" onClick={() => useDemo("ayesha@mentormarket.test")}><BookOpen size={16} /><span>Student<small>Discovery feed</small></span></button><button type="button" onClick={() => useDemo("farhan@mentormarket.test")}><GraduationCap size={16} /><span>Mentor<small>Teaching tools</small></span></button><button type="button" onClick={() => useDemo("admin@mentormarket.test")}><ShieldCheck size={16} /><span>Admin<small>Platform view</small></span></button></div></details>}
          {!isLogin && <p className="auth-terms">By creating an account, you agree to use this demonstration marketplace responsibly.</p>}
        </form>
      </section>
    </main>
  );
}
