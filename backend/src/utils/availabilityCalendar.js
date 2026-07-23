const WEEKDAY_INDEX = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

const parseWindow = (availabilityText = "") => {
  const match = String(availabilityText).match(/(mon|tue|wed|thu|fri|sat|sun|weekdays|weekends|daily)+?\s*(\d{1,2})(?::(\d{2}))?\s*(?:-|to)\s*(\d{1,2})(?::(\d{2}))?/i);
  if (!match) return null;
  const [, rawDays, startHour, startMinute = "00", endHour, endMinute = "00"] = match;
  const days = rawDays.toLowerCase();
  const start = Number(startHour) * 60 + Number(startMinute);
  const end = Number(endHour) * 60 + Number(endMinute);
  if (start >= end) return null;

  const daySet = new Set();
  if (days === "weekdays") {
    ["monday", "tuesday", "wednesday", "thursday", "friday"].forEach((day) => daySet.add(day));
  } else if (days === "weekends") {
    ["saturday", "sunday"].forEach((day) => daySet.add(day));
  } else if (days === "daily") {
    ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"].forEach((day) => daySet.add(day));
  } else {
    const dayTokens = rawDays.match(/(mon|tue|wed|thu|fri|sat|sun)/gi) || [];
    dayTokens.forEach((token) => daySet.add(token.toLowerCase()));
  }

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
    const dayName = Object.keys(WEEKDAY_INDEX)[current.getDay()].toLowerCase();
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
