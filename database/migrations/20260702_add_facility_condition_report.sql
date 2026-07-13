CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TYPE room_status ADD VALUE IF NOT EXISTS 'NEED_CLEANING';

CREATE TYPE facility_condition AS ENUM (
    'GOOD',
    'NEED_CLEANING',
    'NEED_CHECK',
    'BROKEN'
);

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
