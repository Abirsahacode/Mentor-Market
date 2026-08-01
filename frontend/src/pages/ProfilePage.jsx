import { BadgeCheck, BookOpen, Calendar, Check, MapPin, Sparkles } from "lucide-react";
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
  ["location", "Location"], ["availability", "Availability notes (e.g. \"Evenings and weekends\")"], ["bio", "Professional bio", "textarea"],
];
const fieldHints = {
  class_level: "Up to 80 characters.",
  subjects: "Separate up to 20 subjects with commas.",
  learning_goals: "Up to 2,000 characters.",
  bio: "Up to 2,000 characters.",
  qualifications: "Up to 2,000 characters.",
  experience_years: "Enter a value from 0 to 60.",
  hourly_rate: "Enter an amount from ৳0 to ৳100,000.",
  availability: "Up to 255 characters.",
};
// Mirrors backend/src/utils/availability.js so the picker can only ever
// produce values the search filter (and the database SET column) accept.
const dayTokens = [["mon", "Mon"], ["tue", "Tue"], ["wed", "Wed"], ["thu", "Thu"], ["fri", "Fri"], ["sat", "Sat"], ["sun", "Sun"]];
const toProfileForm = (profile = {}) => ({
  ...profile,
  subjects: Array.isArray(profile.subjects)
    ? profile.subjects.join(", ")
    : (() => {
      try { return JSON.parse(profile.subjects || "[]").join(", "); }
      catch { return profile.subjects || ""; }
    })(),
});
const validationErrors = (requestError) => {
  const details = requestError.response?.data?.error?.details;
  if (!Array.isArray(details)) return {};
  return details.reduce((errors, detail) => {
    const field = String(detail?.field || "").replace(/\[.*$/, "").split(".")[0];
    if (!field || errors[field]) return errors;
    const reason = String(detail?.reason || "Please check this field");
    errors[field] = `${reason.charAt(0).toUpperCase()}${reason.slice(1)}`;
    return errors;
  }, {});
};

export default function ProfilePage({ role }) {
  const endpoint = role === "student" ? "/students/profile" : "/tutors/profile";
  const fields = role === "student" ? studentFields : tutorFields;
  const { data, loading, error, reload } = useApi(endpoint, null);
  const { user } = useAuth();
  const [form, setForm] = useState({});
  const [message, setMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (data) {
      const profile = role === "student" ? data.profile || {} : data;
      setForm(toProfileForm(profile));
      setFieldErrors({});
    }
  }, [data, role]);
  const change = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setFieldErrors((current) => {
      if (!current[name]) return current;
      const next = { ...current };
      delete next[name];
      return next;
    });
  };
  const selectedDays = (form.available_days || "").split(",").filter(Boolean);
  const toggleDay = (day) => setForm((current) => {
    const active = new Set((current.available_days || "").split(",").filter(Boolean));
    active.has(day) ? active.delete(day) : active.add(day);
    return { ...current, available_days: dayTokens.map(([value]) => value).filter((value) => active.has(value)).join(",") };
  });
  const submit = async (event) => {
    event.preventDefault(); setMessage(""); setFieldErrors({}); setSaving(true);
    try {
      const response = await api.put(endpoint, { ...form, subjects: form.subjects?.split(",").map((item) => item.trim()).filter(Boolean) });
      setForm(toProfileForm(response.data.data));
      setMessage("Profile saved successfully.");
    }
    catch (requestError) {
      const nextFieldErrors = validationErrors(requestError);
      const visibleFields = new Set(fields.map(([name]) => name));
      const visibleFieldErrors = Object.fromEntries(Object.entries(nextFieldErrors).filter(([field]) => visibleFields.has(field)));
      setFieldErrors(visibleFieldErrors);
      const hasUnhandledError = !Object.keys(visibleFieldErrors).length
        || Object.keys(nextFieldErrors).some((field) => !visibleFields.has(field));
      setMessage(hasUnhandledError ? getErrorMessage(requestError) : "");
    }
    finally { setSaving(false); }
  };
  const completion = role === "tutor" ? Number(form.profile_completion || 20) : Math.round((fields.filter(([name]) => String(form[name] || "").trim()).length / fields.length) * 100);
  return <section className="profile-studio-page"><PageHeader eyebrow="Identity studio" title="Make the introduction feel human" description="A clear, specific profile helps the right learning relationship start with confidence." />{loading ? <LoadingSpinner /> : error && !data ? <div className="panel"><Alert>{error}</Alert><button type="button" className="button button-ghost" onClick={reload}>Try loading again</button></div> : <div className="profile-studio-grid"><aside className="profile-studio-aside"><div className="profile-studio-portrait"><UserAvatar name={user.full_name} image={user.avatar_url} size="profile" /><span>{role === "tutor" ? <BadgeCheck size={15} /> : <Sparkles size={15} />} {role === "tutor" ? "Mentor profile" : "Student profile"}</span></div><h2>{user.full_name}</h2><p>{user.email}</p><div className="profile-completion"><div><span>Profile strength</span><strong>{completion}%</strong></div><i><b style={{ width: `${Math.min(completion, 100)}%` }} /></i></div><div className="profile-studio-notes"><span><Check size={15} /> Use details someone can respond to</span><span><MapPin size={15} /> Keep location and mode current</span><span><BookOpen size={15} /> Be specific about subjects and goals</span></div></aside><form className="panel profile-form" onSubmit={submit}><div className="profile-form-heading"><span className="panel-eyebrow">Public information</span><h2>{role === "student" ? "Your learning context" : "Your teaching practice"}</h2><p>{role === "student" ? "Help mentors understand where you are now and what progress looks like to you." : "Give students enough signal to understand your expertise, style, and availability."}</p></div><Alert>{error}</Alert><Alert type={message.includes("success") ? "success" : "error"}>{message}</Alert><div className="form-grid">{fields.map(([name, label, kind]) => <FormField key={name} name={name} label={label} value={form[name]} onChange={change} type={kind === "number" ? "number" : "text"} as={kind === "textarea" ? "textarea" : undefined} options={kind === "select" ? ["online", "offline", "both"] : undefined} error={fieldErrors[name]} hint={fieldHints[name]} />)}</div>{role === "tutor" && <fieldset className="form-field day-picker-field role-selector"><legend><Calendar size={14} aria-hidden="true" /> Days you are usually available</legend><div className="day-picker">{dayTokens.map(([value, label]) => <button type="button" key={value} className={selectedDays.includes(value) ? "active" : ""} aria-pressed={selectedDays.includes(value)} onClick={() => toggleDay(value)}>{label}</button>)}</div></fieldset>}<div className="form-actions"><button className="button" disabled={saving}>{saving ? "Saving…" : "Save profile changes"}</button></div></form></div>}</section>;
}
