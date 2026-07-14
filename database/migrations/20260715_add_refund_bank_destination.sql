BEGIN;

ALTER TABLE booking
    ADD COLUMN IF NOT EXISTS refund_bank_code VARCHAR(20),
    ADD COLUMN IF NOT EXISTS refund_bank_name VARCHAR(100),
    ADD COLUMN IF NOT EXISTS refund_account_number VARCHAR(30),
    ADD COLUMN IF NOT EXISTS refund_account_holder VARCHAR(100);

ALTER TABLE booking_refund
    ADD COLUMN IF NOT EXISTS recipient_bank_code VARCHAR(20),
    ADD COLUMN IF NOT EXISTS recipient_bank_name VARCHAR(100),
    ADD COLUMN IF NOT EXISTS recipient_account_number VARCHAR(30),
    ADD COLUMN IF NOT EXISTS recipient_account_holder VARCHAR(100);

ALTER TABLE booking
    DROP CONSTRAINT IF EXISTS ck_booking_refund_destination_complete,
    DROP CONSTRAINT IF EXISTS ck_booking_refund_account_number;

ALTER TABLE booking
    ADD CONSTRAINT ck_booking_refund_destination_complete CHECK (
        (refund_bank_code IS NULL AND refund_bank_name IS NULL
            AND refund_account_number IS NULL AND refund_account_holder IS NULL)
        OR
        (refund_bank_code IS NOT NULL AND refund_bank_name IS NOT NULL
            AND refund_account_number IS NOT NULL AND refund_account_holder IS NOT NULL)
    ),
    ADD CONSTRAINT ck_booking_refund_account_number CHECK (
        refund_account_number IS NULL OR refund_account_number ~ '^[0-9]{6,30}$'
    );

ALTER TABLE booking_refund
    DROP CONSTRAINT IF EXISTS ck_booking_refund_recipient_complete,
    DROP CONSTRAINT IF EXISTS ck_booking_refund_recipient_account_number;

ALTER TABLE booking_refund
    ADD CONSTRAINT ck_booking_refund_recipient_complete CHECK (
        (recipient_bank_code IS NULL AND recipient_bank_name IS NULL
            AND recipient_account_number IS NULL AND recipient_account_holder IS NULL)
        OR
        (recipient_bank_code IS NOT NULL AND recipient_bank_name IS NOT NULL
            AND recipient_account_number IS NOT NULL AND recipient_account_holder IS NOT NULL)
    ),
    ADD CONSTRAINT ck_booking_refund_recipient_account_number CHECK (
        recipient_account_number IS NULL OR recipient_account_number ~ '^[0-9]{6,30}$'
    );

COMMIT;
