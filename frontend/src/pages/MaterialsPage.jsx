import { FileUp, Library } from "lucide-react";
import { useState } from "react";
import api, { getErrorMessage } from "../api/axios.js";
import Alert from "../components/Alert.jsx";
import FormField from "../components/FormField.jsx";
import PageHeader from "../components/PageHeader.jsx";
import ResourcePage from "../components/ResourcePage.jsx";

export default function MaterialsPage() {
  const [version, setVersion] = useState(0);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({ title: "", subject: "", student_id: "", file_url: "", description: "" });
  const change = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  const submit = async (event) => { event.preventDefault(); try { await api.post("/study-materials", form); setMessage("Material shared."); setVersion((value) => value + 1); } catch (requestError) { setMessage(getErrorMessage(requestError)); } };
  const columns = [{ key: "title", label: "Material" }, { key: "subject", label: "Subject" }, { key: "student_id", label: "Student ID" }, { key: "file_url", label: "File", render: (value) => <a href={value} target="_blank" rel="noreferrer">Open file ↗</a> }, { key: "created_at", label: "Shared", render: (value) => new Date(value).toLocaleDateString() }];
  return <section className="materials-page"><PageHeader eyebrow="Resource studio" title="Study materials" description="Turn useful files and links into an organized library each student can return to." /><form className="panel inline-create-form" onSubmit={submit}><div className="panel-heading"><div><span className="panel-eyebrow">New resource</span><h2>Share material</h2></div><FileUp size={21} /></div><Alert type={message.includes("shared") ? "success" : "error"}>{message}</Alert><div className="form-grid"><FormField name="title" label="Title" value={form.title} onChange={change} required /><FormField name="subject" label="Subject" value={form.subject} onChange={change} required /><FormField name="student_id" label="Student ID" type="number" value={form.student_id} onChange={change} /><FormField name="file_url" label="File URL" type="url" value={form.file_url} onChange={change} required /><FormField name="description" label="Description" as="textarea" value={form.description} onChange={change} /></div><button className="button"><FileUp size={15} /> Share material</button></form><div className="nested-resource"><div className="nested-resource-mark"><Library size={18} /></div><ResourcePage key={version} title="Shared library" endpoint="/study-materials" columns={columns} /></div></section>;
}
