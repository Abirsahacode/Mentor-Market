import { Calendar, Clock, Plus, Trash2, CheckCircle2, AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";
import api, { getErrorMessage } from "../api/axios.js";
import Alert from "./Alert.jsx";
import FormField from "./FormField.jsx";
import LoadingSpinner from "./LoadingSpinner.jsx";

const todayStr = () => new Date().toISOString().slice(0, 10);

const DEFAULT_TIMES = [
  "08:00", "09:00", "10:00", "11:00", "12:00",
  "13:00", "14:00", "15:00", "16:00", "17:00",
  "18:00", "19:00", "20:00", "21:00",
];

export default function TutorAvailabilityManager() {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");

  const [date, setDate] = useState(todayStr());
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("11:00");

  const loadSlots = async () => {
    setLoading(true);
    try {
      const response = await api.get("/tutors/availability/my");
      setSlots(response.data.data || []);
    } catch (err) {
      setMessage(getErrorMessage(err));
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSlots();
  }, []);

  const handleAddSlot = async (e) => {
    e.preventDefault();
    setMessage("");
    setSubmitting(true);
    try {
      await api.post("/tutors/availability", {
        date,
        start_time: startTime,
        end_time: endTime,
      });
      setMessage(`Availability added for ${date} (${startTime} - ${endTime})`);
      setMessageType("success");
      await loadSlots();
    } catch (err) {
      setMessage(getErrorMessage(err));
      setMessageType("error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSlot = async (id) => {
    setMessage("");
    setDeletingId(id);
    try {
      await api.delete(`/tutors/availability/${id}`);
      setMessage("Availability slot removed");
      setMessageType("success");
      setSlots((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      setMessage(getErrorMessage(err));
      setMessageType("error");
    } finally {
      setDeletingId(null);
    }
  };

  // Group slots by date
  const groupedSlots = slots.reduce((acc, slot) => {
    const d = slot.date;
    if (!acc[d]) acc[d] = [];
    acc[d].push(slot);
    return acc;
  }, {});

  const datesSorted = Object.keys(groupedSlots).sort();

  return (
    <div className="availability-manager-card panel">
      <div className="panel-heading">
        <span className="panel-eyebrow">Schedule Studio</span>
        <h2>Tutor Availability Calendar</h2>
        <p>Set specific dates and times when you are open for mentoring sessions. Students will book directly from these slots.</p>
      </div>

      {message && (
        <Alert type={messageType === "success" ? "success" : "error"}>
          {message}
        </Alert>
      )}

      <form className="availability-form" onSubmit={handleAddSlot}>
        <div className="form-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
          <FormField
            label="Date"
            name="date"
            type="date"
            min={todayStr()}
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
          <FormField
            label="Start Time"
            name="start_time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            options={DEFAULT_TIMES.map((t) => ({ value: t, label: t }))}
            required
          />
          <FormField
            label="End Time"
            name="end_time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            options={DEFAULT_TIMES.map((t) => ({ value: t, label: t }))}
            required
          />
        </div>
        <div style={{ marginTop: "1rem" }}>
          <button type="submit" className="button" disabled={submitting}>
            <Plus size={16} /> {submitting ? "Saving slot…" : "Add Availability Slot"}
          </button>
        </div>
      </form>

      <hr style={{ margin: "2rem 0", border: "0", borderTop: "1px solid var(--color-border, #e5e7eb)" }} />

      <div className="availability-slots-view">
        <h3>Your Saved Availability Slots</h3>
        {loading ? (
          <LoadingSpinner label="Loading your slots…" />
        ) : datesSorted.length === 0 ? (
          <p className="muted" style={{ padding: "1rem 0" }}>
            No specific availability slots added yet. Add your available dates and times above!
          </p>
        ) : (
          <div className="availability-date-groups" style={{ display: "flex", flexDirection: "column", gap: "1.5rem", marginTop: "1rem" }}>
            {datesSorted.map((d) => (
              <div key={d} className="date-group-card" style={{ border: "1px solid var(--color-border, #e5e7eb)", borderRadius: "8px", padding: "1rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem", fontWeight: "600" }}>
                  <Calendar size={16} />
                  <span>{d}</span>
                  <span className="badge" style={{ fontSize: "0.75rem", opacity: 0.8 }}>
                    {groupedSlots[d].length} slot{groupedSlots[d].length > 1 ? "s" : ""}
                  </span>
                </div>
                <div className="slots-grid" style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
                  {groupedSlots[d].map((slot) => (
                    <div
                      key={slot.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        padding: "0.4rem 0.75rem",
                        borderRadius: "6px",
                        background: slot.is_booked ? "var(--color-bg-subtle, #f3f4f6)" : "var(--color-primary-light, #e0f2fe)",
                        border: `1px solid ${slot.is_booked ? "#d1d5db" : "var(--color-primary-border, #bae6fd)"}`,
                        fontSize: "0.875rem",
                      }}
                    >
                      <Clock size={14} />
                      <span>
                        {slot.start_time} - {slot.end_time}
                      </span>
                      {slot.is_booked ? (
                        <span style={{ fontSize: "0.75rem", color: "#6b7280", fontWeight: 500, marginLeft: "0.25rem" }}>
                          (Booked: {slot.booking?.student_name || "Student"})
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleDeleteSlot(slot.id)}
                          disabled={deletingId === slot.id}
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            color: "#ef4444",
                            padding: "2px",
                            display: "flex",
                            alignItems: "center",
                            marginLeft: "0.25rem",
                          }}
                          title="Delete slot"
                          aria-label="Delete slot"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
