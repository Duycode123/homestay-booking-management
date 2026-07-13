# Admin filter customer reviews by related staff

## Business goal

Allow an administrator to inspect customer reviews that are related to a staff member who handled the booking check-in.

## Actors

- Primary actor: Admin
- Supporting actors: customer review, booking management, staff check-in handling

## Preconditions

- Admin is authenticated with `ADMIN` role.
- Customer review exists for a completed booking.
- Booking may have `checkin_staff_id` populated.

## Main flow

1. Admin opens review management.
2. Admin filters reviews by `staffId`.
3. Backend searches reviews whose booking has `checkin_staff_id = staffId`.
4. Backend returns paged review data with related `staffId` and `staffName` when present.

## Alternate and error flows

- Review has no related check-in staff: it is excluded when `staffId` filter is supplied.
- Unknown staff id: backend returns an empty page.
- Invalid rating/page/size values follow the existing admin review validation behavior.

## Business rules

- Staff relation is derived from `booking.checkin_staff_id`.
- The review itself still belongs to the booking and customer, not directly to staff.
- Public review endpoints continue to expose only approved reviews, but may include the related staff fields when the booking has them.

## Related endpoints

- `GET /api/admin/reviews?staffId={staffId}`
- `GET /api/admin/reviews?keyword={staffName}`

## Data touched

- Reads `review`.
- Reads `booking.checkin_staff_id`.
- Reads `staff.full_name`.

## Current implementation notes

- Implemented in the legacy review service because review moderation has not yet been migrated into a feature-first hexagonal package.
- `Booking` now maps the existing `checkin_staff_id` relationship.
- `ReviewResponse` includes nullable `staffId` and `staffName`.

## Known gaps

- There is no dedicated staff performance aggregate endpoint yet.
- Reviews do not store a separate staff-specific rating or comment.
