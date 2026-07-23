const WEEKDAY_NAMES = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const DAY_ALIASES = {
  sun: "sunday",
  mon: "monday",
  tue: "tuesday",
  wed: "wednesday",
  thu: "thursday",
  fri: "friday",
  sat: "saturday",
};

const parseTime = (value = "") => {
  const match = String(value).trim().match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
  if (!match) return null;
  let hour = Number(match[1]);
  const minute = Number(match[2] || "00");
  const meridiem = (match[3] || "").toLowerCase();
  if (meridiem === "pm" && hour !== 12) hour += 12;
  if (meridiem === "am" && hour === 12) hour = 0;
  return hour * 60 + minute;
};

const parseWindow = (availabilityText = "") => {
  const normalized = String(availabilityText).toLowerCase();
  const daySet = new Set();
  const dayMatches = [...normalized.matchAll(/(sun|mon|tue|wed|thu|fri|sat|weekdays|weekends|daily|every day)/gi)].map((match) => match[1].toLowerCase());

  if (dayMatches.some((token) => token === "weekdays")) {
    ["monday", "tuesday", "wednesday", "thursday", "friday"].forEach((day) => daySet.add(day));
  } else if (dayMatches.some((token) => token === "weekends")) {
    ["saturday", "sunday"].forEach((day) => daySet.add(day));
  } else if (dayMatches.some((token) => token === "daily" || token === "every day")) {
    WEEKDAY_NAMES.forEach((day) => daySet.add(day));
  } else {
    dayMatches.forEach((token) => {
      const canonical = DAY_ALIASES[token] || token;
      if (WEEKDAY_NAMES.includes(canonical)) daySet.add(canonical);
    });
    if (!daySet.size) {
      const fallback = normalized.match(/(weekday|weekend|daily|every day)/i);
      if (fallback) {
        if (fallback[1].toLowerCase() === "weekday") ["monday", "tuesday", "wednesday", "thursday", "friday"].forEach((day) => daySet.add(day));
        if (fallback[1].toLowerCase() === "weekend") ["saturday", "sunday"].forEach((day) => daySet.add(day));
      }
    }
  }

  const timeMatch = normalized.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\s*(?:-|to)\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
  const altTimeMatch = normalized.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
  if (!timeMatch && !altTimeMatch) {
    return null;
  }

  const start = parseTime(timeMatch ? `${timeMatch[1]}:${timeMatch[2] || "00"} ${timeMatch[3] || ""}` : altTimeMatch[0]);
  const end = parseTime(timeMatch ? `${timeMatch[4]}:${timeMatch[5] || "00"} ${timeMatch[6] || ""}` : altTimeMatch[0]);

  if (start === null || end === null || start >= end) return null;
  return { daySet, start, end };
};

const toDateString = (date) => date.toISOString().slice(0, 10);

export const generateAvailabilitySlots = ({
  availabilityText,
  fromDate,
  toDate,
  existingBookings = [],
  intervalMinutes = 60,
}) => {
  const window = parseWindow(availabilityText);
  if (!window) return [];

  const startDate = new Date(`${fromDate}T00:00:00`);
  const endDate = new Date(`${toDate}T00:00:00`);
  const booked = new Set(existingBookings.map((booking) => `${booking.class_date}:${booking.class_time}`));
  const slots = [];

  const current = new Date(startDate);
  while (current <= endDate) {
    const dayName = WEEKDAY_NAMES[current.getDay()];
    if (window.daySet.has(dayName)) {
      const dateKey = toDateString(current);
      let time = window.start;
      while (time + intervalMinutes <= window.end) {
        const hour = String(Math.floor(time / 60)).padStart(2, "0");
        const minute = String(time % 60).padStart(2, "0");
        const slotKey = `${dateKey}:${hour}:${minute}`;
        const isBooked = booked.has(`${dateKey}:${hour}:${minute}:00`)
          || booked.has(`${dateKey}:${hour}:${minute}`);
        if (!isBooked) {
          slots.push({ date: dateKey, time: `${hour}:${minute}`, label: `${dateKey} · ${hour}:${minute}` });
        }
        time += intervalMinutes;
      }
    }
    current.setDate(current.getDate() + 1);
  }

  return slots;
};
