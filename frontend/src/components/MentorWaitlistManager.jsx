import { Calendar, Clock, Mail, MessageCircle, Phone, UserCheck, Users, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api, { getErrorMessage } from "../api/axios.js";
import Alert from "./Alert.jsx";
import LoadingSpinner from "./LoadingSpinner.jsx";
import UserAvatar from "./UserAvatar.jsx";

export default function MentorWaitlistManager() {
  const [waitlist, setWaitlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [removingId, setRemovingId] = useState(null);

  const loadWaitlist = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/bookings/waitlist/mentor");
      setWaitlist(response.data.data || []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWaitlist();
  }, []);

  const handleRemove = async (id) => {
    setActionMessage("");
    setRemovingId(id);
    try {
      await api.delete(`/bookings/waitlist/${id}`);
      setActionMessage("Waitlist entry removed.");
      setWaitlist((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div className="panel waitlist-manager-card">
      <div className="panel-heading">
        <div>
          <span className="panel-eyebrow">Demand Desk</span>
          <h2>Waitlisted Students</h2>
        </div>
        <span className="badge" style={{ fontSize: "0.875rem" }}>
          {waitlist.length} student{waitlist.length !== 1 ? "s" : ""} waitlisted
        </span>
      </div>

      {error && <Alert>{error}</Alert>}
      {actionMessage && <Alert type="success">{actionMessage}</Alert>}

      {loading ? (
        <LoadingSpinner label="Loading waitlisted students…" />
      ) : waitlist.length === 0 ? (
        <div style={{ padding: "1.5rem 0", textAlign: "center", color: "#6b7280" }}>
          <Users size={32} style={{ margin: "0 auto 0.5rem", opacity: 0.5 }} />
          <p>No students are currently on your class waitlist.</p>
          <small>When a class slot is fully booked, students who want to join will appear here.</small>
        </div>
      ) : (
        <div className="waitlist-grid" style={{ display: "flex", flexDirection: "column", gap: "1rem", marginTop: "1rem" }}>
          {waitlist.map((item) => (
            <div
              key={item.id}
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "1rem",
                padding: "1rem",
                borderRadius: "8px",
                border: "1px solid var(--color-border, #e5e7eb)",
                background: "var(--color-bg-card, #ffffff)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <UserAvatar name={item.student_name} image={item.student_avatar} size="medium" />
                <div>
                  <strong style={{ display: "block", fontSize: "1rem" }}>{item.student_name}</strong>
                  <div style={{ display: "flex", gap: "1rem", fontSize: "0.8rem", color: "#6b7280", marginTop: "2px" }}>
                    {item.student_email && (
                      <span style={{ display: "flex", alignItems: "center", gap: "3px" }}>
                        <Mail size={12} /> {item.student_email}
                      </span>
                    )}
                    {item.student_phone && (
                      <span style={{ display: "flex", alignItems: "center", gap: "3px" }}>
                        <Phone size={12} /> {item.student_phone}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
                <div style={{ fontSize: "0.875rem", textAlign: "right" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "4px", fontWeight: 600 }}>
                    <Calendar size={14} />
                    <span>{item.class_date}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "4px", color: "#6b7280", fontSize: "0.8rem" }}>
                    <Clock size={12} />
                    <span>{item.class_time?.slice(0, 5)}</span>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <Link
                    to={`/tutor/messages?recipient=${item.student_id}&name=${encodeURIComponent(item.student_name)}`}
                    className="button button-ghost button-tiny"
                    title="Message student"
                  >
                    <MessageCircle size={14} /> Message
                  </Link>
                  <button
                    type="button"
                    className="button button-tiny button-ghost"
                    onClick={() => handleRemove(item.id)}
                    disabled={removingId === item.id}
                    style={{ color: "#ef4444" }}
                    title="Dismiss waitlist entry"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
