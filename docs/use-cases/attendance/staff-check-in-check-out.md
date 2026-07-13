# Staff Check-In / Check-Out

## Business Goal

Record the real working time of staff members against their assigned shifts so payroll and reconciliation flows can use trusted attendance data.

## Actors

- Primary actor: Staff
- Supporting actors: shift management, payroll/work tracking, Spring Security JWT authorization

## Preconditions

- The staff member is authenticated.
- The authenticated account has role `STAFF`.
- A current assigned shift exists for the staff member on the current date and time.

## Main Flow: Check-In

1. Staff opens the work shift screen.
2. Staff selects check-in.
3. Backend resolves the authenticated account to its staff profile.
4. Backend finds the current shift for that staff member.
5. Backend creates a `staff_attendance` record with `check_in_time = now`, linked `staff_id`, linked `shift_id`, and status `WORKING`.
6. Backend returns the check-in confirmation time.

## Main Flow: Check-Out

1. Staff selects check-out at the end of the shift.
2. Backend resolves the authenticated account to its staff profile.
3. Backend finds the current `WORKING` attendance record for that staff member.
4. Backend sets `check_out_time = now`, calculates `work_duration_hours`, and changes status to `DONE`.
5. Backend returns the total working duration for the shift.

## Alternate And Error Flows

- Duplicate check-in: if a `WORKING` attendance already exists for the same staff and shift, backend rejects the request with `Ban da check-in ca nay`.
- Check-out before check-in: if no `WORKING` attendance exists for the staff member, backend rejects the request with `Chua co check-in cho ca hien tai`.
- No current assigned shift: check-in is rejected with `Khong tim thay ca hien tai`.
- Unauthorized role: non-`STAFF` accounts receive `403 Forbidden`.
- Missing check-out: the scheduled end-of-day job marks stale `WORKING` rows as `MISSING_CHECKOUT`.

## Business Rules

- Only role `STAFF` can check in or check out.
- Check-in must be attached to the staff member of the authenticated account.
- One staff member can have only one `WORKING` attendance row per shift.
- `work_duration_hours` is calculated from `check_out_time - check_in_time` and rounded to two decimal places.
- `check_out_time` must be after `check_in_time`.

## Related Endpoints

- `POST /api/staff/attendance/check-in`
- `POST /api/staff/attendance/check-out`

## Data Touched

- `account`: resolves authenticated user and role.
- `staff`: resolves the staff profile for the authenticated account.
- `shift`: finds the current assigned staff shift.
- `staff_attendance`: stores check-in/check-out timestamps, calculated duration, and attendance lifecycle status.

## Current Implementation Notes

- Implemented in the backend `attendance` feature package with hexagonal boundaries:
  - inbound adapter: `StaffAttendanceController`
  - application use cases: `CheckInShiftUseCase`, `CheckOutShiftUseCase`
  - outbound ports: actor, shift, and attendance persistence ports
  - outbound adapter: JDBC adapter for existing schema tables
- The scheduled missing-checkout sweep runs with property `app.attendance.missing-checkout-cron`, defaulting to `0 55 23 * * *`.

## Known Gaps

- Admin screens for manually resolving `MISSING_CHECKOUT` records are not implemented yet.
- Payroll summary UC021 can consume `staff_attendance`, but the payroll aggregation endpoint is separate scope.
