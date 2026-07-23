const WEEKDAY_NAMES = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const DAY_INDEX = {
  sunday: 0,
  sun: 0,
  monday: 1,
  mon: 1,
  tuesday: 2,
  tue: 2,
  wednesday: 3,
  wed: 3,
  thursday: 4,
  thu: 4,
  friday: 5,
  fri: 5,
  saturday: 6,
  sat: 6,
};
const DAY_TOKEN_PATTERN = Object.keys(DAY_INDEX).join("|");
const DEFAULT_WINDOW = { start: 9 * 60, end: 17 * 60 };
const VAGUE_WINDOWS = [
  { pattern: /\bmornings?\b/i, start: 9 * 60, end: 12 * 60 },
  { pattern: /\bafternoons?\b/i, start: 13 * 60, end: 17 * 60 },
  { pattern: /\bevenings?\b/i, start: 17 * 60, end: 21 * 60 },
  { pattern: /\bnights?\b/i, start: 18 * 60, end: 22 * 60 },
];

const toMinutes = (hourValue, minuteValue = "00", meridiemValue = "") => {
  let hour = Number(hourValue);
  const minute = Number(minuteValue);
  const meridiem = String(meridiemValue).toLowerCase();
  if (!Number.isInteger(hour) || !Number.isInteger(minute) || minute < 0 || minute > 59) return null;
  if (meridiem && (hour < 1 || hour > 12)) return null;
  if (!meridiem && (hour < 0 || hour > 23)) return null;
  if (meridiem === "pm" && hour !== 12) hour += 12;
  if (meridiem === "am" && hour === 12) hour = 0;
  return hour * 60 + minute;
};

const addDayRange = (daySet, start, end) => {
  let index = start;
  for (let count = 0; count < WEEKDAY_NAMES.length; count += 1) {
    daySet.add(WEEKDAY_NAMES[index]);
    if (index === end) break;
    index = (index + 1) % WEEKDAY_NAMES.length;
  }
};

const parseDays = (normalized) => {
  const daySet = new Set();
  if (/\bweekdays?\b/i.test(normalized)) {
    [1, 2, 3, 4, 5].forEach((index) => daySet.add(WEEKDAY_NAMES[index]));
  }
  if (/\bweekends?\b/i.test(normalized)) {
    [6, 0].forEach((index) => daySet.add(WEEKDAY_NAMES[index]));
  }
  if (/\b(?:daily|every\s+day)\b/i.test(normalized)) {
    WEEKDAY_NAMES.forEach((day) => daySet.add(day));
  }

  const rangePattern = new RegExp(
    `\\b(${DAY_TOKEN_PATTERN})\\b\\s*(?:-|–|—|to|through|thru)\\s*\\b(${DAY_TOKEN_PATTERN})\\b`,
    "gi",
  );
  for (const match of normalized.matchAll(rangePattern)) {
    addDayRange(daySet, DAY_INDEX[match[1].toLowerCase()], DAY_INDEX[match[2].toLowerCase()]);
  }

  const tokenPattern = new RegExp(`\\b(${DAY_TOKEN_PATTERN})\\b`, "gi");
  for (const match of normalized.matchAll(tokenPattern)) {
    daySet.add(WEEKDAY_NAMES[DAY_INDEX[match[1].toLowerCase()]]);
  }
  return daySet;
};

const inferMeridiems = (startHour, startMeridiem, endHour, endMeridiem) => {
  if (!startMeridiem && endMeridiem === "pm") {
    startMeridiem = startHour > endHour ? "am" : "pm";
  } else if (!startMeridiem && endMeridiem === "am") {
    startMeridiem = "am";
  }
  if (!endMeridiem && startMeridiem === "am") {
    endMeridiem = endHour <= startHour ? "pm" : "am";
  } else if (!endMeridiem && startMeridiem === "pm") {
    endMeridiem = "pm";
  }
  return { startMeridiem, endMeridiem };
};

const parseTimeWindow = (normalized) => {
  const rangeMatch = normalized.match(
    /\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\s*(?:-|–|—|to)\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/i,
  );
  if (rangeMatch) {
    const startHour = Number(rangeMatch[1]);
    const endHour = Number(rangeMatch[4]);
    const inferred = inferMeridiems(
      startHour,
      (rangeMatch[3] || "").toLowerCase(),
      endHour,
      (rangeMatch[6] || "").toLowerCase(),
    );
    const start = toMinutes(startHour, rangeMatch[2], inferred.startMeridiem);
    const end = toMinutes(endHour, rangeMatch[5], inferred.endMeridiem);
    if (start !== null && end !== null && start < end) return { start, end };
    return null;
  }

  const vagueWindow = VAGUE_WINDOWS.find(({ pattern }) => pattern.test(normalized));
  if (vagueWindow) return { start: vagueWindow.start, end: vagueWindow.end };

  const singleTime = normalized.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i);
  if (singleTime) {
    const start = toMinutes(singleTime[1], singleTime[2], singleTime[3]);
    if (start !== null && start + 60 <= 24 * 60) return { start, end: start + 60 };
  }
  return null;
};

const parseWindow = (availabilityText = "") => {
  const normalized = String(availabilityText).trim().toLowerCase();
  if (!normalized) return null;

  const daySet = parseDays(normalized);
  const isFlexible = /\b(?:flexible|any\s*time|by\s+(?:appointment|arrangement))\b/i.test(normalized);
  let timeWindow = parseTimeWindow(normalized);

  // Day-only schedules are common in short marketplace profiles. A daytime
  // window keeps those schedules usable without pretending they are 24/7.
  if (!timeWindow && daySet.size) timeWindow = DEFAULT_WINDOW;
  if (!daySet.size && (timeWindow || isFlexible)) {
    WEEKDAY_NAMES.forEach((day) => daySet.add(day));
  }
  if (!timeWindow && isFlexible) timeWindow = DEFAULT_WINDOW;
  if (!daySet.size || !timeWindow) return null;
  return { daySet, ...timeWindow };
};

export const normalizeDateOnly = (value) => {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value.toISOString().slice(0, 10);
  }
  const match = String(value ?? "").match(/^(\d{4})-(\d{2})-(\d{2})(?:T.*)?$/);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year
    || date.getUTCMonth() !== month - 1
    || date.getUTCDate() !== day
  ) return null;
  return `${match[1]}-${match[2]}-${match[3]}`;
};

const normalizeTime = (value) => {
  const match = String(value ?? "").match(/^([01]\d|2[0-3]):([0-5]\d)(?::[0-5]\d)?$/);
  return match ? `${match[1]}:${match[2]}` : null;
};

const parseDateOnly = (value) => {
  const normalized = normalizeDateOnly(value);
  return normalized ? new Date(`${normalized}T00:00:00.000Z`) : null;
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
  const startDate = parseDateOnly(fromDate);
  const endDate = parseDateOnly(toDate);
  const interval = Number(intervalMinutes);
  if (!window || !startDate || !endDate || startDate > endDate || !Number.isInteger(interval) || interval < 1) {
    return [];
  }

  const booked = new Set(existingBookings.flatMap((booking) => {
    const date = normalizeDateOnly(booking.class_date);
    const time = normalizeTime(booking.class_time);
    return date && time ? [`${date}:${time}`] : [];
  }));
  const slots = [];

  const current = new Date(startDate);
  while (current <= endDate) {
    const dayName = WEEKDAY_NAMES[current.getUTCDay()];
    if (window.daySet.has(dayName)) {
      const dateKey = toDateString(current);
      let time = window.start;
      while (time + interval <= window.end) {
        const hour = String(Math.floor(time / 60)).padStart(2, "0");
        const minute = String(time % 60).padStart(2, "0");
        const slotKey = `${dateKey}:${hour}:${minute}`;
        if (!booked.has(slotKey)) {
          slots.push({ date: dateKey, time: `${hour}:${minute}`, label: `${dateKey} · ${hour}:${minute}` });
        }
        time += interval;
      }
    }
    current.setUTCDate(current.getUTCDate() + 1);
  }

  return slots;
};
