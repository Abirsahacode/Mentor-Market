const WEEKDAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

// Student requests and applications store a free-text time such as
// "Tuesday at 7 PM". When an application is accepted we need a concrete
// bookings.class_date / class_time to create the booking row. This makes a
// best-effort guess from that text; the tutor or student can still adjust
// the exact date/time afterwards via PATCH /bookings/:id.
export const parsePreferredTime = (text = "") => {
  const lower = String(text).toLowerCase();
  const now = new Date();

  let targetDay = null;
  for (let index = 0; index < WEEKDAYS.length; index += 1) {
    if (lower.includes(WEEKDAYS[index])) {
      targetDay = index;
      break;
    }
  }

  const date = new Date(now);
  if (targetDay !== null) {
    const currentDay = date.getDay();
    let diff = (targetDay - currentDay + 7) % 7;
    if (diff === 0) diff = 7; // same weekday as today: assume next week, not today
    date.setDate(date.getDate() + diff);
  } else {
    date.setDate(date.getDate() + 3); // no weekday mentioned: default a few days out
  }
  const class_date = date.toISOString().slice(0, 10);

  let class_time = "18:00:00";
  const ampmMatch = lower.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)/);
  const isoMatch = lower.match(/\b([01]?\d|2[0-3]):([0-5]\d)\b/);
  if (ampmMatch) {
    let hour = parseInt(ampmMatch[1], 10);
    const minute = ampmMatch[2] ? parseInt(ampmMatch[2], 10) : 0;
    const period = ampmMatch[3];
    if (period === "pm" && hour !== 12) hour += 12;
    if (period === "am" && hour === 12) hour = 0;
    class_time = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00`;
  } else if (isoMatch) {
    class_time = `${isoMatch[1].padStart(2, "0")}:${isoMatch[2]}:00`;
  }

  return { class_date, class_time };
};
