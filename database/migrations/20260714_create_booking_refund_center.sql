BEGIN;

CREATE TABLE IF NOT EXISTS booking_refund (
    id BIGSERIAL PRIMARY KEY,
    booking_id INTEGER NOT NULL,
    original_payment_transaction_id BIGINT,
    amount NUMERIC(12, 2) NOT NULL,
    method VARCHAR(40) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    transaction_reference VARCHAR(100),
    proof_image_url VARCHAR(1000),
    admin_note VARCHAR(500),
    failure_reason VARCHAR(500),
    processed_by VARCHAR(255),
    expected_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    processing_at TIMESTAMP,
    completed_at TIMESTAMP,
    version BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT uk_booking_refund_booking UNIQUE (booking_id),
    CONSTRAINT uk_booking_refund_reference UNIQUE (transaction_reference),
    CONSTRAINT fk_booking_refund_booking
        FOREIGN KEY (booking_id) REFERENCES booking(id),
    CONSTRAINT fk_booking_refund_original_payment
        FOREIGN KEY (original_payment_transaction_id) REFERENCES payment_transaction(id),
    CONSTRAINT ck_booking_refund_amount CHECK (amount > 0),
    CONSTRAINT ck_booking_refund_method CHECK (
        method IN ('ORIGINAL_PAYMENT_METHOD', 'MANUAL_BANK_TRANSFER', 'CASH_COUNTER')
    ),
    CONSTRAINT ck_booking_refund_status CHECK (
        status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'RETRY_REQUIRED')
    ),
    CONSTRAINT ck_booking_refund_completed CHECK (
        status <> 'COMPLETED'
        OR (completed_at IS NOT NULL AND transaction_reference IS NOT NULL)
    )
);

CREATE INDEX IF NOT EXISTS idx_booking_refund_status_created
    ON booking_refund(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_booking_refund_expected
    ON booking_refund(expected_at)
    WHERE status IN ('PENDING', 'PROCESSING', 'RETRY_REQUIRED');

COMMIT;
