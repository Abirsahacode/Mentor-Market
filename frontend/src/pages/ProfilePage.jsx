import { BadgeCheck, BookOpen, Check, MapPin, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import api, { getErrorMessage } from "../api/axios.js";
import Alert from "../components/Alert.jsx";
import FormField from "../components/FormField.jsx";
import LoadingSpinner from "../components/LoadingSpinner.jsx";
import PageHeader from "../components/PageHeader.jsx";
import UserAvatar from "../components/UserAvatar.jsx";
import useApi from "../hooks/useApi.js";
import useAuth from "../hooks/useAuth.js";

const studentFields = [
  ["class_level", "Class / grade"], ["institution", "Institution"], ["location", "Location"],
  ["subjects", "Subjects (comma separated)"], ["learning_goals", "Learning goals", "textarea"], ["bio", "Short bio", "textarea"],
];
const tutorFields = [
  ["qualifications", "Qualifications", "textarea"], ["experience_years", "Years of experience", "number"],
  ["subjects", "Subjects (comma separated)"], ["teaching_mode", "Teaching mode", "select"], ["hourly_rate", "Hourly rate (৳)", "number"],
  ["location", "Location"], ["availability", "Availability"], ["bio", "Professional bio", "textarea"],
];

export default function ProfilePage({ role }) {
  const endpoint = role === "student" ? "/students/profile" : "/tutors/profile";
  const { data, loading, error } = useApi(endpoint, null);
  const { user } = useAuth();
  const [form, setForm] = useState({});
  const [message, setMessage] = useState("");
  useEffect(() => {
    if (data) {
      const profile = role === "student" ? data.profile || {} : data;
      setForm({ ...profile, subjects: Array.isArray(profile.subjects) ? profile.subjects.join(", ") : (() => { try { return JSON.parse(profile.subjects || "[]").join(", "); } catch { return profile.subjects || ""; } })() });
    }
  }, [data, role]);
  const change = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  const submit = async (event) => {
    event.preventDefault(); setMessage("");
    try { await api.put(endpoint, { ...form, subjects: form.subjects?.split(",").map((item) => item.trim()).filter(Boolean) }); setMessage("Profile saved successfully."); }
    catch (requestError) { setMessage(getErrorMessage(requestError)); }
  };
  const fields = role === "student" ? studentFields : tutorFields;
  const completion = role === "tutor" ? Number(form.profile_completion || 20) : Math.round((fields.filter(([name]) => String(form[name] || "").trim()).length / fields.length) * 100);
  return <section className="profile-studio-page"><PageHeader eyebrow="Identity studio" title="Make the introduction feel human" description="A clear, specific profile helps the right learning relationship start with confidence." />{loading ? <LoadingSpinner /> : <div className="profile-studio-grid"><aside className="profile-studio-aside"><div className="profile-studio-portrait"><UserAvatar name={user.full_name} image={user.avatar_url} size="profile" /><span>{role === "tutor" ? <BadgeCheck size={15} /> : <Sparkles size={15} />} {role === "tutor" ? "Mentor profile" : "Student profile"}</span></div><h2>{user.full_name}</h2><p>{user.email}</p><div className="profile-completion"><div><span>Profile strength</span><strong>{completion}%</strong></div><i><b style={{ width: `${Math.min(completion, 100)}%` }} /></i></div>{role === "tutor" && completion < 60 ? <p className="profile-completion-hint">Reach 60% to appear in student search results. {60 - completion}% to go.</p> : null}<div className="profile-studio-notes"><span><Check size={15} /> Use details someone can respond to</span><span><MapPin size={15} /> Keep location and mode current</span><span><BookOpen size={15} /> Be specific about subjects and goals</span></div></aside><form className="panel profile-form" onSubmit={submit}><div className="profile-form-heading"><span className="panel-eyebrow">Public information</span><h2>{role === "student" ? "Your learning context" : "Your teaching practice"}</h2><p>{role === "student" ? "Help mentors understand where you are now and what progress looks like to you." : "Give students enough signal to understand your expertise, style, and availability."}</p></div><Alert>{error}</Alert><Alert type={message.includes("success") ? "success" : "error"}>{message}</Alert><div className="form-grid">{fields.map(([name, label, kind]) => <FormField key={name} name={name} label={label} value={form[name]} onChange={change} type={kind === "number" ? "number" : "text"} as={kind === "textarea" ? "textarea" : undefined} options={kind === "select" ? ["online", "offline", "both"] : undefined} />)}</div><div className="form-actions"><button className="button">Save profile changes</button></div></form></div>}</section>;
}
