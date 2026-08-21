import { Banknote, Check, Clock3, Image, MapPin, Play, Sparkles, Video } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { getErrorMessage } from "../api/axios.js";
import Alert from "../components/Alert.jsx";
import FormField from "../components/FormField.jsx";
import PageHeader from "../components/PageHeader.jsx";

const requestFields = [
  ["subject", "Subject"], ["class_level", "Class level or exam"], ["budget", "Budget (৳)", "number"], ["location", "Location"],
  ["teaching_mode", "Teaching mode", "select", ["online", "offline", "both"]], ["preferred_time", "Preferred time"],
  ["required_experience", "Required experience"], ["description", "What support do you need?", "textarea"],
];
const serviceFields = [
  ["title", "Service title"], ["subject", "Subject"], ["level", "Level"], ["price", "Price per class/hour (৳)", "number"],
  ["teaching_mode", "Teaching mode", "select", ["online", "offline", "both"]], ["location", "Location"], ["availability", "Availability"],
  ["has_trial", "Trial class", "select", [{ value: "true", label: "Available" }, { value: "false", label: "Not available" }]],
  ["thumbnail_url", "Thumbnail image URL"], ["demo_video_url", "Demo video URL"], ["description", "Service description", "textarea"],
];

export default function CreateListingPage({ type }) {
  const isRequest = type === "request";
  const fields = isRequest ? requestFields : serviceFields;
  const [form, setForm] = useState({ teaching_mode: "online" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();
  const change = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  const [fieldErrors, setFieldErrors] = useState({});
  const validateForm = (data) => {
    const errors = {};
    if (!isRequest) {
      if (data.price !== undefined && data.price !== "" && (isNaN(data.price) || Number(data.price) <= 0)) errors.price = "Must be a positive number";
      if (data.thumbnail_url && !/^https?:\/\/.+/.test(data.thumbnail_url)) errors.thumbnail_url = "Must be a valid URL";
      if (data.demo_video_url && !/^https?:\/\/.+/.test(data.demo_video_url)) errors.demo_video_url = "Must be a valid URL";
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };
  const submit = async (event, statusOverride) => {
    event.preventDefault();
    if (!validateForm(form)) return;
    setSaving(true); setError("");
    try {
      const payload = { ...form };
      if (!isRequest) {
        payload.has_trial = form.has_trial === "true";
        if (statusOverride) payload.status = statusOverride;
      }
      await api.post(isRequest ? "/student-requests" : "/tutor-posts", payload);
      navigate(isRequest ? "/student/requests" : "/tutor/services", { state: { success: "Created successfully" } });
    } catch (requestError) { setError(getErrorMessage(requestError)); }
    finally { setSaving(false); }
  };
  return <section className="listing-studio-page"><PageHeader eyebrow={isRequest ? "Find your mentor" : "Creator studio"} title={isRequest ? "Post a tutor request" : "Create a teaching service"} description={isRequest ? "Tell mentors what you want to learn, your budget, and when you are available." : "Build a course card students can watch, save, compare, and book from their discovery feed."} /><div className={`service-composer ${isRequest ? "request-composer" : ""}`}><form className="panel listing-form" onSubmit={submit}><Alert>{error}</Alert><div className="form-grid">{fields.map(([name, label, kind, options]) => <FormField key={name} name={name} label={label} value={form[name]} onChange={change} error={fieldErrors[name]} required={!['location', 'required_experience', 'has_trial', 'thumbnail_url', 'demo_video_url'].includes(name)} type={kind === "number" ? "number" : "text"} as={kind === "textarea" ? "textarea" : undefined} options={kind === "select" ? options : undefined} />)}</div>{!isRequest && <div className="creator-guidance"><Sparkles size={16} /><p><strong>Make the first six seconds count.</strong><span>A clear outcome-led title and a focused preview help students understand your teaching style quickly.</span></p></div>}<div className="form-actions"><button type="button" className="button button-ghost" onClick={() => navigate(-1)}>Cancel</button>{!isRequest && <button type="button" className="button button-ghost" disabled={saving} onClick={(e) => submit(e, "draft")}>{saving ? "Saving…" : "Save as draft"}</button>}<button className="button" disabled={saving}>{saving ? "Publishing…" : "Publish now"}</button></div></form>{isRequest && <aside className="request-brief-preview"><span className="panel-eyebrow">Live request brief</span><h2>{form.subject || "What do you want to learn?"}</h2><p>{form.description || "Add a useful description and mentors will understand the exact support you need."}</p><div className="request-brief-facts"><span><Banknote size={16} /><small>Budget</small><strong>{form.budget ? `৳${Number(form.budget).toLocaleString()}` : "Set a budget"}</strong></span><span><MapPin size={16} /><small>Place</small><strong>{form.location || form.teaching_mode || "Choose a mode"}</strong></span><span><Clock3 size={16} /><small>Best time</small><strong>{form.preferred_time || "Add availability"}</strong></span></div><div className="request-brief-checklist"><span className={form.subject ? "done" : ""}><Check size={14} /> Clear subject</span><span className={form.class_level ? "done" : ""}><Check size={14} /> Learning level</span><span className={form.budget ? "done" : ""}><Check size={14} /> Realistic budget</span><span className={form.description?.length >= 50 ? "done" : ""}><Check size={14} /> Useful context</span></div></aside>}{!isRequest && <aside className="service-live-preview"><div className="creator-preview-heading"><div><span>Live preview</span><h2>Student feed card</h2></div><i>Updates as you type</i></div><article className="creator-preview-card"><div className="creator-preview-media">{form.thumbnail_url ? <img key={form.thumbnail_url} src={form.thumbnail_url} alt="" onError={(event) => { event.currentTarget.hidden = true; }} /> : <div><Image size={27} /><span>Add a thumbnail URL</span></div>}{form.demo_video_url ? <video src={form.demo_video_url} poster={form.thumbnail_url} muted loop playsInline controls /> : <span className="creator-video-placeholder"><Play size={16} fill="currentColor" /> Demo preview</span>}</div><div className="creator-preview-body"><small>{form.subject || "Your subject"} · {form.level || "Course level"}</small><h3>{form.title || "A clear, specific course title"}</h3><p>{form.description || "Explain the result a student can expect after taking this class."}</p><div><span>{form.has_trial === "true" ? "Trial available" : form.teaching_mode || "Online"}</span><strong>৳{Number(form.price || 0).toLocaleString()}<small>/class</small></strong></div></div></article><div className="creator-quality-list"><span><Check size={14} /> Outcome-led title</span><span className={form.thumbnail_url ? "done" : ""}><Check size={14} /> Course thumbnail</span><span className={form.demo_video_url ? "done" : ""}><Video size={14} /> Demo video</span><span className={form.description?.length >= 80 ? "done" : ""}><Check size={14} /> Detailed description</span></div></aside>}</div></section>;
}
