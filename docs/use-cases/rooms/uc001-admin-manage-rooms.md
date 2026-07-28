# UC001 - Admin Manage Rooms And Room Tiers

## Metadata

- Source: Admin operations flow normalized from current repo behavior
- Primary actor: Administrator
- Current status in repo: Implemented with scoped backend fields

## Goal

Allow an administrator to create, update, change status, and archive homestay rooms and the room tiers used by the booking system.

## Related Endpoints

- `POST /api/rooms`
- `PUT /api/rooms/{id}`
- `PATCH /api/rooms/{id}/status?status={ROOM_STATUS}`
- `DELETE /api/rooms/{id}`
- `POST /api/admin/room-images`
- `GET /api/room-types`
- `GET /api/room-types/{id}`
- `POST /api/room-types`
- `PUT /api/room-types/{id}`
- `DELETE /api/room-types/{id}`

## Preconditions

- The caller is authenticated.
- The caller has role `ADMIN`.
- A valid room type already exists before create or update.
- Room tier mutations require an authenticated administrator.

## Main Flow

1. Admin opens the room management screen.
2. Frontend loads room list and room type list from backend.
3. Admin may upload a JPG, PNG, or WebP room image from the form.
4. Frontend checks file type, size, and pixel dimensions before upload; backend repeats the validation as the authoritative boundary.
5. Backend uploads the original image bytes to Cloudinary without a destructive resize and returns a secure URL.
6. Admin creates or edits a room by sending room name, room type, capacity, sleeping layout, location, whole-unit nightly rate, image URLs, and room status.
7. Backend validates permissions, room existence, room type existence, duplicate room names, capacity range, and image URL shape.
8. Backend persists the change and returns the updated room DTO.
9. Admin may update room status directly from the list.
10. Admin may remove a room from the active catalog when it has no active booking. The backend archives the room instead of deleting operational history.
11. Admin may create, update, or delete room tiers by sending tier name, hourly rate, and description.
12. Backend validates permissions, tier existence, duplicate tier names, hourly rate, and whether a tier still has active rooms before archiving it.

## Alternate and Error Flows

- Non-admin caller: backend returns forbidden.
- Missing room or room type: backend returns not found.
- Duplicate room name: backend rejects the mutation.
- Invalid capacity: backend rejects the mutation.
- Invalid image upload: backend rejects the upload before calling Cloudinary.
- Landscape image below 1200x900 resolution or above 12MB: frontend explains the required quality and backend rejects any bypass attempt.
- Missing Cloudinary configuration: backend rejects the upload and leaves room data unchanged.
- Delete requested for a room with a booking in `PENDING_PAYMENT`, `DEPOSIT_PAID`, `PAID`, or `CHECKED_IN`: backend rejects the operation.
- Completed and cancelled bookings do not block room archiving; their history remains linked to the archived room.
- Duplicate room tier name: backend rejects the mutation.
- Invalid room tier hourly rate: backend rejects the mutation.
- Delete requested for a room tier that still has a non-archived room: backend rejects the operation and tells the admin to archive or reassign those rooms first.

## Business Rules

- Only administrators can mutate room data.
- Room names must remain unique.
- Room maximum capacity is stored per room and must be between 1 and 100.
- The whole-unit nightly rate and room-tier hourly rate accept any positive amount; neither value is restricted to a 1,000 or 50,000 VND increment.
- Room image URLs are stored as HTTP(S) URLs after Cloudinary upload.
- Room images must be landscape JPG, PNG, or WebP, at most 12MB, and at least 1200x900px. A 1600x1200px source with a 4:3 ratio is recommended for the room-detail gallery.
- The database stores only the Cloudinary URL or safe static asset path. It does not contain or improve the underlying image pixels.
- Static project assets are also supported through safe `/images/rooms/...` paths. Windows paths, `file://` URLs and paths outside this public directory are rejected.
- Cloudinary credentials stay server-side; the frontend uploads through the backend admin endpoint.
- Room status is backend-owned and uses the `room_status` enum.
- Removing a room is a soft-delete operation: its status becomes `INACTIVE`, it disappears from the default catalog, and historical bookings, payments, reviews, equipment, and reports remain intact.
- Only active booking states block room archiving. `COMPLETED` and `CANCELLED` bookings are historical and do not block it.
- Room tier names must remain unique.
- Room tier hourly rates must be greater than zero.
- Removing a room tier is a soft-delete operation through `room_tier.active = false`.
- A room tier cannot be archived while a room whose status is not `INACTIVE` still references it.
- Room creation/reassignment and room-tier update/archive serialize on the same `room_tier` row. After acquiring the lock, the backend rechecks that the tier is still active, so a concurrent archive cannot leave a new room attached to an inactive tier.

## Data Touched

- `room`
- `room_tier`
- `booking`
- `equipment`

## Current Implementation Notes

- Current backend persistence for room management is intentionally narrow.
- The mutation flow persists the room identity, tier, capacity and sleeping layout, homestay location, whole-unit nightly rate, image gallery, and operational status.
- Room tier CRUD persists `room_tier.name`, `room_tier.description`, and `room_tier.hourly_rate`.
- Archived rooms use `room.status = INACTIVE`; archived tiers use `room_tier.active = false` and are excluded from default catalog queries.
- Generated room code and equipment summaries remain display-oriented; the nightly rate is backend-owned and persisted in `room.base_nightly_rate`.
- Application logic lives in `RoomUseCaseService` and is exposed through `RoomController` and `RoomTypeController`.
- Room mutations use pessimistic row locks for the affected room and room tier; this prevents lost updates and closes the create-room-versus-archive-tier check-then-write race.
- Cloudinary upload orchestration lives in `RoomImageUploadUseCaseService` and is exposed through `AdminRoomImageController`.

## Known Gaps / Follow-up

- If product scope requires editable description or richer room metadata, add schema fields and explicit commands instead of relying on frontend-only state.
- Consider adding dedicated audit history for room status changes if operations need traceability.
