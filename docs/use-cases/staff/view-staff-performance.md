# Staff View Work Performance

## Metadata

- Source: Issue 276 / staff performance tracking
- Primary actor: Staff
- Supporting actors: attendance system, customer review system
- Current status in repo: Implemented core backend read-only flow

## Goal

Allow a staff member to view their own worklog summary and related customer reviews for a selected period.

## Related Endpoints

- `GET /api/staff/performance`

Query parameters:

- `fromDate`: optional ISO date, defaults to the first day of the current month.
- `toDate`: optional ISO date, defaults to today.

## Preconditions

- Caller is authenticated.
- Caller has role `STAFF`.
- Staff profile is linked to the authenticated account.

## Main Flow

1. Staff opens the performance screen.
2. Backend resolves the staff profile from the authenticated account email.
3. Backend loads attendance rows from `staff_attendance` for the selected date range.
4. Backend calculates total completed shifts, total completed work hours, late check-ins, and missing check-outs.
5. Backend loads approved customer reviews for bookings handled by that staff member through `booking.checkin_staff_id`.
6. Backend returns review list and average rating.

## Alternate and Error Flows

- Non-staff caller receives `403 Forbidden`.
- `fromDate` after `toDate` is rejected.
- No attendance or review data returns zero totals and an empty review list.

## Business Rules

- Staff can only view their own performance; `staffId` is derived from JWT/authentication.
- `totalHours` sums only `staff_attendance.work_duration_hours` rows with status `DONE`.
- `totalShifts` counts only attendance rows with status `DONE`.
- `missingCheckout` counts rows with status `MISSING_CHECKOUT`.
- `lateCount` counts attendance rows whose `check_in_time` is after the linked shift `start_time`.
- Reviews are included only when they are approved and their booking has `checkin_staff_id` equal to the current staff id.

## Data Touched

- `account`
- `staff`
- `staff_attendance`
- `shift`
- `booking`
- `review`

## Current Implementation Notes

- The feature is read-only and does not create new tables.
- Persistence is implemented with a JDBC adapter because the aggregate is a report across multiple tables.

## Known Gaps / Follow-up

- Frontend chart rendering is separate scope.
- If staff-to-review attribution later uses shift overlap rather than `booking.checkin_staff_id`, update the review query and this document together.
