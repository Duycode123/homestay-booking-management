BEGIN;

ALTER TABLE booking
    ADD COLUMN IF NOT EXISTS cancellation_request_status VARCHAR(20),
    ADD COLUMN IF NOT EXISTS cancellation_reason VARCHAR(500),
    ADD COLUMN IF NOT EXISTS cancellation_requested_at TIMESTAMP,
    ADD COLUMN IF NOT EXISTS cancellation_reviewed_at TIMESTAMP,
    ADD COLUMN IF NOT EXISTS cancellation_reviewed_by VARCHAR(255),
    ADD COLUMN IF NOT EXISTS cancellation_admin_note VARCHAR(500),
    ADD COLUMN IF NOT EXISTS refund_amount NUMERIC(12, 2),
    ADD COLUMN IF NOT EXISTS refund_percentage INTEGER,
    ADD COLUMN IF NOT EXISTS refund_method VARCHAR(100),
    ADD COLUMN IF NOT EXISTS expected_refund_at TIMESTAMP;

ALTER TABLE booking
    DROP CONSTRAINT IF EXISTS ck_booking_cancellation_request_status,
    DROP CONSTRAINT IF EXISTS ck_booking_refund_percentage,
    DROP CONSTRAINT IF EXISTS ck_booking_refund_amount;

ALTER TABLE booking
    ADD CONSTRAINT ck_booking_cancellation_request_status
        CHECK (cancellation_request_status IS NULL OR cancellation_request_status IN ('PENDING', 'APPROVED', 'REJECTED')),
    ADD CONSTRAINT ck_booking_refund_percentage
        CHECK (refund_percentage IS NULL OR refund_percentage BETWEEN 0 AND 100),
    ADD CONSTRAINT ck_booking_refund_amount
        CHECK (refund_amount IS NULL OR refund_amount >= 0);

CREATE INDEX IF NOT EXISTS idx_booking_pending_cancellation_request
    ON booking (cancellation_requested_at DESC)
    WHERE cancellation_request_status = 'PENDING';

COMMIT;
