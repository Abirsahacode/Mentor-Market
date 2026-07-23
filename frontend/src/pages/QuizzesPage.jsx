import { Brain, CheckCircle2, CircleHelp, Plus, Sparkles, X } from "lucide-react";
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

const parse = (value) => {
  try {
    const questions = typeof value === "string" ? JSON.parse(value) : value;
    return Array.isArray(questions) ? questions : [];
  } catch {
    return [];
  }
};

function QuizAttempt({ quiz, close }) {
  const questions = parse(quiz.questions);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [attemptError, setAttemptError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const submit = async (event) => {
    event.preventDefault();
    setAttemptError("");
    setSubmitting(true);
    try {
      const response = await api.post(`/quizzes/${quiz.id}/attempt`, { answers: questions.map((_, index) => answers[index]) });
      setResult(response.data.data);
    } catch (requestError) {
      setAttemptError(getErrorMessage(requestError));
    } finally {
      setSubmitting(false);
    }
  };
  const titleId = `quiz-attempt-title-${quiz.id}`;
  return <AccessibleDialog as="form" className="quiz-modal" onSubmit={submit} onClose={close} labelledBy={titleId}><button type="button" className="modal-close" onClick={close} aria-label="Close quiz">×</button><span className="eyebrow">Knowledge check · {questions.length} question{questions.length === 1 ? "" : "s"}</span><h2 id={titleId}>{quiz.title}</h2><Alert>{attemptError}</Alert>{result ? <div className="quiz-result"><span><CheckCircle2 size={22} /></span><strong>{result.score}%</strong><p>You earned {result.earned} out of {result.total} points.</p><button type="button" className="button button-ghost" onClick={close}>Return to quizzes</button></div> : questions.length ? <>{questions.map((question, index) => <fieldset className="quiz-question" key={`${question.prompt || "Question"}-${index}`}><legend><span>{String(index + 1).padStart(2, "0")}</span>{question.prompt || `Question ${index + 1}`}</legend>{(Array.isArray(question.options) ? question.options : []).map((option, optionIndex) => <label key={`${option}-${optionIndex}`}><input required type="radio" name={`q-${index}`} value={optionIndex} onChange={() => setAnswers((current) => ({ ...current, [index]: optionIndex }))} /><span>{option}</span></label>)}</fieldset>)}<button className="button button-block" disabled={submitting}>{submitting ? "Checking answers…" : "Submit answers"}</button></> : <div className="quiz-result quiz-result-empty"><CircleHelp size={26} /><strong>This quiz needs attention</strong><p>Its question data could not be read. Ask the tutor to republish it.</p><button type="button" className="button button-ghost" onClick={close}>Return to quizzes</button></div>}</AccessibleDialog>;
}

export default function QuizzesPage() {
  const { user } = useAuth();
  const { data, loading, error, reload } = useApi("/quizzes");
  const [selected, setSelected] = useState(null);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ title: "", subject: "", prompt: "", options: ["", ""], correctAnswer: 0 });
  const change = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  const changeOption = (index, value) => setForm((current) => ({ ...current, options: current.options.map((option, optionIndex) => optionIndex === index ? value : option) }));
  const addOption = () => setForm((current) => current.options.length >= 6 ? current : ({ ...current, options: [...current.options, ""] }));
  const removeOption = (index) => setForm((current) => ({
    ...current,
    options: current.options.filter((_, optionIndex) => optionIndex !== index),
    correctAnswer: current.correctAnswer === index ? 0 : current.correctAnswer > index ? current.correctAnswer - 1 : current.correctAnswer,
  }));
  const create = async (event) => {
    event.preventDefault(); setSubmitting(true); setMessage("");
    try {
      await api.post("/quizzes", { title: form.title, subject: form.subject, questions: [{ prompt: form.prompt, options: form.options.map((item) => item.trim()), correctAnswer: form.correctAnswer, points: 10 }] });
      setMessage("Quiz created.");
      setForm({ title: "", subject: "", prompt: "", options: ["", ""], correctAnswer: 0 });
      await reload();
    } catch (requestError) { setMessage(getErrorMessage(requestError)); }
    finally { setSubmitting(false); }
  };
  const columns = [{ key: "title", label: "Quiz" }, { key: "subject", label: "Subject" }, { key: "total_score", label: "Points" }, { key: "created_at", label: "Created", render: (value) => new Date(value).toLocaleDateString() }];
  return <section className="quizzes-page"><PageHeader eyebrow="Practice room" title="Quizzes" description={user.role === "student" ? "Check your understanding and get an instant score without the pressure." : "Create quick knowledge checks that show what students understand."} /><Alert type={message.includes("created") ? "success" : "error"}>{message}</Alert>{user.role === "tutor" && <form className="panel inline-create-form" onSubmit={create}><div className="panel-heading"><div><span className="panel-eyebrow">Quick builder</span><h2>Create a knowledge check</h2></div><Brain size={21} /></div><div className="form-grid"><FormField name="title" label="Quiz title" value={form.title} onChange={change} required /><FormField name="subject" label="Subject" value={form.subject} onChange={change} required /><FormField name="prompt" label="Question" value={form.prompt} onChange={change} required /></div><fieldset className="quiz-option-builder"><legend>Answer options <span>Choose the correct answer</span></legend>{form.options.map((option, index) => <div className="quiz-option-row" key={index}><label className="quiz-option-correct"><input type="radio" name="correctAnswer" value={index} checked={form.correctAnswer === index} onChange={() => setForm((current) => ({ ...current, correctAnswer: index }))} /><span className="sr-only">Mark option {index + 1} correct</span></label><label><span>Option {index + 1}</span><input name={`option-${index}`} value={option} onChange={(event) => changeOption(index, event.target.value)} required placeholder={`Answer option ${index + 1}`} /></label>{form.options.length > 2 ? <button className="quiz-option-remove" type="button" onClick={() => removeOption(index)} aria-label={`Remove option ${index + 1}`}><X size={17} /></button> : null}</div>)}<button className="quiz-option-add" type="button" onClick={addOption} disabled={form.options.length >= 6}><Plus size={16} /> Add another option</button></fieldset><div className="quiz-builder-note"><Sparkles size={16} /><span>This focused builder creates one-question quizzes with up to six answer options.</span></div><button className="button" disabled={submitting} aria-busy={submitting || undefined}>{submitting ? "Creating quiz…" : "Create quiz"}</button></form>}<Alert>{error}</Alert>{loading ? <LoadingSpinner /> : data.length ? <DataTable label="Quizzes" rows={data} columns={columns} actions={user.role === "student" ? (row) => <button className="button button-tiny" onClick={() => setSelected(row)}><CircleHelp size={13} /> Attempt</button> : null} /> : <EmptyState icon={Brain} title="No quizzes yet" text={user.role === "student" ? "Knowledge checks from your mentors will appear here." : "Create a quick check for a student."} />}{selected && <QuizAttempt quiz={selected} close={() => setSelected(null)} />}</section>;
}
