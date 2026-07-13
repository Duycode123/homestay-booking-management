# Room Performance Report

## Business Goal

Allow an administrator to identify popular rooms and underused rooms by counting successful bookings per room within a selected date range.

## Actors

- Administrator

## Preconditions

- The administrator is authenticated.
- Room and booking data exist in the database.
- The database has already been migrated to the English schema.

## Main Flow

1. The administrator opens `/admin/dashboard` or requests the room performance report with optional `startDate` and `endDate`.
2. If the caller omits dates, the system defaults to the last 30 days ending on the current business date.
3. The system validates that `endDate` is not before `startDate`.
4. The system converts the effective dates into an inclusive day window based on `booking.start_time`.
5. The system counts successful bookings for each room in that window.
6. The system sorts rooms by successful booking count in descending order.
7. The system returns the requested date range, total successful bookings, and the ranked room list.

## Alternate And Error Flows

- If `endDate` is before `startDate`, the request is rejected.
- If there are no successful bookings in the selected window, rooms are still returned with `0` counts.

## Business Rules

- Successful bookings are bookings that have completed payment successfully, represented by status `PAID`, `CHECKED_IN`, or `COMPLETED`.
- Cancelled bookings and unpaid pending bookings do not count.
- The date range is inclusive for both `startDate` and `endDate`.
- The current implementation evaluates the range against `booking.start_time`.
- All rooms are included in the ranking, even if they have zero successful bookings.
- Ties are ordered by room name ascending for deterministic output.

## Related Endpoints

- `GET /api/admin/reports/room-performance?startDate={ISO_DATE}&endDate={ISO_DATE}`

## Data Touched

- `room`
- `room_tier`
- `booking`

## Current Implementation Notes

- The use case lives under `backend.report`.
- The controller entry point is `AdminReportController`.
- Persistence uses a PostgreSQL aggregation query through `JdbcTemplate`.
- The query uses `LEFT JOIN` from `room` to `booking` so rooms with zero successful bookings remain visible in the report.
- The admin dashboard filters out zero-booking rooms when drawing the "top rooms" chart so the visualization stays focused.

## Known Gaps

- The current endpoint only ranks rooms by successful booking count; it does not include occupancy rate or cancellation rate.
- The current endpoint does not compare the selected period against a previous period.
- The current endpoint does not expose pagination because the room list is expected to stay small in the current product scope.
