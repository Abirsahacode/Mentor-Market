import { BookMarked, CalendarDays, FileCheck2, Search, Star, UsersRound } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api, { getErrorMessage } from "../api/axios.js";
import Alert from "../components/Alert.jsx";
import AccessibleDialog from "../components/AccessibleDialog.jsx";
import DataTable from "../components/DataTable.jsx";
import EmptyState from "../components/EmptyState.jsx";
import FormField from "../components/FormField.jsx";
import LiveClassAction from "../components/LiveClassAction.jsx";
import LoadingSpinner from "../components/LoadingSpinner.jsx";
import PageHeader from "../components/PageHeader.jsx";
import RequestCard from "../components/RequestCard.jsx";
import ResourcePage from "../components/ResourcePage.jsx";
import TutorCard from "../components/TutorCard.jsx";
import useApi from "../hooks/useApi.js";
import useAuth from "../hooks/useAuth.js";
import { isLiveClassUrl } from "../utils/liveClass.js";

const status = (value) => <span className={`status-badge status-${value}`}>{value}</span>;

export function MyListingsPage({ type }) {
  const { user } = useAuth();
  const isRequest = type === "request";
  const endpoint = isRequest ? `/student-requests?student_id=${user.id}&limit=100` : `/tutor-posts?tutor_id=${user.id}&status=&limit=100`;
  const columns = isRequest ? [
    { key: "subject", label: "Subject" }, { key: "class_level", label: "Level" }, { key: "budget", label: "Budget", render: (value) => `৳${value}` },
    { key: "teaching_mode", label: "Mode" }, { key: "status", label: "Status", render: status }, { key: "created_at", label: "Created", render: (value) => new Date(value).toLocaleDateString() },
  ] : [
    { key: "title", label: "Service" }, { key: "subject", label: "Subject" }, { key: "price", label: "Price", render: (value) => `৳${value}` },
    { key: "teaching_mode", label: "Mode" }, { key: "status", label: "Status", render: status },
  ];
  const actions = (row, reload) => <><button className="button button-tiny button-ghost" onClick={async () => { await api.patch(`${isRequest ? "/student-requests" : "/tutor-posts"}/${row.id}`, { status: isRequest ? "closed" : row.status === "active" ? "inactive" : "active" }); reload(); }}>{isRequest ? "Close" : row.status === "active" ? "Pause" : "Activate"}</button><button className="button button-tiny button-danger" onClick={async () => { if (window.confirm("Delete this item?")) { await api.delete(`${isRequest ? "/student-requests" : "/tutor-posts"}/${row.id}`); reload(); } }}>Delete</button></>;
  return <ResourcePage title={isRequest ? "My tutor requests" : "My service posts"} description={isRequest ? "Track responses and manage what you are currently looking for." : "Manage the teaching offers students can discover."} endpoint={endpoint} columns={columns} createPath={isRequest ? "/student/create-request" : "/tutor/create-service"} createLabel={isRequest ? "Post a request" : "Create service"} actions={actions} />;
}

export function DashboardTutorsPage() {
  const { data, loading, error } = useApi("/tutors?limit=100");
  const [saveStates, setSaveStates] = useState({});
  const save = async (id) => {
    setSaveStates((current) => ({ ...current, [id]: { status: "pending", message: "" } }));
    try {
      await api.post(`/students/saved-tutors/${id}`);
      setSaveStates((current) => ({ ...current, [id]: { status: "success", message: "Saved to your tutor shortlist." } }));
    } catch (requestError) {
      setSaveStates((current) => ({ ...current, [id]: { status: "error", message: getErrorMessage(requestError) } }));
    }
  };
  return <section className="dashboard-marketplace-page"><PageHeader eyebrow="Mentor directory" title="Browse tutors" description="Explore verified, experienced tutors and save the people whose teaching style feels right." actions={<Link className="button button-ghost" to="/tutors"><Search size={15} /> Advanced filters</Link>} /><Alert>{error}</Alert>{loading ? <LoadingSpinner /> : data.length ? <div className="card-grid">{data.map((tutor) => { const saveState = saveStates[tutor.user_id] || {}; return <TutorCard tutor={tutor} key={tutor.user_id} onSave={save} saveStatus={saveState.status} saveFeedback={saveState.message} />; })}</div> : <EmptyState icon={UsersRound} title="No mentors found" text="New mentor profiles will appear here as they join." />}</section>;
}

export function SavedTutorsPage() {
  const { data, setData, loading, error } = useApi("/students/saved-tutors");
  const [removeStates, setRemoveStates] = useState({});
  const [message, setMessage] = useState("");
  const remove = async (id) => {
    const tutorName = data.find((tutor) => tutor.user_id === id)?.full_name || "Tutor";
    setMessage("");
    setRemoveStates((current) => ({ ...current, [id]: { status: "pending", message: "" } }));
    try {
      await api.delete(`/students/saved-tutors/${id}`);
      setData((current) => current.filter((tutor) => tutor.user_id !== id));
      setMessage(`${tutorName} removed from your tutor shortlist.`);
      setRemoveStates((current) => {
        const next = { ...current };
        delete next[id];
        return next;
      });
    } catch (requestError) {
      setRemoveStates((current) => ({ ...current, [id]: { status: "error", message: getErrorMessage(requestError) } }));
    }
  };
  return <section className="dashboard-marketplace-page"><PageHeader eyebrow="Your shortlist" title="Saved tutors" description="A focused set of mentors to revisit, compare, and contact when you are ready." /><Alert type="success">{message}</Alert><Alert>{error}</Alert>{loading ? <LoadingSpinner /> : data.length ? <div className="card-grid">{data.map((tutor) => { const removeState = removeStates[tutor.user_id] || {}; return <TutorCard tutor={tutor} key={tutor.user_id} onSave={remove} saveAction="remove" saveStatus={removeState.status} saveFeedback={removeState.message} />; })}</div> : <EmptyState icon={BookMarked} title="No saved tutors" text="Save mentors from the directory to build your shortlist." />}</section>;
}

export function BrowseRequestsPage() {
  const { data, loading, error, reload } = useApi("/student-requests?status=open&limit=100");
  const [searchParams, setSearchParams] = useSearchParams();
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ proposal_message: "", expected_fee: "", available_time: "" });
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  useEffect(() => {
    const requestedId = Number(searchParams.get("request"));
    if (requestedId && !selected && data.length) {
      const request = data.find((item) => item.id === requestedId);
      if (request) setSelected(request);
    }
  }, [data, searchParams, selected]);
  const change = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  const apply = async (event) => {
    event.preventDefault(); setMessage(""); setSubmitting(true);
    try { await api.post("/applications", { ...form, student_request_id: selected.id }); setSelected(null); setSearchParams({}, { replace: true }); setForm({ proposal_message: "", expected_fee: "", available_time: "" }); setMessage("Proposal sent successfully."); reload(); }
    catch (requestError) { setMessage(getErrorMessage(requestError)); }
    finally { setSubmitting(false); }
  };
  const openProposal = (request) => { setSelected(request); setSearchParams({ request: String(request.id) }, { replace: true }); };
  const closeProposal = () => { setSelected(null); setSearchParams({}, { replace: true }); };
  const proposalTitleId = selected ? `proposal-title-${selected.id}` : undefined;
  return <section className="dashboard-marketplace-page"><PageHeader eyebrow="Open opportunities" title="Browse student requests" description="Find specific learning needs that match your subjects, style, and schedule." /><Alert type={message.includes("success") ? "success" : "error"}>{message}</Alert><Alert>{error}</Alert>{loading ? <LoadingSpinner /> : data.length ? <div className="card-grid">{data.map((request) => <RequestCard key={request.id} request={request} action={<button className="button button-small" onClick={() => openProposal(request)}>Send proposal</button>} />)}</div> : <EmptyState icon={Search} title="No open requests" text="New student learning needs will appear here." />}{selected && <AccessibleDialog as="form" onSubmit={apply} onClose={closeProposal} labelledBy={proposalTitleId}><button type="button" className="modal-close" onClick={closeProposal} aria-label="Close proposal dialog">×</button><span className="eyebrow">Apply to request</span><h2 id={proposalTitleId}>{selected.subject} · {selected.class_level}</h2><p className="modal-intro">Explain how you would approach this learner’s goal and be specific about time and price.</p><FormField name="proposal_message" label="Proposal message" as="textarea" value={form.proposal_message} onChange={change} required /><FormField name="expected_fee" label="Expected fee (৳)" type="number" value={form.expected_fee} onChange={change} required /><FormField name="available_time" label="Available time" value={form.available_time} onChange={change} required /><button className="button button-block" disabled={submitting} aria-busy={submitting || undefined}>{submitting ? "Sending proposal…" : "Submit proposal"}</button></AccessibleDialog>}</section>;
}

export function ApplicationsPage() {
  const { user } = useAuth();
  const { data, loading, error, reload } = useApi("/applications");
  const [decision, setDecision] = useState({ id: null, status: "", message: "", bookingId: null, tutorId: null, tutorName: "" });
  const decide = async (row, nextStatus) => {
    if (nextStatus === "rejected" && !window.confirm("Reject this proposal? The mentor will be notified.")) return;
    setDecision({ id: row.id, status: "pending", message: "", bookingId: null, tutorId: row.tutor_id, tutorName: row.tutor_name });
    try {
      const response = await api.patch(`/applications/${row.id}/status`, { status: nextStatus });
      const booking = response.data?.data?.booking;
      setDecision({
        id: row.id,
        status: "success",
        message: nextStatus === "accepted" ? "Proposal accepted. A class booking is ready to review." : "Proposal rejected.",
        bookingId: booking?.id || null,
        tutorId: row.tutor_id,
        tutorName: row.tutor_name,
      });
      await reload();
    } catch (requestError) {
      setDecision({ id: row.id, status: "error", message: getErrorMessage(requestError), bookingId: null, tutorId: row.tutor_id, tutorName: row.tutor_name });
    }
  };
  const columns = [
    { key: "subject", label: "Subject" }, { key: user.role === "student" ? "tutor_name" : "student_name", label: user.role === "student" ? "Tutor" : "Student" },
    { key: "proposal_message", label: "Proposal" }, { key: "expected_fee", label: "Fee", render: (value) => `৳${value}` }, { key: "available_time", label: "Available" }, { key: "status", label: "Status", render: status },
  ];
  const actions = user.role === "student" ? (row) => row.status === "pending" ? <><button className="button button-tiny" disabled={decision.status === "pending"} aria-busy={decision.id === row.id && decision.status === "pending" || undefined} onClick={() => decide(row, "accepted")}>{decision.id === row.id && decision.status === "pending" ? "Updating…" : "Accept"}</button><button className="button button-tiny button-danger" disabled={decision.status === "pending"} onClick={() => decide(row, "rejected")}>Reject</button></> : null : undefined;
  const decisionFeedback = decision.message ? <Alert type={decision.status === "success" ? "success" : "error"}>{decision.message}{decision.bookingId ? <span className="alert-actions"><Link to="/student/bookings">View class</Link><Link to={`/student/messages?recipient=${decision.tutorId}&name=${encodeURIComponent(decision.tutorName)}`}>Message mentor</Link></span> : null}</Alert> : null;
  return <section><PageHeader eyebrow="Proposal desk" title={user.role === "student" ? "Applications received" : "Applications sent"} description={user.role === "student" ? "Compare approaches, availability, and price before choosing the best fit." : "Track every proposal and see where each conversation stands."} />{decisionFeedback}<Alert>{error}</Alert>{loading ? <LoadingSpinner /> : data.length ? <DataTable label="Applications" rows={data} columns={columns} actions={actions} /> : <EmptyState icon={FileCheck2} title="No applications yet" text="Proposals will appear here as the marketplace responds." />}</section>;
}

export function BookingsPage() {
  const { user } = useAuth();
  const { data, loading, error, reload } = useApi("/bookings");
  const [bookingAction, setBookingAction] = useState({ id: null, status: "", message: "" });
  const update = async (id, nextStatus) => {
    if (nextStatus === "cancelled" && !window.confirm("Cancel this class? The other person will be notified.")) return;
    setBookingAction({ id, status: "pending", message: "" });
    try {
      await api.patch(`/bookings/${id}`, { status: nextStatus });
      setBookingAction({ id, status: "success", message: `Class ${nextStatus}.` });
      await reload();
    } catch (requestError) {
      setBookingAction({ id, status: "error", message: getErrorMessage(requestError) });
    }
  };
  const columns = [
    { key: user.role === "student" ? "tutor_name" : "student_name", label: user.role === "student" ? "Tutor" : "Student" },
    { key: "class_type", label: "Class type" }, { key: "class_date", label: "Date", render: (value) => new Date(value).toLocaleDateString() },
    { key: "class_time", label: "Time", render: (value) => value?.slice(0, 5) }, { key: "mode", label: "Mode" },
    {
      key: "meeting_link_or_location",
      label: "Session",
      render: (value, row) => {
        if (row.mode === "online" && isLiveClassUrl(value)) {
          return (
            <LiveClassAction
              href={value}
              variant="link"
              purpose="session"
              title={`${row.class_type} class · ${row.class_date}`}
            />
          );
        }
        return value || "—";
      },
    },
    { key: "status", label: "Status", render: status },
  ];
  const actions = (row) => {
    const pending = bookingAction.id === row.id && bookingAction.status === "pending";
    return (
      <>
        {user.role === "tutor" && row.status === "pending" && (
          <button className="button button-tiny" type="button" disabled={pending} aria-busy={pending || undefined} onClick={() => update(row.id, "confirmed")}>
            {pending ? "Updating…" : "Confirm"}
          </button>
        )}
        {user.role === "tutor" && row.status === "confirmed" && (
          <button className="button button-tiny" type="button" disabled={pending} aria-busy={pending || undefined} onClick={() => update(row.id, "completed")}>
            {pending ? "Updating…" : "Complete"}
          </button>
        )}
        {row.mode === "online" && isLiveClassUrl(row.meeting_link_or_location) && row.status === "confirmed" && (
          <LiveClassAction
            href={row.meeting_link_or_location}
            variant="button"
            purpose="join"
            title={`${row.class_type} class with ${user.role === "student" ? row.tutor_name : row.student_name}`}
          />
        )}
        {!["completed", "cancelled"].includes(row.status) && (
          <button className="button button-tiny button-danger" type="button" disabled={pending} onClick={() => update(row.id, "cancelled")}>
            Cancel
          </button>
        )}
      </>
    );
  };
  return <section><PageHeader eyebrow="Class calendar" title="My bookings" description="Manage upcoming classes, confirmations, and the sessions already completed." /><Alert type={bookingAction.status === "success" ? "success" : "error"}>{bookingAction.message}</Alert><Alert>{error}</Alert>{loading ? <LoadingSpinner /> : data.length ? <DataTable label="Bookings" rows={data} columns={columns} actions={actions} /> : <EmptyState icon={CalendarDays} title="No classes booked" text="Your class schedule will appear here after a booking is created." />}</section>;
}

export function ReviewsPage() {
  const { data, loading, error, reload } = useApi("/reviews");
  const { data: bookings } = useApi("/bookings?status=completed");
  const [form, setForm] = useState({ booking_id: "", rating: "5", comment: "" });
  const [message, setMessage] = useState("");
  const change = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  const submit = async (event) => { event.preventDefault(); try { await api.post("/reviews", form); setMessage("Review published."); reload(); } catch (requestError) { setMessage(getErrorMessage(requestError)); } };
  return <section className="reviews-page"><PageHeader eyebrow="Reputation" title="Reviews that help people choose" description="Share specific feedback after a completed class and see the learning experiences others have described." /><div className="dashboard-grid"><form className="panel" onSubmit={submit}><div className="panel-heading"><div><span className="panel-eyebrow">New review</span><h2>Share your experience</h2></div><Star size={20} /></div><Alert type={message.includes("published") ? "success" : "error"}>{message}</Alert><FormField name="booking_id" label="Completed booking" value={form.booking_id} onChange={change} options={(bookings || []).map((booking) => ({ value: booking.id, label: `#${booking.id} · ${booking.class_date}` }))} required /><FormField name="rating" label="Rating" value={form.rating} onChange={change} options={["5", "4", "3", "2", "1"]} /><FormField name="comment" label="Comment" as="textarea" value={form.comment} onChange={change} /><button className="button">Publish review</button></form><article className="panel panel-wide"><div className="panel-heading"><div><span className="panel-eyebrow">Community signal</span><h2>Received feedback</h2></div></div><Alert>{error}</Alert>{loading ? <LoadingSpinner /> : data.length ? data.map((review) => <blockquote key={review.id}><span>{"★".repeat(review.rating)}</span><p>{review.comment}</p><small>— {review.reviewer_name}</small></blockquote>) : <EmptyState icon={Star} title="No reviews yet" text="Feedback appears after completed classes." />}</article></div></section>;
}
