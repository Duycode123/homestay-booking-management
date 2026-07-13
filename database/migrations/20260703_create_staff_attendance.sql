DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'attendance_status') THEN
        CREATE TYPE attendance_status AS ENUM ('WORKING', 'DONE', 'MISSING_CHECKOUT');
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS staff_attendance (
    id UUID PRIMARY KEY,
    staff_id INT NOT NULL REFERENCES staff(id),
    shift_id INT REFERENCES shift(id),
    check_in_time TIMESTAMP NOT NULL,
    check_out_time TIMESTAMP,
    work_duration_hours NUMERIC(8, 2),
    status attendance_status NOT NULL DEFAULT 'WORKING',
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now(),
    CONSTRAINT chk_staff_attendance_checkout_after_checkin
        CHECK (check_out_time IS NULL OR check_out_time > check_in_time),
    CONSTRAINT chk_staff_attendance_duration_non_negative
        CHECK (work_duration_hours IS NULL OR work_duration_hours >= 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_staff_attendance_working_shift
    ON staff_attendance(staff_id, shift_id)
    WHERE status = 'WORKING' AND shift_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_staff_attendance_staff_time
    ON staff_attendance(staff_id, check_in_time DESC);

CREATE INDEX IF NOT EXISTS idx_staff_attendance_status
    ON staff_attendance(status);
