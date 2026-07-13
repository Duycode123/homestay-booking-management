# Admin Respond To Review

## Metadata

- Source: review moderation extension from the current backend task
- Primary actor: Admin
- Current status in repo: Implemented core flow

## Goal

Allow an admin to attach one management response to an existing customer review so the feedback can be acknowledged in admin tools and public/customer-facing review payloads.

## Related Endpoints

- `GET /api/admin/reviews`
- `GET /api/admin/reviews?staffId={staffId}`
- `GET /api/admin/reviews/{id}`
- `PATCH /api/admin/reviews/{id}/approval`
- `PUT /api/admin/reviews/{id}/response`
- `DELETE /api/admin/reviews/{id}/response`
- `GET /api/reviews`
- `GET /api/reviews/rooms/{roomId}`

## Preconditions

- Caller is authenticated.
- Caller has `ADMIN` permission.
- Target review already exists.

## Main Flow

### Create Or Update Response

1. Admin opens a review detail in management UI.
2. Admin enters response content.
3. Frontend calls `PUT /api/admin/reviews/{id}/response`.
4. Backend validates admin permission and target review existence.
5. Backend creates the response if it does not exist, or updates the same row if it already exists.
6. Backend returns the updated `ReviewResponse` payload including nested `adminResponse`.

### Delete Response

1. Admin chooses to remove the management response from one review.
2. Frontend calls `DELETE /api/admin/reviews/{id}/response`.
3. Backend validates admin permission and review existence.
4. Backend deletes the existing response row.
5. Backend returns a success response without payload data.

## Alternate And Error Flows

- Caller is not an admin: backend returns forbidden.
- Review ID does not exist: backend returns not found.
- Response content is blank: backend returns bad request.
- Delete is requested for a review that has no response: backend returns not found.

## Business Rules

- Each review can have at most one admin response.
- Admin response content is trimmed before persistence.
- Review approval and admin response are separate actions.
- Public review payloads include the admin response only when the review itself is already visible through approved/public endpoints.
- Admin review listing can be filtered by `staffId` when a booking has a related check-in staff member.

## Data Touched

- `review`
- `review_response`
- `account`

## Current Implementation Notes

- The backend stores the response in a dedicated `review_response` table instead of overloading the `review` row.
- Review payloads expose the response through a nested DTO so frontend mapping can stay additive.
- The current implementation records responder role and timestamps in the response payload, while the responder account reference stays in persistence for auditability.

## Known Gaps / Follow-up

- There is no dedicated admin review UI in the current frontend source tree yet.
- Search/filter by “has response” is not implemented.
- Response edit history is not tracked; only the latest content is stored.
