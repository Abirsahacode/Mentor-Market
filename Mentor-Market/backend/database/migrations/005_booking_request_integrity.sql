USE mentor_market;

-- A student request can hire one tutor and create at most one booking.
-- NULL values remain unrestricted, so direct course bookings are unaffected.
ALTER TABLE bookings
  ADD UNIQUE INDEX IF NOT EXISTS uq_bookings_student_request (student_request_id);
