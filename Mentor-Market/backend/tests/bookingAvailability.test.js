import test from "node:test";
import assert from "node:assert/strict";
import { generateAvailabilitySlots } from "../src/utils/availabilityCalendar.js";

test("generateAvailabilitySlots produces recurring tutor slots and excludes existing bookings", () => {
  const slots = generateAvailabilitySlots({
    availabilityText: "Weekdays 09:00-17:00",
    fromDate: "2026-07-20",
    toDate: "2026-07-24",
    existingBookings: [{ class_date: new Date("2026-07-21T00:00:00.000Z"), class_time: "10:00:00" }],
  });

  assert.ok(slots.length > 0);
  assert.equal(slots[0].date, "2026-07-20");
  assert.equal(slots[0].time, "09:00");
  assert.equal(slots.some((slot) => slot.date === "2026-07-21" && slot.time === "10:00"), false);
  assert.ok(slots.some((slot) => slot.date === "2026-07-24" && slot.time === "16:00"));
});

test("generateAvailabilitySlots handles seeded availability text like Sun-Thu, 5 PM-9 PM", () => {
  const slots = generateAvailabilitySlots({
    availabilityText: "Sun-Thu, 5 PM-9 PM",
    fromDate: "2026-07-20",
    toDate: "2026-07-24",
    existingBookings: [],
  });

  assert.ok(slots.length > 0);
  assert.ok(slots.some((slot) => slot.date === "2026-07-20" && slot.time === "17:00"));
  assert.ok(slots.some((slot) => slot.date === "2026-07-23" && slot.time === "20:00"));
  assert.equal(slots.some((slot) => slot.date === "2026-07-24"), false);
});

test("generateAvailabilitySlots keeps the selected date intact for local timezone bookings", () => {
  const slots = generateAvailabilitySlots({
    availabilityText: "Every day, 6 PM-10 PM",
    fromDate: "2026-07-24",
    toDate: "2026-07-24",
    existingBookings: [],
  });

  assert.ok(slots.some((slot) => slot.date === "2026-07-24"));
  assert.ok(slots.some((slot) => slot.date === "2026-07-24" && slot.time === "20:00"));
});

test("generateAvailabilitySlots expands wrapped day ranges and vague night windows", () => {
  const slots = generateAvailabilitySlots({
    availabilityText: "Sat-Thu nights",
    fromDate: "2026-07-18",
    toDate: "2026-07-24",
    existingBookings: [],
  });

  assert.ok(slots.some((slot) => slot.date === "2026-07-18" && slot.time === "18:00"));
  assert.ok(slots.some((slot) => slot.date === "2026-07-23" && slot.time === "21:00"));
  assert.equal(slots.some((slot) => slot.date === "2026-07-24"), false);
});

test("generateAvailabilitySlots supplies sensible windows for day-only and descriptive schedules", () => {
  const afternoons = generateAvailabilitySlots({
    availabilityText: "Friday afternoons",
    fromDate: "2026-07-24",
    toDate: "2026-07-24",
    existingBookings: [],
  });
  const dayOnly = generateAvailabilitySlots({
    availabilityText: "Tuesday and Thursday",
    fromDate: "2026-07-21",
    toDate: "2026-07-21",
    existingBookings: [],
  });

  assert.deepEqual(afternoons.map((slot) => slot.time), ["13:00", "14:00", "15:00", "16:00"]);
  assert.equal(dayOnly[0].time, "09:00");
  assert.equal(dayOnly.at(-1).time, "16:00");
});

test("generateAvailabilitySlots rejects malformed or reversed calendar dates", () => {
  assert.deepEqual(generateAvailabilitySlots({
    availabilityText: "Every day, 9 AM-5 PM",
    fromDate: "2026-02-30",
    toDate: "2026-03-01",
  }), []);
  assert.deepEqual(generateAvailabilitySlots({
    availabilityText: "Every day, 9 AM-5 PM",
    fromDate: "2026-07-25",
    toDate: "2026-07-24",
  }), []);
});
