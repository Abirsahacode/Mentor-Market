import { useEffect, useState } from "react";
import api, { getErrorMessage } from "../api/axios.js";
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

const configs = {
  users: { title: "Manage users", endpoint: "/admin/users?limit=100", columns: [{ key: "full_name", label: "Name" }, { key: "email", label: "Email" }, { key: "role", label: "Role" }, { key: "is_active", label: "Active", render: accountStatus }, { key: "created_at", label: "Joined", render: (v) => new Date(v).toLocaleDateString() }] },
  students: { title: "Manage students", endpoint: "/admin/users?role=student&limit=100", columns: [{ key: "full_name", label: "Student" }, { key: "email", label: "Email" }, { key: "phone", label: "Phone" }, { key: "is_active", label: "Active", render: accountStatus }] },
  tutors: { title: "Manage tutors", endpoint: "/admin/users?role=tutor&limit=100", columns: [{ key: "full_name", label: "Tutor" }, { key: "email", label: "Email" }, { key: "phone", label: "Phone" }, { key: "is_active", label: "Active", render: accountStatus }] },
  "tutor-posts": { title: "Manage tutor posts", endpoint: "/admin/tutor_posts", resource: "tutor-posts", columns: [{ key: "title", label: "Title" }, { key: "subject", label: "Subject" }, { key: "tutor_id", label: "Tutor ID" }, { key: "price", label: "Price" }, { key: "status", label: "Status", render: status }] },
  "student-requests": { title: "Manage student requests", endpoint: "/admin/student_requests", resource: "student-requests", columns: [{ key: "subject", label: "Subject" }, { key: "class_level", label: "Level" }, { key: "student_id", label: "Student ID" }, { key: "budget", label: "Budget" }, { key: "status", label: "Status", render: status }] },
  applications: { title: "Manage applications", endpoint: "/admin/applications", columns: [{ key: "student_request_id", label: "Request ID" }, { key: "tutor_id", label: "Tutor ID" }, { key: "expected_fee", label: "Fee" }, { key: "available_time", label: "Available" }, { key: "status", label: "Status", render: status }] },
  bookings: { title: "Manage bookings", endpoint: "/admin/bookings", columns: [{ key: "student_id", label: "Student ID" }, { key: "tutor_id", label: "Tutor ID" }, { key: "class_date", label: "Date" }, { key: "mode", label: "Mode" }, { key: "status", label: "Status", render: status }] },
  payments: { title: "Manage payments", endpoint: "/admin/payments", columns: [{ key: "booking_id", label: "Booking" }, { key: "amount", label: "Amount" }, { key: "commission", label: "Commission" }, { key: "payment_method", label: "Method" }, { key: "status", label: "Status", render: status }] },
  reviews: { title: "Manage reviews", endpoint: "/admin/reviews", columns: [{ key: "reviewer_id", label: "Reviewer" }, { key: "receiver_id", label: "Receiver" }, { key: "rating", label: "Rating" }, { key: "comment", label: "Comment" }, { key: "created_at", label: "Created" }] },
  verifications: {
    title: "Verification requests",
    endpoint: "/verifications?status=pending",
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
  reports: { title: "Reports and safety", endpoint: "/admin/reports", columns: [{ key: "reporter_id", label: "Reporter" }, { key: "reported_user_id", label: "Reported user" }, { key: "category", label: "Category" }, { key: "description", label: "Description" }, { key: "status", label: "Status", render: status }] },
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
};

export default function AdminResourcePage({ type }) {
  const config = configs[type];
  const [pendingAction, setPendingAction] = useState("");
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    setPendingAction("");
    setFeedback(null);
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
            onClick={() => run({
              actionKey: verifyKey,
              url: `/verifications/${row.id}/decision`,
              body: { status: "verified", admin_feedback: "Credentials approved." },
              confirmation: `Approve ${recordName}'s verification request? This will award the mentor a verified badge.`,
              successMessage: `${recordName}'s verification request was approved.`,
            }, reload)}
          />
          <MutationButton
            actionKey={rejectKey}
            pendingAction={pendingAction}
            className="button-danger"
            label="Reject"
            pendingLabel="Rejecting…"
            onClick={() => run({
              actionKey: rejectKey,
              url: `/verifications/${row.id}/decision`,
              body: { status: "rejected", admin_feedback: "Please provide clearer evidence." },
              confirmation: `Reject ${recordName}'s verification request? The mentor will be asked to provide clearer evidence.`,
              successMessage: `${recordName}'s verification request was rejected.`,
            }, reload)}
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
          label="Resolve"
          pendingLabel="Resolving…"
          onClick={() => run({
            actionKey,
            url: `/reports/${row.id}`,
            body: { status: "resolved", admin_notes: "Reviewed by administrator." },
            confirmation: `Resolve safety report #${row.id}? This will close the case.`,
            successMessage: `Safety report #${row.id} was resolved.`,
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

  return (
    <ResourcePage
      title={config.title}
      description={descriptions[type]}
      endpoint={config.endpoint}
      columns={config.columns}
      actions={actions}
      feedback={feedback}
    />
  );
}
