INSERT INTO shift (staff_id, date, start_time, end_time, status)
SELECT registration.staff_id,
       registration.work_date,
       registration.start_time,
       registration.end_time,
       CAST('ASSIGNED' AS shift_status)
FROM staff_shift_registration registration
WHERE registration.status = 'APPROVED'
  AND NOT EXISTS (
      SELECT 1
      FROM shift existing_shift
      WHERE existing_shift.staff_id = registration.staff_id
        AND existing_shift.date = registration.work_date
        AND existing_shift.start_time = registration.start_time
        AND existing_shift.end_time = registration.end_time
  );
