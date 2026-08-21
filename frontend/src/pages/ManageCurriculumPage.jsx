import { ArrowLeft, ChevronDown, ChevronUp, GripVertical, Plus, Sparkles, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api, { getErrorMessage } from "../api/axios.js";
import Alert from "../components/Alert.jsx";
import EmptyState from "../components/EmptyState.jsx";
import FormField from "../components/FormField.jsx";
import LoadingSpinner from "../components/LoadingSpinner.jsx";
import PageHeader from "../components/PageHeader.jsx";

const parseItems = (value) => {
  let items = value;
  if (typeof items === "string") { try { items = JSON.parse(items); } catch { items = []; } }
  return Array.isArray(items) ? items : [];
};

const emptyDraft = { title: "", description: "", itemsText: "" };

function ModuleForm({ draft, onChange, onSubmit, onCancel, submitting, submitLabel }) {
  return (
    <form className="panel curriculum-editor-form" onSubmit={onSubmit}>
      <FormField name="title" label="Module title" value={draft.title} onChange={onChange} required />
      <FormField name="description" label="Short description" value={draft.description} onChange={onChange} />
      <FormField
        name="itemsText"
        label="Lessons (one per line)"
        as="textarea"
        rows={4}
        value={draft.itemsText}
        onChange={onChange}
        hint="Each line becomes a lesson students can expand inside the module."
      />
      <div className="form-actions">
        {onCancel && <button type="button" className="button button-ghost" onClick={onCancel}>Cancel</button>}
        <button className="button" disabled={submitting}>{submitting ? "Saving…" : submitLabel}</button>
      </div>
    </form>
  );
}

export default function ManageCurriculumPage() {
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [draft, setDraft] = useState(emptyDraft);
  const [editingId, setEditingId] = useState(null);
  const [editDraft, setEditDraft] = useState(emptyDraft);
  const [submitting, setSubmitting] = useState(false);
  const [pendingAction, setPendingAction] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get(`/tutor-posts/${id}`);
      setCourse(response.data.data);
      setModules(response.data.data.modules || []);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const changeDraft = (event) => setDraft((current) => ({ ...current, [event.target.name]: event.target.value }));
  const changeEditDraft = (event) => setEditDraft((current) => ({ ...current, [event.target.name]: event.target.value }));

  const addModule = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setFeedback("");
    try {
      const items = draft.itemsText.split("\n").map((line) => line.trim()).filter(Boolean);
      await api.post(`/tutor-posts/${id}/modules`, { title: draft.title, description: draft.description, items });
      setDraft(emptyDraft);
      setFeedback("Module added to the learning path.");
      await load();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (module) => {
    setEditingId(module.id);
    setEditDraft({ title: module.title, description: module.description || "", itemsText: parseItems(module.items).join("\n") });
  };

  const saveEdit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setFeedback("");
    try {
      const items = editDraft.itemsText.split("\n").map((line) => line.trim()).filter(Boolean);
      await api.patch(`/tutor-posts/${id}/modules/${editingId}`, { title: editDraft.title, description: editDraft.description, items });
      setEditingId(null);
      setFeedback("Module updated.");
      await load();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setSubmitting(false);
    }
  };

  const removeModule = async (module) => {
    if (!window.confirm(`Remove "${module.title}" from the learning path?`)) return;
    setPendingAction(`delete-${module.id}`);
    try {
      await api.delete(`/tutor-posts/${id}/modules/${module.id}`);
      setFeedback("Module removed.");
      await load();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setPendingAction("");
    }
  };

  const move = async (index, direction) => {
    const target = index + direction;
    if (target < 0 || target >= modules.length) return;
    const current = modules[index];
    const swapWith = modules[target];
    setPendingAction(`move-${current.id}`);
    try {
      await Promise.all([
        api.patch(`/tutor-posts/${id}/modules/${current.id}`, { position: swapWith.position }),
        api.patch(`/tutor-posts/${id}/modules/${swapWith.id}`, { position: current.position }),
      ]);
      await load();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setPendingAction("");
    }
  };

  if (loading) return <div className="cx-state"><LoadingSpinner label="Loading learning path" /></div>;

  return (
    <section className="curriculum-editor-page">
      <PageHeader
        eyebrow="Creator studio"
        title={course ? `Learning path · ${course.title}` : "Learning path"}
        description="Break this course into modules students can preview before booking. Leave it empty to use a generic subject outline instead."
        actions={<Link className="button button-ghost" to="/tutor/services"><ArrowLeft size={15} /> Back to my courses</Link>}
      />
      <Alert type="success">{feedback}</Alert>
      <Alert>{error}</Alert>

      {modules.length ? (
        <div className="curriculum-module-list">
          {modules.map((module, index) => (
            <article className="panel curriculum-module-card" key={module.id}>
              {editingId === module.id ? (
                <ModuleForm draft={editDraft} onChange={changeEditDraft} onSubmit={saveEdit} onCancel={() => setEditingId(null)} submitting={submitting} submitLabel="Save module" />
              ) : (
                <>
                  <div className="curriculum-module-head">
                    <GripVertical size={16} aria-hidden="true" />
                    <div><small>Module {index + 1}</small><strong>{module.title}</strong>{module.description && <p>{module.description}</p>}</div>
                  </div>
                  <ul className="curriculum-module-items">
                    {parseItems(module.items).map((item) => <li key={item}>{item}</li>)}
                  </ul>
                  <div className="curriculum-module-actions">
                    <button type="button" className="button button-tiny button-ghost" disabled={index === 0 || Boolean(pendingAction)} onClick={() => move(index, -1)}><ChevronUp size={14} /></button>
                    <button type="button" className="button button-tiny button-ghost" disabled={index === modules.length - 1 || Boolean(pendingAction)} onClick={() => move(index, 1)}><ChevronDown size={14} /></button>
                    <button type="button" className="button button-tiny button-ghost" onClick={() => startEdit(module)}>Edit</button>
                    <button type="button" className="button button-tiny button-danger" disabled={pendingAction === `delete-${module.id}`} onClick={() => removeModule(module)}><Trash2 size={13} /> Remove</button>
                  </div>
                </>
              )}
            </article>
          ))}
        </div>
      ) : (
        <EmptyState icon={Sparkles} title="No modules yet" description="Add your first module below. Until you do, students see a generic subject-based outline instead." />
      )}

      <article className="panel curriculum-add-panel">
        <div className="panel-heading"><div><span className="panel-eyebrow">Add module</span><h2><Plus size={16} /> New learning path module</h2></div></div>
        <ModuleForm draft={draft} onChange={changeDraft} onSubmit={addModule} submitting={submitting} submitLabel="Add module" />
      </article>
    </section>
  );
}
