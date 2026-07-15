import api from "../api/axios.js";
import ResourcePage from "../components/ResourcePage.jsx";

const status = (value) => <span className={`status-badge status-${value}`}>{String(value)}</span>;

const configs = {
  users: { title: "Manage users", endpoint: "/admin/users", columns: [{ key: "full_name", label: "Name" }, { key: "email", label: "Email" }, { key: "role", label: "Role" }, { key: "is_active", label: "Active", render: status }, { key: "created_at", label: "Joined", render: (v) => new Date(v).toLocaleDateString() }] },
  students: { title: "Manage students", endpoint: "/admin/users?role=student", columns: [{ key: "full_name", label: "Student" }, { key: "email", label: "Email" }, { key: "phone", label: "Phone" }, { key: "is_active", label: "Active", render: status }] },
  tutors: { title: "Manage tutors", endpoint: "/admin/users?role=tutor", columns: [{ key: "full_name", label: "Tutor" }, { key: "email", label: "Email" }, { key: "phone", label: "Phone" }, { key: "is_active", label: "Active", render: status }] },
  "tutor-posts": { title: "Manage tutor posts", endpoint: "/admin/tutor_posts", resource: "tutor-posts", columns: [{ key: "title", label: "Title" }, { key: "subject", label: "Subject" }, { key: "tutor_id", label: "Tutor ID" }, { key: "price", label: "Price" }, { key: "status", label: "Status", render: status }] },
  "student-requests": { title: "Manage student requests", endpoint: "/admin/student_requests", resource: "student-requests", columns: [{ key: "subject", label: "Subject" }, { key: "class_level", label: "Level" }, { key: "student_id", label: "Student ID" }, { key: "budget", label: "Budget" }, { key: "status", label: "Status", render: status }] },
  applications: { title: "Manage applications", endpoint: "/admin/applications", columns: [{ key: "student_request_id", label: "Request ID" }, { key: "tutor_id", label: "Tutor ID" }, { key: "expected_fee", label: "Fee" }, { key: "available_time", label: "Available" }, { key: "status", label: "Status", render: status }] },
  bookings: { title: "Manage bookings", endpoint: "/admin/bookings", columns: [{ key: "student_id", label: "Student ID" }, { key: "tutor_id", label: "Tutor ID" }, { key: "class_date", label: "Date" }, { key: "mode", label: "Mode" }, { key: "status", label: "Status", render: status }] },
  payments: { title: "Manage payments", endpoint: "/admin/payments", columns: [{ key: "booking_id", label: "Booking" }, { key: "amount", label: "Amount" }, { key: "commission", label: "Commission" }, { key: "payment_method", label: "Method" }, { key: "status", label: "Status", render: status }] },
  reviews: { title: "Manage reviews", endpoint: "/admin/reviews", columns: [{ key: "reviewer_id", label: "Reviewer" }, { key: "receiver_id", label: "Receiver" }, { key: "rating", label: "Rating" }, { key: "comment", label: "Comment" }, { key: "created_at", label: "Created" }] },
  verifications: { title: "Verification requests", endpoint: "/verifications?status=pending", columns: [{ key: "tutor_id", label: "Tutor ID" }, { key: "certificate_name", label: "Certificate" }, { key: "institution", label: "Institution" }, { key: "experience_proof", label: "Proof" }, { key: "status", label: "Status", render: status }] },
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
  const actions = (row, reload) => {
    const run = async (url, method = "patch", body) => { await api[method](url, body); reload(); };
    if (["users", "students", "tutors"].includes(type)) return <button className={`button button-tiny ${row.is_active ? "button-danger" : ""}`} onClick={() => run(`/admin/users/${row.id}/status`, "patch", { is_active: !row.is_active })}>{row.is_active ? "Suspend" : "Activate"}</button>;
    if (type === "verifications") return <><button className="button button-tiny" onClick={() => run(`/verifications/${row.id}/decision`, "patch", { status: "verified", admin_feedback: "Credentials approved." })}>Verify</button><button className="button button-tiny button-danger" onClick={() => run(`/verifications/${row.id}/decision`, "patch", { status: "rejected", admin_feedback: "Please provide clearer evidence." })}>Reject</button></>;
    if (type === "reports") return <button className="button button-tiny" onClick={() => run(`/reports/${row.id}`, "patch", { status: "resolved", admin_notes: "Reviewed by administrator." })}>Resolve</button>;
    if (type === "payments" && row.status === "pending") return <button className="button button-tiny" onClick={() => run(`/payments/${row.id}/pay`)}>Mark paid</button>;
    if (type === "bookings" && !["completed", "cancelled"].includes(row.status)) return <button className="button button-tiny button-danger" onClick={() => run(`/bookings/${row.id}`, "patch", { status: "cancelled" })}>Cancel</button>;
    if (type === "applications" && row.status === "pending") return <button className="button button-tiny button-danger" onClick={() => run(`/applications/${row.id}/status`, "patch", { status: "rejected" })}>Reject</button>;
    if (type === "reviews") return <button className="button button-tiny button-danger" onClick={() => run(`/reviews/${row.id}`, "delete")}>Delete</button>;
    if (["tutor-posts", "student-requests"].includes(type)) return <button className="button button-tiny button-danger" onClick={() => run(`/${config.resource}/${row.id}`, "delete")}>Delete</button>;
    return null;
  };
  return <ResourcePage title={config.title} description={descriptions[type]} endpoint={config.endpoint} columns={config.columns} actions={actions} />;
}
