# Report Customer Issue

## Metadata

- Source: Normalized from current frontend support flow and backend controller contract
- Primary actor: Customer
- Supporting actor: Admin
- Current status in repo: Implemented core flow and admin triage

## Related Endpoints

- `POST /api/customer/report-issue`
- `GET /api/admin/incident-reports`
- `GET /api/admin/incident-reports/{reportId}`
- `PATCH /api/admin/incident-reports/{reportId}/status`

## Goal

Allow an authenticated customer to submit a support issue that the backend can track, optionally linked to one booking they own.

## Preconditions

- Customer is authenticated.
- Customer profile exists and is linked to the authenticated account.

## Main Flow

1. Customer opens the report-issue page.
2. Frontend loads the customer's existing bookings to help them choose a valid booking code.
3. Customer selects an issue type and enters a description.
4. Customer may include one booking code that belongs to them.
5. Backend validates the issue type, description, and optional booking ownership.
6. Backend stores the issue with `OPEN` status and returns the created report summary.

## Admin Triage Flow

1. Admin opens the incident reports page.
2. Frontend requests issue reports from `GET /api/admin/incident-reports` with optional filters.
3. Backend returns customer, booking, room, status, priority, and submitted time details.
4. Admin opens a report detail.
5. Admin changes status and optionally writes an admin note.
6. Backend persists status/admin note and returns the updated report.

## Alternate and Error Flows

- Customer profile is missing: backend returns not found.
- Issue type is missing or invalid: backend rejects the request.
- Description is blank or longer than 1000 characters: backend rejects the request.
- Booking code format is invalid: backend rejects the request.
- Booking code refers to another customer's booking: backend returns not found for the owned-booking lookup.

## Business Rules

- Customers can link an issue only to a booking they own.
- Booking linkage is optional.
- Allowed issue types are `ROOM`, `EQUIPMENT`, `PAYMENT`, `ACCOUNT`, and `OTHER`.
- New issue reports start in `OPEN` status.
- Admin UI represents `OPEN` as `NEW`.
- Admin can update reports to `OPEN`, `IN_PROGRESS`, `RESOLVED`, or `CLOSED`.
- Admin note is optional and limited to 1000 characters.

## Data Touched

- `Customer`
- `Booking`
- `CustomerIssueReport`
- `customer_issue_report.admin_note`

## Current Implementation Notes

- The backend persists reports in `customer_issue_report`.
- Status is stored explicitly as a small lifecycle string rather than inferred from frontend UI state.
- Admin incident reports page reads from backend data rather than mock data.
- Priority is currently derived from issue type for admin filtering and display.

## Known Gaps / Follow-up

- Notifications, SLA tracking, and attachments are not implemented.
- Admin note is stored, but there is no separate status history/audit table yet.
