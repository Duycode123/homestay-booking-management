-- Track bookings that have only paid the deposit and make checkout timeout
-- semantics explicit. The application treats stale pending payment sessions as
-- cancelled after app.booking.payment-expiration-seconds, defaulting to 300.

ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'DEPOSIT_PAID' AFTER 'PENDING_PAYMENT';
