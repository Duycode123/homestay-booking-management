-- Bootstrap missing repo-owned PostgreSQL schema additions before Hibernate validates.
-- This keeps local development databases aligned with the latest migrations when they
-- are only missing the recent payment/coupon/support tables.

ALTER TABLE account
    ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS email_verification_token_hash VARCHAR(64),
    ADD COLUMN IF NOT EXISTS email_verification_expires_at TIMESTAMP,
    ADD COLUMN IF NOT EXISTS email_verification_sent_at TIMESTAMP;

CREATE UNIQUE INDEX IF NOT EXISTS ux_account_email_verification_token_hash
    ON account(email_verification_token_hash)
    WHERE email_verification_token_hash IS NOT NULL;

UPDATE account
SET email_verified = true
WHERE email_verified = false
  AND email_verification_token_hash IS NULL
  AND email_verification_expires_at IS NULL;

ALTER TYPE payment_provider ADD VALUE IF NOT EXISTS 'SEPAY';
ALTER TYPE payment_provider ADD VALUE IF NOT EXISTS 'COUNTER';

ALTER TABLE room
    ADD COLUMN IF NOT EXISTS max_people INT;

UPDATE room
SET max_people = 2
WHERE max_people IS NULL;

ALTER TABLE room
    ALTER COLUMN max_people SET DEFAULT 2,
    ALTER COLUMN max_people SET NOT NULL;

ALTER TABLE room
    DROP CONSTRAINT IF EXISTS chk_room_max_people_range;

ALTER TABLE room
    ADD CONSTRAINT chk_room_max_people_range
    CHECK (max_people BETWEEN 1 AND 100);

ALTER TABLE room
    ADD COLUMN IF NOT EXISTS image_url VARCHAR(500);

ALTER TABLE room
    DROP CONSTRAINT IF EXISTS chk_room_image_url_length;

ALTER TABLE room
    ADD CONSTRAINT chk_room_image_url_length
    CHECK (image_url IS NULL OR char_length(image_url) <= 500);

ALTER TABLE account
    ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(500);

ALTER TABLE account
    DROP CONSTRAINT IF EXISTS chk_account_avatar_url_length;

ALTER TABLE account
    ADD CONSTRAINT chk_account_avatar_url_length
    CHECK (avatar_url IS NULL OR char_length(avatar_url) <= 500);

CREATE TABLE IF NOT EXISTS user_notification_settings (
    id SERIAL PRIMARY KEY,
    account_id INT NOT NULL REFERENCES account(id) ON DELETE CASCADE,
    new_booking BOOLEAN NOT NULL DEFAULT TRUE,
    booking_reminder BOOLEAN NOT NULL DEFAULT TRUE,
    shift_reminder BOOLEAN NOT NULL DEFAULT TRUE,
    room_issue BOOLEAN NOT NULL DEFAULT TRUE,
    equipment_issue BOOLEAN NOT NULL DEFAULT TRUE
);

DELETE FROM user_notification_settings newer
USING user_notification_settings older
WHERE newer.account_id = older.account_id
  AND newer.id > older.id;

DO 'BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = ''uk_user_notification_settings_account_id'') THEN ALTER TABLE user_notification_settings ADD CONSTRAINT uk_user_notification_settings_account_id UNIQUE (account_id); END IF; END';

CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TYPE room_status ADD VALUE IF NOT EXISTS 'NEED_CLEANING';

DO 'BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = ''facility_condition'') THEN CREATE TYPE facility_condition AS ENUM (''GOOD'', ''NEED_CLEANING'', ''NEED_CHECK'', ''BROKEN''); END IF; END';

CREATE TABLE IF NOT EXISTS facility_condition_report (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_id INT NOT NULL REFERENCES staff(id),
    room_id INT NOT NULL REFERENCES room(id),
    equipment_id INT REFERENCES equipment(id),
    condition facility_condition NOT NULL,
    note VARCHAR(500),
    image_url VARCHAR(500),
    maintenance_suggested BOOLEAN NOT NULL DEFAULT false,
    room_status_after_update room_status,
    status VARCHAR(30) NOT NULL DEFAULT 'OPEN',
    admin_note VARCHAR(1000),
    resolved_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    CONSTRAINT chk_facility_condition_report_broken_note
        CHECK (
            condition <> 'BROKEN'
            OR (note IS NOT NULL AND btrim(note) <> '')
        ),
    CONSTRAINT chk_facility_condition_report_note_length
        CHECK (note IS NULL OR char_length(note) <= 500),
    CONSTRAINT chk_facility_condition_report_image_url_length
        CHECK (image_url IS NULL OR char_length(image_url) <= 500)
);

ALTER TABLE facility_condition_report
    ADD COLUMN IF NOT EXISTS status VARCHAR(30) NOT NULL DEFAULT 'OPEN',
    ADD COLUMN IF NOT EXISTS admin_note VARCHAR(1000),
    ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMP;

ALTER TABLE facility_condition_report
    DROP CONSTRAINT IF EXISTS chk_facility_condition_report_status;

ALTER TABLE facility_condition_report
    ADD CONSTRAINT chk_facility_condition_report_status
    CHECK (status IN ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'));

ALTER TABLE facility_condition_report
    DROP CONSTRAINT IF EXISTS chk_facility_condition_report_admin_note_length;

ALTER TABLE facility_condition_report
    ADD CONSTRAINT chk_facility_condition_report_admin_note_length
    CHECK (admin_note IS NULL OR char_length(admin_note) <= 1000);

CREATE INDEX IF NOT EXISTS idx_facility_condition_report_room_created_at
    ON facility_condition_report (room_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_facility_condition_report_equipment_created_at
    ON facility_condition_report (equipment_id, created_at DESC)
    WHERE equipment_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_facility_condition_report_staff_created_at
    ON facility_condition_report (staff_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_facility_condition_report_maintenance
    ON facility_condition_report (maintenance_suggested, created_at DESC)
    WHERE maintenance_suggested = true;

CREATE TABLE IF NOT EXISTS app_notification (
    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    recipient_id INT NOT NULL REFERENCES account(id),
    type VARCHAR(60) NOT NULL,
    title VARCHAR(150) NOT NULL,
    content TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT false,
    is_resolved BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_app_notification_recipient_created_at
    ON app_notification(recipient_id, created_at DESC);

ALTER TABLE app_notification
    ADD COLUMN IF NOT EXISTS is_resolved BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS customer_issue_report (
    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    customer_id INT NOT NULL REFERENCES customer(id),
    booking_id INT REFERENCES booking(id),
    issue_type VARCHAR(30) NOT NULL,
    description VARCHAR(1000) NOT NULL,
    admin_note VARCHAR(1000),
    status VARCHAR(30) NOT NULL DEFAULT 'OPEN',
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now(),
    CONSTRAINT chk_customer_issue_report_issue_type
        CHECK (issue_type IN ('ROOM', 'EQUIPMENT', 'PAYMENT', 'ACCOUNT', 'OTHER')),
    CONSTRAINT chk_customer_issue_report_status
        CHECK (status IN ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED')),
    CONSTRAINT chk_customer_issue_report_description_not_blank
        CHECK (btrim(description) <> '')
);

CREATE INDEX IF NOT EXISTS idx_customer_issue_report_customer_created_at
    ON customer_issue_report (customer_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_customer_issue_report_booking_id
    ON customer_issue_report (booking_id);

CREATE TABLE IF NOT EXISTS coupon_usage (
    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    discount_code_id INT NOT NULL REFERENCES discount_code(id),
    customer_id INT NOT NULL REFERENCES customer(id),
    booking_id INT NOT NULL UNIQUE REFERENCES booking(id),
    discount_amount NUMERIC(12,2) NOT NULL CHECK (discount_amount >= 0),
    used_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_coupon_usage_discount_code_used_at
    ON coupon_usage(discount_code_id, used_at);

CREATE INDEX IF NOT EXISTS idx_coupon_usage_customer_used_at
    ON coupon_usage(customer_id, used_at);

DO 'BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = ''shift_registration_status'') THEN CREATE TYPE shift_registration_status AS ENUM (''PENDING'', ''APPROVED'', ''REJECTED''); END IF; END';

CREATE TABLE IF NOT EXISTS staff_shift_registration (
    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    staff_id INT NOT NULL REFERENCES staff(id),
    work_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status shift_registration_status NOT NULL DEFAULT 'PENDING',
    reviewed_by_account_id INT REFERENCES account(id),
    reviewed_at TIMESTAMP,
    rejection_reason VARCHAR(500),
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now(),
    CONSTRAINT chk_staff_shift_registration_time_range
        CHECK (start_time < end_time),
    CONSTRAINT chk_staff_shift_registration_decision_fields
        CHECK (
            (
                status = 'PENDING'
                AND reviewed_by_account_id IS NULL
                AND reviewed_at IS NULL
                AND rejection_reason IS NULL
            )
            OR (
                status = 'APPROVED'
                AND reviewed_by_account_id IS NOT NULL
                AND reviewed_at IS NOT NULL
                AND rejection_reason IS NULL
            )
            OR (
                status = 'REJECTED'
                AND reviewed_by_account_id IS NOT NULL
                AND reviewed_at IS NOT NULL
                AND rejection_reason IS NOT NULL
                AND btrim(rejection_reason) <> ''
            )
        )
);

CREATE INDEX IF NOT EXISTS idx_staff_shift_registration_staff_date
    ON staff_shift_registration(staff_id, work_date, start_time);

CREATE INDEX IF NOT EXISTS idx_staff_shift_registration_status_date
    ON staff_shift_registration(status, work_date, start_time);

CREATE UNIQUE INDEX IF NOT EXISTS ux_staff_shift_registration_exact_active_slot
    ON staff_shift_registration(staff_id, work_date, start_time, end_time)
    WHERE status IN ('PENDING', 'APPROVED');
