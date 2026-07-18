ALTER TABLE booking DROP CONSTRAINT IF EXISTS excl_booking_no_overlap;
ALTER TABLE booking
  ADD CONSTRAINT excl_booking_no_overlap
  EXCLUDE USING gist (
    room_id WITH =,
    tsrange(start_time, end_time, '[)') WITH &&
  )
  WHERE (status NOT IN ('CANCELLED', 'EXPIRED'));

COMMENT ON COLUMN booking.status IS
  'EXPIRED is an unpaid, released payment hold; CANCELLED is a real booking cancellation.';
