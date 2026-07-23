import { BadgeCheck, Bell, CalendarCheck2, CheckCheck, CreditCard, FileCheck2, MessageCircle, ShieldAlert } from "lucide-react";
import { useState } from "react";
import api, { getErrorMessage } from "../api/axios.js";
import Alert from "../components/Alert.jsx";
import DataTable from "../components/DataTable.jsx";
import EmptyState from "../components/EmptyState.jsx";
import FormField from "../components/FormField.jsx";
import LoadingSpinner from "../components/LoadingSpinner.jsx";
import PageHeader from "../components/PageHeader.jsx";
import ResourcePage from "../components/ResourcePage.jsx";
import useApi from "../hooks/useApi.js";

const notificationIcon = (type = "") => {
  if (type.includes("message")) return MessageCircle;
  if (type.includes("booking")) return CalendarCheck2;
  if (type.includes("payment")) return CreditCard;
  if (type.includes("verification")) return BadgeCheck;
  if (type.includes("assignment") || type.includes("application")) return FileCheck2;
  return Bell;
};

export function StudentMaterialsPage() {
  const columns = [{ key: "title", label: "Material" }, { key: "subject", label: "Subject" }, { key: "description", label: "Description" }, { key: "file_url", label: "File", render: (value) => <a href={value} target="_blank" rel="noreferrer">Open / download ↗</a> }, { key: "created_at", label: "Shared", render: (value) => new Date(value).toLocaleDateString() }];
  return <ResourcePage title="Study materials" description="Files and learning links shared by your tutors." endpoint="/study-materials" columns={columns} />;
}

export function NotificationsPage() {
  const { data, loading, error, reload } = useApi("/notifications");
  const read = async (id) => { await api.patch(`/notifications/${id}/read`); reload(); };
  return <section className="notifications-page"><PageHeader eyebrow="Activity centre" title="What changed while you were learning" description="A clean timeline of applications, bookings, learning tasks, messages, payments, and verification." actions={<button className="button button-ghost" onClick={async () => { await api.patch("/notifications/read-all"); reload(); }}><CheckCheck size={16} /> Mark all read</button>} /><Alert>{error}</Alert>{loading ? <LoadingSpinner /> : data.length ? <div className="notification-list">{data.map((item) => { const Icon = notificationIcon(item.type); return <article className={item.is_read ? "notification-item" : "notification-item unread"} key={item.id}><span><Icon size={17} /></span><div><div className="notification-title-line"><strong>{item.title}</strong>{!item.is_read && <i>New</i>}</div><p>{item.message}</p><small>{new Date(item.created_at).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}</small></div>{!item.is_read && <button className="button button-tiny button-ghost" onClick={() => read(item.id)}>Mark read</button>}</article>; })}</div> : <EmptyState icon={Bell} title="You’re all caught up" text="New marketplace and learning activity will land here." />}</section>;
}

export function ReportsPage() {
  const { data, loading, error, reload } = useApi("/reports");
  const [form, setForm] = useState({ category: "spam", reported_user_id: "", description: "" });
  const [message, setMessage] = useState("");
  const change = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  const submit = async (event) => { event.preventDefault(); try { await api.post("/reports", { ...form, reported_user_id: form.reported_user_id || undefined }); setMessage("Safety report submitted."); setForm({ category: "spam", reported_user_id: "", description: "" }); reload(); } catch (requestError) { setMessage(getErrorMessage(requestError)); } };
  const columns = [{ key: "category", label: "Category" }, { key: "description", label: "Description" }, { key: "status", label: "Status", render: (value) => <span className={`status-badge status-${value}`}>{value}</span> }, { key: "admin_notes", label: "Admin response" }, { key: "created_at", label: "Submitted", render: (value) => new Date(value).toLocaleDateString() }];
  return <section className="safety-page"><PageHeader eyebrow="Safety desk" title="A safer marketplace starts with a clear report" description="Share suspicious or inappropriate activity privately. An administrator can review the context and respond." /><div className="safety-intro"><ShieldAlert size={21} /><div><strong>Reports are reviewed by an administrator</strong><p>Describe what happened without sharing passwords, payment PINs, or other sensitive credentials.</p></div></div><div className="dashboard-grid"><form className="panel" onSubmit={submit}><span className="panel-eyebrow">New case</span><h2>Submit a report</h2><Alert type={message.includes("submitted") ? "success" : "error"}>{message}</Alert><FormField name="category" label="Category" value={form.category} onChange={change} options={["fake_tutor", "fake_student", "payment_issue", "inappropriate_behavior", "fake_post", "spam", "review_abuse"]} /><FormField name="reported_user_id" label="Reported user ID (optional)" type="number" value={form.reported_user_id} onChange={change} /><FormField name="description" label="What happened?" as="textarea" value={form.description} onChange={change} required /><button className="button">Send report securely</button></form><article className="panel panel-wide"><div className="panel-heading"><div><span className="panel-eyebrow">Case history</span><h2>My reports</h2></div></div><Alert>{error}</Alert>{loading ? <LoadingSpinner /> : data.length ? <DataTable rows={data} columns={columns} /> : <EmptyState icon={ShieldAlert} title="No reports submitted" text="If something feels wrong, this is where you can raise it." />}</article></div></section>;
}
