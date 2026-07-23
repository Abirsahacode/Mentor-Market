import test from "node:test";
import assert from "node:assert/strict";
import { generateAvailabilitySlots } from "../src/utils/availabilityCalendar.js";

test("generateAvailabilitySlots produces recurring tutor slots and excludes existing bookings", () => {
  const slots = generateAvailabilitySlots({
    availabilityText: "Weekdays 09:00-17:00",
    fromDate: "2026-07-20",
    toDate: "2026-07-24",
    existingBookings: [{ class_date: "2026-07-21", class_time: "10:00:00" }],
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
  assert.ok(slots.some((slot) => slot.date === "2026-07-24" && slot.time === "20:00"));
});
