import { FileUp, Library } from "lucide-react";
import { useState } from "react";
import api, { getErrorMessage } from "../api/axios.js";
import Alert from "../components/Alert.jsx";
import FormField from "../components/FormField.jsx";
import PageHeader from "../components/PageHeader.jsx";
import ResourcePage from "../components/ResourcePage.jsx";
import useApi from "../hooks/useApi.js";

export default function MaterialsPage() {
  const { data: bookings, error: bookingsError } = useApi("/bookings");
  const [version, setVersion] = useState(0);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ title: "", subject: "", student_id: "", file_url: "", description: "" });
  const change = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  const studentOptions = [...new Map((bookings || []).filter((booking) => booking.student_id && booking.student_name).map((booking) => [booking.student_id, { value: booking.student_id, label: booking.student_name }])).values()];
  const studentNames = new Map(studentOptions.map((student) => [Number(student.value), student.label]));
  const submit = async (event) => {
    event.preventDefault(); setSubmitting(true); setMessage("");
    try {
      await api.post("/study-materials", form);
      setMessage("Material shared.");
      setForm({ title: "", subject: "", student_id: "", file_url: "", description: "" });
      setVersion((value) => value + 1);
    } catch (requestError) { setMessage(getErrorMessage(requestError)); }
    finally { setSubmitting(false); }
  };
  const columns = [{ key: "title", label: "Material" }, { key: "subject", label: "Subject" }, { key: "student_id", label: "Shared with", render: (value) => value ? studentNames.get(Number(value)) || "Connected student" : "Tutor library" }, { key: "file_url", label: "File", render: (value) => <a href={value} target="_blank" rel="noreferrer">Open file ↗</a> }, { key: "created_at", label: "Shared", render: (value) => new Date(value).toLocaleDateString() }];
  return <section className="materials-page"><PageHeader eyebrow="Resource studio" title="Study materials" description="Turn useful files and links into an organized library each student can return to." /><form className="panel inline-create-form" onSubmit={submit}><div className="panel-heading"><div><span className="panel-eyebrow">New resource</span><h2>Share material</h2></div><FileUp size={21} /></div><Alert type={message.includes("shared") ? "success" : "error"}>{message}</Alert><Alert>{bookingsError}</Alert><div className="form-grid"><FormField name="title" label="Title" value={form.title} onChange={change} required /><FormField name="subject" label="Subject" value={form.subject} onChange={change} required /><FormField name="student_id" label="Student" options={studentOptions} value={form.student_id} onChange={change} required /><FormField name="file_url" label="File URL" type="url" value={form.file_url} onChange={change} required /><FormField name="description" label="Description" as="textarea" value={form.description} onChange={change} /></div>{!studentOptions.length && !bookingsError ? <p className="form-context-note">Students appear here after a class connection is created.</p> : null}<button className="button" disabled={submitting || !studentOptions.length} aria-busy={submitting || undefined}><FileUp size={15} /> {submitting ? "Sharing material…" : "Share material"}</button></form><div className="nested-resource"><div className="nested-resource-mark"><Library size={18} /></div><ResourcePage key={version} title="Shared library" endpoint="/study-materials" columns={columns} headingLevel={2} /></div></section>;
}
