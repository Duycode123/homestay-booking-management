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
