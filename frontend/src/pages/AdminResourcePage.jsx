import {
  BadgeCheck, BookOpenCheck, CalendarDays, ClipboardList, CreditCard,
  History, Mail, ShieldCheck, Star, UsersRound,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api, { getErrorMessage } from "../api/axios.js";
import AccessibleDialog from "../components/AccessibleDialog.jsx";
import FormField from "../components/FormField.jsx";
import ResourcePage from "../components/ResourcePage.jsx";

const status = (value) => <span className={`status-badge status-${value}`}>{String(value).replaceAll("_", " ")}</span>;
const accountStatus = (value) => {
  const isActive = value === true || value === 1 || value === "1";
  return <span className={`status-badge status-${isActive}`}>{isActive ? "Active" : "Suspended"}</span>;
};

function MutationButton({ actionKey, pendingAction, className = "", label, pendingLabel, onClick }) {
  const isPending = pendingAction === actionKey;
  return (
    <button
      type="button"
      className={`button button-tiny ${className}`.trim()}
      disabled={Boolean(pendingAction)}
      aria-busy={isPending || undefined}
      onClick={onClick}
    >
      {isPending ? pendingLabel : label}
    </button>
  );
}

function ReasonDialog({ title, description, statusOptions, defaultStatus, submitLabel = "Submit", pending, onSubmit, onClose }) {
  const [reason, setReason] = useState("");
  const [decisionStatus, setDecisionStatus] = useState(defaultStatus || "");
  const titleId = "moderation-reason-title";
  return (
    <AccessibleDialog
      as="form"
      onClose={onClose}
      labelledBy={titleId}
      onSubmit={(event) => { event.preventDefault(); onSubmit({ reason, status: decisionStatus }); }}
    >
      <button type="button" className="modal-close" onClick={onClose} aria-label="Close dialog">×</button>
      <span className="eyebrow">Moderation note</span>
      <h2 id={titleId}>{title}</h2>
      {description && <p className="modal-intro">{description}</p>}
      {statusOptions && (
        <FormField
          name="status"
          label="Outcome"
          value={decisionStatus}
          onChange={(event) => setDecisionStatus(event.target.value)}
          options={statusOptions}
          required
        />
      )}
      <FormField
        name="reason"
        label="Reason (shared with the affected person)"
        as="textarea"
        value={reason}
        onChange={(event) => setReason(event.target.value)}
        placeholder="Explain the decision so they understand what to do next."
      />
      <button className="button button-block" disabled={pending} aria-busy={pending || undefined}>
        {pending ? "Submitting…" : submitLabel}
      </button>
    </AccessibleDialog>
  );
}

const configs = {
  users: { title: "Manage users", endpoint: "/admin/users", paginated: true, columns: [{ key: "full_name", label: "Name" }, { key: "email", label: "Email" }, { key: "role", label: "Role" }, { key: "is_active", label: "Active", render: accountStatus }, { key: "created_at", label: "Joined", render: (v) => new Date(v).toLocaleDateString() }] },
  students: { title: "Manage students", endpoint: "/admin/users?role=student", paginated: true, columns: [{ key: "full_name", label: "Student" }, { key: "email", label: "Email" }, { key: "phone", label: "Phone" }, { key: "is_active", label: "Active", render: accountStatus }] },
  tutors: { title: "Manage tutors", endpoint: "/admin/users?role=tutor", paginated: true, columns: [{ key: "full_name", label: "Tutor" }, { key: "email", label: "Email" }, { key: "phone", label: "Phone" }, { key: "is_active", label: "Active", render: accountStatus }] },
  "tutor-posts": { title: "Manage tutor posts", endpoint: "/admin/tutor_posts", resource: "tutor-posts", paginated: true, columns: [{ key: "title", label: "Title" }, { key: "subject", label: "Subject" }, { key: "tutor_id", label: "Tutor ID" }, { key: "price", label: "Price" }, { key: "status", label: "Status", render: status }] },
  "student-requests": { title: "Manage student requests", endpoint: "/admin/student_requests", resource: "student-requests", paginated: true, columns: [{ key: "subject", label: "Subject" }, { key: "class_level", label: "Level" }, { key: "student_id", label: "Student ID" }, { key: "budget", label: "Budget" }, { key: "status", label: "Status", render: status }] },
  applications: { title: "Manage applications", endpoint: "/admin/applications", paginated: true, columns: [{ key: "student_request_id", label: "Request ID" }, { key: "tutor_id", label: "Tutor ID" }, { key: "expected_fee", label: "Fee" }, { key: "available_time", label: "Available" }, { key: "status", label: "Status", render: status }] },
  bookings: { title: "Manage bookings", endpoint: "/admin/bookings", paginated: true, columns: [{ key: "student_id", label: "Student ID" }, { key: "tutor_id", label: "Tutor ID" }, { key: "class_date", label: "Date" }, { key: "mode", label: "Mode" }, { key: "status", label: "Status", render: status }] },
  payments: { title: "Manage payments", endpoint: "/admin/payments", paginated: true, columns: [{ key: "booking_id", label: "Booking" }, { key: "amount", label: "Amount" }, { key: "commission", label: "Commission" }, { key: "payment_method", label: "Method" }, { key: "status", label: "Status", render: status }] },
  reviews: { title: "Manage reviews", endpoint: "/admin/reviews", paginated: true, columns: [{ key: "reviewer_id", label: "Reviewer" }, { key: "receiver_id", label: "Receiver" }, { key: "rating", label: "Rating" }, { key: "comment", label: "Comment" }, { key: "created_at", label: "Created" }] },
  verifications: {
    title: "Verification requests",
    endpoint: "/verifications",
    statusOptions: [{ value: "", label: "All statuses" }, { value: "pending", label: "Pending" }, { value: "verified", label: "Verified" }, { value: "rejected", label: "Rejected" }],
    defaultStatusFilter: "pending",
    columns: [
      { key: "tutor_name", label: "Mentor" },
      { key: "certificate_name", label: "Certificate" },
      { key: "institution", label: "Institution" },
      { key: "experience_proof", label: "Experience proof", render: (value) => <span title={value}>{value || "—"}</span> },
      {
        key: "demo_video_url",
        label: "Demo",
        render: (value) => value
          ? <a href={value} target="_blank" rel="noreferrer">Review video</a>
          : "—",
      },
      { key: "status", label: "Status", render: status },
    ],
  },
  reports: {
    title: "Reports and safety",
    endpoint: "/admin/reports",
    paginated: true,
    statusOptions: [{ value: "", label: "All statuses" }, { value: "open", label: "Open" }, { value: "investigating", label: "Investigating" }, { value: "resolved", label: "Resolved" }, { value: "dismissed", label: "Dismissed" }],
    defaultStatusFilter: "",
    columns: [{ key: "reporter_id", label: "Reporter" }, { key: "reported_user_id", label: "Reported user" }, { key: "category", label: "Category" }, { key: "description", label: "Description" }, { key: "status", label: "Status", render: status }],
  },
  "moderation-logs": {
    title: "Moderation activity log",
    endpoint: "/admin/moderation-logs",
    paginated: true,
    readOnly: true,
    columns: [
      { key: "created_at", label: "When", render: (v) => new Date(v).toLocaleString() },
      { key: "admin_name", label: "Admin" },
      { key: "action", label: "Action", render: (v) => String(v).replaceAll("_", " ") },
      { key: "target_type", label: "Target type" },
      { key: "target_id", label: "Target ID" },
      { key: "reason", label: "Reason", render: (v) => v || "—" },
    ],
  },
  "contact-messages": {
    title: "Contact messages",
    endpoint: "/admin/contact_messages",
    resource: "contact-messages",
    paginated: true,
    columns: [
      { key: "name", label: "Name" },
      { key: "email", label: "Email" },
      { key: "subject", label: "Subject", render: (v) => v || "—" },
      { key: "message", label: "Message" },
      { key: "status", label: "Status", render: status },
      { key: "created_at", label: "Received", render: (v) => new Date(v).toLocaleDateString() },
    ],
  },
};

const descriptions = {
  users: "Search every account, review roles, and control access without leaving the operations desk.",
  students: "Review student accounts and step in when access or safety needs attention.",
  tutors: "Monitor mentor accounts, trust status, and marketplace access.",
  "tutor-posts": "Keep teaching offers accurate, active, and aligned with marketplace standards.",
  "student-requests": "Review active learning needs and remove misleading or unsafe requests.",
  applications: "Follow proposal activity and intervene in unresolved marketplace cases.",
  bookings: "Audit the class schedule across pending, confirmed, and completed sessions.",
  payments: "Inspect mock transaction records, commissions, and payment status.",
  reviews: "Protect useful feedback by removing abusive or misleading reviews.",
  verifications: "Review professional evidence before awarding a Verified Mentor badge.",
  reports: "Resolve safety cases with a clear record of every administrative decision.",
  "moderation-logs": "A read-only record of every suspension, verification decision, and report resolution.",
  "contact-messages": "Follow up on questions and safety concerns submitted through the public contact form.",
};

const emptyStates = {
  users: {
    icon: UsersRound,
    title: "No user accounts",
    description: "Accounts will appear here after someone registers for Mentor Market.",
  },
  students: {
    icon: UsersRound,
    title: "No student accounts",
    description: "Student accounts will appear here after registration.",
    actionPath: "/admin/users",
    actionLabel: "View all users",
  },
  tutors: {
    icon: UsersRound,
    title: "No tutor accounts",
    description: "Tutor accounts will appear here after registration.",
    actionPath: "/admin/users",
    actionLabel: "View all users",
  },
  "tutor-posts": {
    icon: BookOpenCheck,
    title: "No tutor posts",
    description: "Published mentor courses will appear here for marketplace review.",
    actionPath: "/admin/tutors",
    actionLabel: "Review tutors",
  },
  "student-requests": {
    icon: ClipboardList,
    title: "No student requests",
    description: "Learning briefs will appear here as students publish them.",
    actionPath: "/admin/students",
    actionLabel: "Review students",
  },
  applications: {
    icon: ClipboardList,
    title: "No applications",
    description: "Tutor proposals will appear here as mentors respond to learning briefs.",
    actionPath: "/admin/student-requests",
    actionLabel: "Review student requests",
  },
  bookings: {
    icon: CalendarDays,
    title: "No bookings",
    description: "Accepted proposals and direct class requests will appear here.",
    actionPath: "/admin/applications",
    actionLabel: "Review applications",
  },
  payments: {
    icon: CreditCard,
    title: "No payment records",
    description: "Payments will appear here after an eligible class booking.",
    actionPath: "/admin/bookings",
    actionLabel: "Review bookings",
  },
  reviews: {
    icon: Star,
    title: "No reviews",
    description: "Student and tutor feedback will appear after completed classes.",
    actionPath: "/admin/bookings",
    actionLabel: "Review bookings",
  },
  verifications: {
    icon: BadgeCheck,
    title: "Verification queue is clear",
    description: "No mentor credentials need review right now.",
    actionPath: "/admin/tutors",
    actionLabel: "View tutors",
  },
  reports: {
    icon: ShieldCheck,
    title: "Safety queue is clear",
    description: "No marketplace reports need review right now.",
  },
  "moderation-logs": {
    icon: History,
    title: "No moderation activity yet",
    description: "Suspensions, verification decisions, and report resolutions will be recorded here.",
  },
  "contact-messages": {
    icon: Mail,
    title: "No contact messages",
    description: "Messages submitted through the public contact form will appear here.",
  },
};

export default function AdminResourcePage({ type }) {
  const config = configs[type];
  const emptyState = emptyStates[type];
  const [pendingAction, setPendingAction] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [statusFilter, setStatusFilter] = useState(config.defaultStatusFilter ?? "");
  const [reasonPrompt, setReasonPrompt] = useState(null);

  useEffect(() => {
    setPendingAction("");
    setFeedback(null);
    setStatusFilter(config.defaultStatusFilter ?? "");
    setReasonPrompt(null);
  }, [type]);

  const run = async ({
    actionKey,
    url,
    method = "patch",
    body,
    confirmation,
    successMessage,
  }, reload) => {
    if (pendingAction) return;
    if (confirmation && !window.confirm(confirmation)) return;

    setPendingAction(actionKey);
    setFeedback(null);
    try {
      await api[method](url, body);
      await reload();
      setFeedback({ type: "success", message: successMessage });
    } catch (requestError) {
      setFeedback({ type: "error", message: getErrorMessage(requestError) });
    } finally {
      setPendingAction("");
    }
  };

  const actions = (row, reload) => {
    const recordName = row.full_name || row.tutor_name || row.title || row.subject || `record #${row.id}`;

    if (["users", "students", "tutors"].includes(type)) {
      const isActive = row.is_active === true || row.is_active === 1 || row.is_active === "1";
      const actionKey = `${isActive ? "suspend" : "activate"}-user-${row.id}`;
      return (
        <MutationButton
          actionKey={actionKey}
          pendingAction={pendingAction}
          className={isActive ? "button-danger" : ""}
          label={isActive ? "Suspend" : "Activate"}
          pendingLabel={isActive ? "Suspending…" : "Activating…"}
          onClick={() => run({
            actionKey,
            url: `/admin/users/${row.id}/status`,
            body: { is_active: !isActive },
            confirmation: isActive ? `Suspend ${recordName}? They will immediately lose access to their workspace.` : undefined,
            successMessage: `${recordName} was ${isActive ? "suspended" : "activated"}.`,
          }, reload)}
        />
      );
    }

    if (type === "verifications") {
      const verifyKey = `verify-${row.id}`;
      const rejectKey = `reject-verification-${row.id}`;
      return (
        <>
          <MutationButton
            actionKey={verifyKey}
            pendingAction={pendingAction}
            label="Verify"
            pendingLabel="Verifying…"
            onClick={() => setReasonPrompt({ kind: "verify", row, reload, recordName })}
          />
          <MutationButton
            actionKey={rejectKey}
            pendingAction={pendingAction}
            className="button-danger"
            label="Reject"
            pendingLabel="Rejecting…"
            onClick={() => setReasonPrompt({ kind: "reject", row, reload, recordName })}
          />
        </>
      );
    }

    if (type === "reports") {
      if (["resolved", "dismissed"].includes(row.status)) return null;
      const actionKey = `resolve-report-${row.id}`;
      return (
        <MutationButton
          actionKey={actionKey}
          pendingAction={pendingAction}
          label="Update"
          pendingLabel="Updating…"
          onClick={() => setReasonPrompt({ kind: "resolve-report", row, reload })}
        />
      );
    }

    if (type === "contact-messages" && row.status !== "resolved") {
      const actionKey = `resolve-contact-${row.id}`;
      return (
        <MutationButton
          actionKey={actionKey}
          pendingAction={pendingAction}
          label="Mark resolved"
          pendingLabel="Updating…"
          onClick={() => run({
            actionKey,
            url: `/contact/${row.id}`,
            body: { status: "resolved" },
            successMessage: `Message from ${recordName} was marked resolved.`,
          }, reload)}
        />
      );
    }

    if (type === "payments" && row.status === "pending") {
      const actionKey = `mark-payment-paid-${row.id}`;
      return (
        <MutationButton
          actionKey={actionKey}
          pendingAction={pendingAction}
          label="Mark paid"
          pendingLabel="Updating…"
          onClick={() => run({
            actionKey,
            url: `/payments/${row.id}/pay`,
            confirmation: `Mark payment #${row.id} as paid? This financial status change cannot be undone here.`,
            successMessage: `Payment #${row.id} was marked paid.`,
          }, reload)}
        />
      );
    }

    if (type === "bookings" && !["completed", "cancelled"].includes(row.status)) {
      const actionKey = `cancel-booking-${row.id}`;
      return (
        <MutationButton
          actionKey={actionKey}
          pendingAction={pendingAction}
          className="button-danger"
          label="Cancel"
          pendingLabel="Cancelling…"
          onClick={() => run({
            actionKey,
            url: `/bookings/${row.id}`,
            body: { status: "cancelled" },
            confirmation: `Cancel booking #${row.id}? The student and tutor will lose this scheduled class.`,
            successMessage: `Booking #${row.id} was cancelled.`,
          }, reload)}
        />
      );
    }

    if (type === "applications" && row.status === "pending") {
      const actionKey = `reject-application-${row.id}`;
      return (
        <MutationButton
          actionKey={actionKey}
          pendingAction={pendingAction}
          className="button-danger"
          label="Reject"
          pendingLabel="Rejecting…"
          onClick={() => run({
            actionKey,
            url: `/applications/${row.id}/status`,
            body: { status: "rejected" },
            confirmation: `Reject application #${row.id}? This will close the tutor's proposal.`,
            successMessage: `Application #${row.id} was rejected.`,
          }, reload)}
        />
      );
    }

    if (type === "reviews") {
      const actionKey = `delete-review-${row.id}`;
      return (
        <MutationButton
          actionKey={actionKey}
          pendingAction={pendingAction}
          className="button-danger"
          label="Delete"
          pendingLabel="Deleting…"
          onClick={() => run({
            actionKey,
            url: `/reviews/${row.id}`,
            method: "delete",
            confirmation: `Permanently delete review #${row.id}? This cannot be undone.`,
            successMessage: `Review #${row.id} was deleted.`,
          }, reload)}
        />
      );
    }

    if (["tutor-posts", "student-requests"].includes(type)) {
      const actionKey = `delete-${type}-${row.id}`;
      const resourceLabel = type === "tutor-posts" ? "tutor post" : "student request";
      return (
        <MutationButton
          actionKey={actionKey}
          pendingAction={pendingAction}
          className="button-danger"
          label="Delete"
          pendingLabel="Deleting…"
          onClick={() => run({
            actionKey,
            url: `/${config.resource}/${row.id}`,
            method: "delete",
            confirmation: `Permanently delete ${resourceLabel} “${recordName}”? This cannot be undone.`,
            successMessage: `${resourceLabel[0].toUpperCase()}${resourceLabel.slice(1)} “${recordName}” was deleted.`,
          }, reload)}
        />
      );
    }

    return null;
  };

  const closeReasonPrompt = () => setReasonPrompt(null);

  const submitReasonPrompt = async ({ reason, status }) => {
    if (!reasonPrompt) return;
    const { kind, row, reload, recordName } = reasonPrompt;
    if (kind === "resolve-report") {
      await run({
        actionKey: `resolve-report-${row.id}`,
        url: `/reports/${row.id}`,
        body: { status: status || "resolved", admin_notes: reason },
        successMessage: `Safety report #${row.id} was marked ${status || "resolved"}.`,
      }, reload);
    } else {
      const decision = kind === "verify" ? "verified" : "rejected";
      await run({
        actionKey: `${kind === "verify" ? "verify" : "reject-verification"}-${row.id}`,
        url: `/verifications/${row.id}/decision`,
        body: { status: decision, admin_feedback: reason },
        successMessage: `${recordName}'s verification request was ${decision}.`,
      }, reload);
    }
    setReasonPrompt(null);
  };

  const statusOptions = config.statusOptions;
  const toolbarExtra = statusOptions ? (
    <label className="resource-status-filter">
      <span className="sr-only">Filter by status</span>
      <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
        {statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </label>
  ) : undefined;

  return (
    <>
      <ResourcePage
        title={config.title}
        description={descriptions[type]}
        endpoint={config.endpoint}
        columns={config.columns}
        actions={config.readOnly ? undefined : actions}
        feedback={feedback}
        striped
        paginated={config.paginated}
        extraQuery={statusOptions ? { status: statusFilter } : undefined}
        toolbarExtra={toolbarExtra}
        emptyState={{
          icon: emptyState.icon,
          title: emptyState.title,
          description: emptyState.description,
          action: emptyState.actionPath
            ? <Link className="button button-ghost" to={emptyState.actionPath}>{emptyState.actionLabel}</Link>
            : undefined,
        }}
      />
      {reasonPrompt && (
        <ReasonDialog
          title={
            reasonPrompt.kind === "resolve-report"
              ? `Update safety report #${reasonPrompt.row.id}`
              : reasonPrompt.kind === "verify"
                ? `Approve ${reasonPrompt.recordName}'s verification`
                : `Reject ${reasonPrompt.recordName}'s verification`
          }
          statusOptions={reasonPrompt.kind === "resolve-report" ? configs.reports.statusOptions.filter((option) => option.value) : undefined}
          defaultStatus={reasonPrompt.kind === "resolve-report" ? "resolved" : undefined}
          submitLabel={reasonPrompt.kind === "resolve-report" ? "Update report" : reasonPrompt.kind === "verify" ? "Approve verification" : "Reject verification"}
          pending={Boolean(pendingAction)}
          onClose={closeReasonPrompt}
          onSubmit={submitReasonPrompt}
        />
      )}
    </>
  );
}
