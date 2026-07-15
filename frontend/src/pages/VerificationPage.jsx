import { BadgeCheck, Clock3, ShieldCheck, Video } from "lucide-react";
import { useEffect, useState } from "react";
import api, { getErrorMessage } from "../api/axios.js";
import Alert from "../components/Alert.jsx";
import FormField from "../components/FormField.jsx";
import LoadingSpinner from "../components/LoadingSpinner.jsx";
import PageHeader from "../components/PageHeader.jsx";
import useApi from "../hooks/useApi.js";

export default function VerificationPage() {
  const { data, loading, error, reload } = useApi("/verifications/mine", null);
  const [form, setForm] = useState({ certificate_name: "", institution: "", experience_proof: "", demo_video_url: "" });
  const [message, setMessage] = useState("");
  useEffect(() => { if (data) setForm(data); }, [data]);
  const change = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  const submit = async (event) => { event.preventDefault(); try { await api.put("/verifications/mine", form); setMessage("Verification submitted for review."); reload(); } catch (requestError) { setMessage(getErrorMessage(requestError)); } };
  if (loading) return <LoadingSpinner />;
  const status = data?.status || "not_submitted";
  const statusTitle = status === "verified" ? "Verified Mentor" : status === "pending" ? "Review in progress" : status === "rejected" ? "Changes requested" : "Build your trust signal";
  return <section className="verification-page"><PageHeader eyebrow="Trust centre" title="Credentials, clearly presented" description="Verification combines professional context with a short teaching preview so students can make a safer, more confident choice." /><div className="verification-grid"><article className={`panel verification-status verification-status-${status}`}><span className={`verification-seal status-${status}`}>{status === "verified" ? <BadgeCheck size={38} /> : status === "pending" ? <Clock3 size={34} /> : <ShieldCheck size={36} />}</span><span className="panel-eyebrow">Current standing</span><h2>{statusTitle}</h2><p>{data?.admin_feedback || "Complete the form with truthful, reviewable information. An administrator will review it before a badge appears."}</p><span className={`status-badge status-${status}`}>{status.replace("_", " ")}</span><div className="verification-promise"><ShieldCheck size={17} /><span><strong>Human-reviewed</strong><small>Your badge is never issued automatically.</small></span></div></article><form className="panel verification-form" onSubmit={submit}><div className="verification-form-heading"><span className="panel-eyebrow">Submission</span><h2>Professional evidence</h2><p>Use direct, specific information. Links are placeholders for file uploads in this university project.</p></div><Alert>{error}</Alert><Alert type={message.includes("submitted") ? "success" : "error"}>{message}</Alert><FormField name="certificate_name" label="Certificate / degree" value={form.certificate_name} onChange={change} required /><FormField name="institution" label="Issuing institution" value={form.institution} onChange={change} required /><FormField name="experience_proof" label="Experience proof or link" as="textarea" value={form.experience_proof} onChange={change} required /><FormField name="demo_video_url" label="Demo video URL" type="url" value={form.demo_video_url} onChange={change} />{form.demo_video_url && <div className="verification-video-note"><Video size={17} /><span><strong>Teaching preview attached</strong><small>This link will be included in the administrator review.</small></span></div>}<div className="form-actions"><button className="button">Submit for review</button></div></form></div></section>;
}
