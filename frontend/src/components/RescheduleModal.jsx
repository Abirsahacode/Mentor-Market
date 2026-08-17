import { Calendar, Clock, RefreshCw, X } from "lucide-react";
import { useEffect, useState } from "react";
import api, { getErrorMessage } from "../api/axios.js";
import AccessibleDialog from "./AccessibleDialog.jsx";
import Alert from "./Alert.jsx";
import FormField from "./FormField.jsx";

const todayStr = () => new Date().toISOString().slice(0, 10);

const DEFAULT_TIMES = [
  "08:00", "09:00", "10:00", "11:00", "12:00",
  "13:00", "14:00", "15:00", "16:00", "17:00",
  "18:00", "19:00", "20:00", "21:00",
];

export default function RescheduleModal({ booking, onClose, onSuccess }) {
  const [newDate, setNewDate] = useState(todayStr());
  const [newTime, setNewTime] = useState("10:00");
  const [reason, setReason] = useState("");
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!newDate || !booking?.tutor_id) return;
    const fetchSlots = async () => {
      setLoadingSlots(true);
      try {
        const response = await api.get("/bookings/availability", {
          params: { tutor_id: booking.tutor_id, from_date: newDate, to_date: newDate },
        });
        const slots = response.data.data || [];
        const open = slots.filter((s) => !s.is_booked);
        setAvailableSlots(open);
        if (open.length > 0 && !open.some((s) => s.time === newTime)) {
          setNewTime(open[0].time);
        }
      } catch {
        setAvailableSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    };
    fetchSlots();
  }, [newDate, booking?.tutor_id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await api.post(`/bookings/${booking.id}/reschedule-request`, {
        new_date: newDate,
        new_time: newTime,
        reason,
      });
      onSuccess?.("Reschedule request submitted successfully!");
      onClose();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const titleId = `reschedule-title-${booking.id}`;

  return (
    <AccessibleDialog as="form" onSubmit={handleSubmit} onClose={onClose} labelledBy={titleId}>
      <button type="button" className="modal-close" onClick={onClose} aria-label="Close dialog">
        ×
      </button>

      <span className="eyebrow">Class Schedule Change</span>
      <h2 id={titleId}>Request Reschedule</h2>
      <p className="modal-intro">
        Pick a new date and time for Class #{booking.id}. The receiving party will review and approve your request.
      </p>

      {error && <Alert>{error}</Alert>}

      <FormField
        label="New Class Date"
        name="new_date"
        type="date"
        min={todayStr()}
        value={newDate}
        onChange={(e) => setNewDate(e.target.value)}
        required
      />

      <FormField
        label="New Class Time"
        name="new_time"
        value={newTime}
        onChange={(e) => setNewTime(e.target.value)}
        options={
          availableSlots.length > 0
            ? availableSlots.map((s) => ({ value: s.time, label: s.time }))
            : DEFAULT_TIMES.map((t) => ({ value: t, label: t }))
        }
        hint={loadingSlots ? "Checking calendar availability…" : "Choose a new class start time."}
        required
      />

      <FormField
        label="Reason for Reschedule (Optional)"
        name="reason"
        as="textarea"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Add a brief note explaining why you are requesting a new time…"
      />

      <button className="button button-block" disabled={submitting} aria-busy={submitting || undefined}>
        <RefreshCw size={16} /> {submitting ? "Submitting request…" : "Submit Reschedule Request"}
      </button>
    </AccessibleDialog>
  );
}
