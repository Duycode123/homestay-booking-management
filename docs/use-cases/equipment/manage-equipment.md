# Manage Equipment

## Metadata

- Source: Backend feature request `[BE] Xay dung API quan ly thiet bi`
- Primary actor: Admin or staff with management permission
- Current status in repo: Implemented core flow

## Goal

Allow operational users to list, inspect, create, update, and delete room equipment records used for room preparation and maintenance tracking.

## Related Endpoints

- `GET /api/admin/equipment`
- `GET /api/admin/equipment/{id}`
- `POST /api/admin/equipment`
- `PUT /api/admin/equipment/{id}`
- `DELETE /api/admin/equipment/{id}`

## Preconditions

- Caller is authenticated.
- Caller has `ADMIN` or `STAFF` permission.
- Target room exists for create and update actions.

## Main Flow

### View Equipment List

1. Manager opens equipment management.
2. Frontend requests equipment list, optionally filtered by room, type, or status.
3. Backend validates caller permission.
4. Backend returns equipment ordered by room name and equipment name.

### View Equipment Detail

1. Manager selects one equipment item.
2. Backend validates permission and equipment ID.
3. Backend returns the equipment detail payload.

### Create Equipment

1. Manager submits room, type, name, status, and notes.
2. Backend validates permission and required fields.
3. Backend verifies the target room exists.
4. Backend stores the equipment and defaults status to `GOOD` when omitted.
5. Backend returns the created equipment record.

### Update Equipment

1. Manager edits an existing equipment item.
2. Backend validates permission, target equipment, and target room.
3. Backend updates the persisted equipment record.
4. Backend returns the updated equipment payload.

### Delete Equipment

1. Manager chooses delete on one equipment item.
2. Backend validates permission and equipment existence.
3. Backend deletes the record.
4. Backend returns a success response without payload data.

## Alternate and Error Flows

- Caller lacks management permission: backend returns forbidden.
- Equipment ID does not exist: backend returns not found.
- Room ID does not exist on create or update: backend returns not found.
- Required input fields are blank or missing: backend returns bad request.

## Business Rules

- Only admin or staff roles can manage equipment.
- Equipment payloads are exposed through response DTOs, not persistence entities.
- Create flow defaults missing status to `GOOD`.
- Blank notes are normalized to `null` before persistence.

## Data Touched

- `equipment`
- `room`
- `account`

## Current Implementation Notes

- Backend implementation lives under the feature package `backend.equipment`.
- Persistence uses the existing `equipment` table and explicit mapping between JPA entity and feature model.
- Controller remains an inbound adapter while permission checks and validation live in the application service.

## Known Gaps / Follow-up

- There is no pagination yet for equipment management.
- Public room detail payload still does not embed equipment data.
- Bulk maintenance operations and audit history are not implemented.
