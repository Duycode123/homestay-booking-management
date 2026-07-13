# Revenue Usage Report

## Business Goal

Allow an administrator to review revenue and room usage frequency over time so they can evaluate business performance.

## Actors

- Administrator

## Preconditions

- The administrator is authenticated.
- Booking data exists in the `booking` table.
- The database has already been migrated to the English schema.

## Main Flow

1. The administrator opens `/admin/dashboard` or requests the report API with an optional `startDate`, `endDate`, and `bucket`.
2. If the caller omits the dates, the system defaults to the last 30 days ending on the current business date.
3. The system resolves the effective date window and validates that the start is before the end.
4. The system aggregates reportable bookings by time bucket.
5. The system aggregates usage by room.
6. The system returns total revenue, total booking count, total usage hours, period breakdowns, and room breakdowns.

## Alternate/Error Flows

- If only one of `from` or `to` is provided, the request is rejected.
- If the effective start is not before the effective end timestamp, the request is rejected.
- If the requested range is too large for the selected bucket, the request is rejected.
- If there are no reportable bookings, totals are returned as zero and breakdown lists are empty.

## Business Rules

- Reportable bookings are bookings that have completed payment successfully, represented by status `PAID`, `CHECKED_IN`, or `COMPLETED`.
- Cancelled and unpaid pending bookings do not count toward revenue or usage.
- Revenue is calculated from `booking.total_price`.
- Usage hours are calculated from `booking.end_time - booking.start_time`.
- Supported time buckets are `DAY`, `WEEK`, and `MONTH`.

## Related Endpoints

- `GET /api/admin/reports/revenue-usage?startDate={ISO_DATE}&endDate={ISO_DATE}&bucket=DAY`
- `GET /api/admin/reports/revenue-usage?from={ISO_DATE_TIME}&to={ISO_DATE_TIME}&bucket=DAY` for legacy exact timestamp callers

## Data Touched

- `booking`
- `room`
- `room_tier`

## Current Implementation Notes

- The use case lives under `backend.report`.
- The web adapter is `AdminReportController`.
- Persistence uses a PostgreSQL aggregation query through `JdbcTemplate`.
- `database/migrations/20260702_optimize_reporting_indexes.sql` adds supporting report indexes and a daily materialized view (`report_daily_booking_summary`) for day-aligned analytics.
- The endpoint is covered by the existing `/api/admin/**` security rule and requires an admin role.
- The Next.js admin dashboard also applies a route-level admin guard before rendering any chart.

## Known Gaps

- The current report groups bookings by booking start time.
- The current endpoint still reads raw `booking` rows instead of the daily materialized view so arbitrary timestamp ranges remain exact.
- The current report does not split a single booking across multiple time buckets.
- The current report does not compare against previous periods.
