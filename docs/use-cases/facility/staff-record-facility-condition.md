# Staff Record Facility Condition

## Metadata

- Source: Issue 264 / facility condition tracking
- Primary actor: Staff
- Supporting actors: room management, equipment management, maintenance workflow
- Current status in repo: Implemented core backend flow

## Goal

Allow staff to update room operational status and record room/equipment condition after customer use so admins have an auditable source for quality control and maintenance follow-up.

## Related Endpoints

- `POST /api/staff/facility/rooms/{roomId}/status`
- `POST /api/staff/facility/rooms/{roomId}/condition`
- `POST /api/staff/facility/equipment/{equipmentId}/condition`
- `GET /api/admin/facility/condition-reports`
- `PATCH /api/admin/facility/condition-reports/{reportId}/status`

## Preconditions

- Staff is authenticated with role `STAFF`.
- Room or equipment exists.
- Admin history endpoint requires role `ADMIN`.

## Main Flow

### Update Room Status

1. Staff selects a room.
2. Staff submits the new room status: `AVAILABLE`, `IN_USE`, `NEED_CLEANING`, or `MAINTENANCE`.
3. Backend updates `room.status`.
4. Backend writes a `facility_condition_report` audit row with staff, room, derived condition, optional note/image, and timestamp.

### Record Room Condition

1. Staff submits room condition: `GOOD`, `NEED_CLEANING`, `NEED_CHECK`, or `BROKEN`.
2. Backend validates note requirements.
3. Backend maps the condition to the room status and updates `room.status`.
4. Backend stores the audit row.

### Record Equipment Condition

1. Staff selects one equipment item.
2. Staff submits condition and optional note/image.
3. Backend validates note requirements.
4. Backend updates `equipment.status`: `GOOD`, `MAINTENANCE`, or `BROKEN`.
5. Backend stores the audit row and marks `maintenance_suggested = true` when condition is `BROKEN`.

### Admin Handle Condition Report

1. Admin opens the facility report history.
2. Backend returns condition reports with handling status and admin notes.
3. Admin updates the handling status to `OPEN`, `IN_PROGRESS`, `RESOLVED`, or `CLOSED`.
4. Backend stores the admin note and sets `resolved_at` when the report is resolved or closed.

## Alternate and Error Flows

- Non-staff caller: rejected by security with `403 Forbidden`.
- Missing room/equipment: backend returns not found.
- `BROKEN` without note: backend rejects the request.
- Note longer than 500 characters: backend rejects the request.
- Invalid image URL: backend rejects the request.

## Business Rules

- `BROKEN` always requires a note.
- `BROKEN` creates a maintenance suggestion via `facility_condition_report.maintenance_suggested = true`.
- New facility reports start with handling status `OPEN`.
- `RESOLVED` and `CLOSED` set `resolved_at`; moving back to `OPEN` or `IN_PROGRESS` clears it.
- Room condition sync:
  - `GOOD -> AVAILABLE`
  - `NEED_CLEANING -> NEED_CLEANING`
  - `NEED_CHECK` or `BROKEN -> MAINTENANCE`
- Equipment condition sync:
  - `GOOD -> GOOD`
  - `NEED_CHECK` or `NEED_CLEANING -> MAINTENANCE`
  - `BROKEN -> BROKEN`

## Data Touched

- `room.status`
- `equipment.status`
- `equipment.notes`
- `facility_condition_report`
- `facility_condition_report.status`
- `facility_condition_report.admin_note`
- `facility_condition_report.resolved_at`
- `staff` resolved from authenticated account

## Current Implementation Notes

- The backend records audit rows through a JDBC adapter because the table is purpose-built for operational logs and already exists in SQL migration form.
- Current code verifies the caller is a staff account for staff writes. Admin history and status updates are protected by `/api/admin/**` security.
- Admin can update facility report handling status without changing the original audit facts.
- The staff flow does not yet enforce that the selected room belongs to the staff member's active shift because the current shift schema does not directly assign rooms.

## Known Gaps / Follow-up

- Add explicit staff-shift-to-room assignment if the product requires hard rejection outside a staff member's room scope.
- UC013 maintenance scheduling can consume `maintenance_suggested = true` reports to create maintenance tasks or lock rooms.
