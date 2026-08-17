import { ClipboardCheck, GraduationCap, Upload } from "lucide-react";
import { useState } from "react";
import api, { getErrorMessage } from "../api/axios.js";
import Alert from "../components/Alert.jsx";
import AccessibleDialog from "../components/AccessibleDialog.jsx";
import DataTable from "../components/DataTable.jsx";
import EmptyState from "../components/EmptyState.jsx";
import FormField from "../components/FormField.jsx";
import LoadingSpinner from "../components/LoadingSpinner.jsx";
import PageHeader from "../components/PageHeader.jsx";
import useApi from "../hooks/useApi.js";
import useAuth from "../hooks/useAuth.js";

export default function AssignmentsPage() {
  const { user } = useAuth();
  const { data, loading, error, reload } = useApi("/assignments");
  const { data: bookings, error: bookingsError } = useApi("/bookings");
  const [message, setMessage] = useState("");
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", deadline: "", student_id: "" });
  const [dialog, setDialog] = useState(null);
  const [actionForm, setActionForm] = useState({ submission_text: "", marks: "", feedback: "" });
  const change = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  const changeAction = (event) => setActionForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  const closeDialog = () => { setDialog(null); setActionForm({ submission_text: "", marks: "", feedback: "" }); };
  const openDialog = (type, row) => { setActionForm({ submission_text: "", marks: "", feedback: "" }); setDialog({ type, row }); };
  const create = async (event) => {
    event.preventDefault(); setCreating(true); setMessage("");
    try {
      await api.post("/assignments", form);
      setMessage("Assignment created.");
      setForm({ title: "", description: "", deadline: "", student_id: "" });
      await reload();
    } catch (requestError) { setMessage(getErrorMessage(requestError)); }
    finally { setCreating(false); }
  };
  const completeAction = async (event) => { event.preventDefault(); try { if (dialog.type === "submit") await api.patch(`/assignments/${dialog.row.id}/submit`, { submission_text: actionForm.submission_text }); else await api.patch(`/assignments/${dialog.row.id}/grade`, { marks: actionForm.marks, feedback: actionForm.feedback }); setMessage(dialog.type === "submit" ? "Assignment submitted." : "Assignment graded."); closeDialog(); reload(); } catch (requestError) { setMessage(getErrorMessage(requestError)); } };
  const columns = [{ key: "title", label: "Assignment" }, { key: "deadline", label: "Deadline", render: (value) => new Date(value).toLocaleString() }, { key: "status", label: "Status", render: (value) => <span className={`status-badge status-${value}`}>{value}</span> }, { key: "marks", label: "Marks" }, { key: "feedback", label: "Feedback" }];
  const actions = (row) => user.role === "student" && row.status === "pending" ? <button className="button button-tiny" onClick={() => openDialog("submit", row)}><Upload size={13} /> Submit</button> : user.role === "tutor" && row.status === "submitted" ? <button className="button button-tiny" onClick={() => openDialog("grade", row)}><GraduationCap size={13} /> Grade</button> : null;
  const dialogTitleId = dialog ? `assignment-action-title-${dialog.row.id}` : undefined;
  const studentOptions = [...new Map((bookings || []).filter((booking) => booking.student_id && booking.student_name).map((booking) => [booking.student_id, { value: booking.student_id, label: booking.student_name }])).values()];
  return <section className="assignments-page"><PageHeader eyebrow="Learning workbench" title="Assignments" description={user.role === "student" ? "Submit work, review feedback, and stay ahead of deadlines." : "Create focused tasks and give students useful feedback."} /><Alert type={/(created|submitted|graded)/.test(message) ? "success" : "error"}>{message}</Alert>{user.role === "tutor" && <form className="panel inline-create-form" onSubmit={create}><div className="panel-heading"><div><span className="panel-eyebrow">New brief</span><h2>Create assignment</h2></div><ClipboardCheck size={20} /></div><div className="form-grid"><FormField name="title" label="Title" value={form.title} onChange={change} required /><FormField name="student_id" label="Student" options={studentOptions} value={form.student_id} onChange={change} required /><FormField name="deadline" label="Deadline" type="datetime-local" value={form.deadline} onChange={change} required /><FormField name="description" label="Instructions" as="textarea" value={form.description} onChange={change} required /></div>{!studentOptions.length && !bookingsError ? <p className="form-context-note">Students appear here after a class connection is created.</p> : null}<button className="button" disabled={creating || !studentOptions.length} aria-busy={creating || undefined}>{creating ? "Assigning work…" : "Assign work"}</button></form>}<Alert>{error || (user.role === "tutor" ? bookingsError : "")}</Alert>{loading ? <LoadingSpinner /> : data.length ? <DataTable label="Assignments" rows={data} columns={columns} actions={actions} /> : <EmptyState icon={ClipboardCheck} title="No assignments yet" text={user.role === "student" ? "New work from your mentors will appear here." : "Create the first assignment for a student."} />}{dialog && <AccessibleDialog as="form" className="assignment-action-modal" onSubmit={completeAction} onClose={closeDialog} labelledBy={dialogTitleId}><button type="button" className="modal-close" onClick={closeDialog} aria-label="Close assignment dialog">×</button><span className="eyebrow">{dialog.type === "submit" ? "Student submission" : "Tutor feedback"}</span><h2 id={dialogTitleId}>{dialog.row.title}</h2><p>{dialog.type === "submit" ? "Share your work clearly. Include links in the text if your submission lives elsewhere." : "Give a fair score and feedback the student can act on next."}</p>{dialog.type === "submit" ? <FormField name="submission_text" label="Submission" as="textarea" value={actionForm.submission_text} onChange={changeAction} required /> : <><FormField name="marks" label="Marks (0–100)" type="number" min="0" max="100" value={actionForm.marks} onChange={changeAction} required /><FormField name="feedback" label="Feedback" as="textarea" value={actionForm.feedback} onChange={changeAction} required /></>}<button className="button button-block">{dialog.type === "submit" ? "Submit assignment" : "Publish grade"}</button></AccessibleDialog>}</section>;
}
