# Staff Notifications

## Business Goal

Give staff one place to review in-app notifications assigned to their account, acknowledge them, and mark operational items as resolved.

## Actors

- Staff member

## Preconditions

- The actor is authenticated with the `STAFF` role.
- Notifications are stored in `app_notification` for the staff account.

## Main Flow

1. Staff opens the notifications screen.
2. Frontend calls `GET /api/staff/notifications`.
3. Backend verifies the signed-in account belongs to a staff profile.
4. Backend returns recent notifications for that account.
5. Staff opens a notification or clicks mark-read.
6. Frontend calls `PATCH /api/staff/notifications/{id}/read`.
7. Staff marks an item resolved.
8. Frontend calls `PATCH /api/staff/notifications/{id}/resolve`.

## Alternate/Error Flows

- If the account is not staff, the backend returns forbidden.
- If the notification does not belong to the signed-in staff account, the backend returns not found.
- If no notifications exist, the frontend shows an empty state.

## Business Rules

- Staff may only read and update notifications addressed to their own account.
- Resolving a notification also marks it as read.
- `is_read` means the notification was acknowledged.
- `is_resolved` means the notification's operational follow-up is complete.

## Related Endpoints

- `GET /api/staff/notifications`
- `PATCH /api/staff/notifications/{id}/read`
- `PATCH /api/staff/notifications/{id}/resolve`
- `PATCH /api/staff/notifications/read-all`

## Data Touched

- `account`
- `staff`
- `app_notification`

## Current Implementation Notes

- Backend implementation lives under `backend.staffnotification` with a controller, use case, and JDBC adapter.
- The staff screen now loads from the backend and uses optimistic UI updates for read/resolve actions.
- `app_notification.is_resolved` is added by `database/migrations/20260708_add_app_notification_resolved.sql`.

## Known Gaps

- The generic `app_notification` table does not yet store structured booking, room, or equipment references for rich notification cards.
- Automatic generation of staff operational reminders, such as upcoming booking setup reminders, is not implemented yet.
