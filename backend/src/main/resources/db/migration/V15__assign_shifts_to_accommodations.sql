ALTER TABLE shift
    ADD COLUMN IF NOT EXISTS room_id INT REFERENCES room(id);

UPDATE shift AS work_shift
SET room_id = COALESCE(
    (
        SELECT booking.room_id
        FROM booking
        WHERE booking.checkin_staff_id = work_shift.staff_id
          AND booking.status NOT IN ('CANCELLED', 'EXPIRED')
          AND booking.start_time < work_shift.date + work_shift.end_time
          AND booking.end_time > work_shift.date + work_shift.start_time
        ORDER BY booking.start_time, booking.id
        LIMIT 1
    ),
    (
        SELECT room.id
        FROM room
        WHERE room.status <> 'INACTIVE'
        ORDER BY room.id
        LIMIT 1
    )
)
WHERE work_shift.room_id IS NULL;

ALTER TABLE staff_attendance
    ADD COLUMN IF NOT EXISTS check_in_latitude NUMERIC(9,6),
    ADD COLUMN IF NOT EXISTS check_in_longitude NUMERIC(9,6),
    ADD COLUMN IF NOT EXISTS check_in_accuracy_m NUMERIC(8,2),
    ADD COLUMN IF NOT EXISTS check_in_distance_m NUMERIC(8,2);

ALTER TABLE staff_attendance
    DROP CONSTRAINT IF EXISTS chk_attendance_check_in_coordinate_pair,
    DROP CONSTRAINT IF EXISTS chk_attendance_check_in_latitude,
    DROP CONSTRAINT IF EXISTS chk_attendance_check_in_longitude,
    DROP CONSTRAINT IF EXISTS chk_attendance_check_in_accuracy,
    DROP CONSTRAINT IF EXISTS chk_attendance_check_in_distance;

ALTER TABLE staff_attendance
    ADD CONSTRAINT chk_attendance_check_in_coordinate_pair
        CHECK (
            (check_in_latitude IS NULL AND check_in_longitude IS NULL)
            OR (check_in_latitude IS NOT NULL AND check_in_longitude IS NOT NULL)
        ),
    ADD CONSTRAINT chk_attendance_check_in_latitude
        CHECK (check_in_latitude IS NULL OR check_in_latitude BETWEEN -90 AND 90),
    ADD CONSTRAINT chk_attendance_check_in_longitude
        CHECK (check_in_longitude IS NULL OR check_in_longitude BETWEEN -180 AND 180),
    ADD CONSTRAINT chk_attendance_check_in_accuracy
        CHECK (check_in_accuracy_m IS NULL OR check_in_accuracy_m >= 0),
    ADD CONSTRAINT chk_attendance_check_in_distance
        CHECK (check_in_distance_m IS NULL OR check_in_distance_m >= 0);

CREATE INDEX IF NOT EXISTS idx_shift_room_date
    ON shift (room_id, date, start_time);

COMMENT ON COLUMN shift.room_id IS
    'The whole accommodation where this shift is performed. New approved shifts must always assign one room.';
COMMENT ON COLUMN staff_attendance.check_in_distance_m IS
    'Server-calculated Haversine distance from submitted GPS coordinates to the assigned accommodation.';
