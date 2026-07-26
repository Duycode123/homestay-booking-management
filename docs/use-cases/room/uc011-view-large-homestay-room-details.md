# UC011 - View large homestay room details

## Business goal

Give guests a full-page view of a homestay, its four-image gallery, in-home amenities, location-specific included amenities, policies, pricing and direct booking action.

## Actors

- Visitor
- Customer
- Administrator (configures room images and amenities)

## Preconditions

- The room exists and is exposed by the public room API.
- Included amenities are active in `common_amenity` and assigned to the requested homestay through `room_included_amenity`.

## Main flow

1. Guest selects a room card.
2. The system navigates to `/rooms/{roomId}`.
3. The page loads the homestay, up to four images, in-home equipment, review summary and only the active included amenities assigned to that homestay.
4. The guest reviews pricing and the eight-hour minimum-stay policy.
5. If approved reviews exist, the page shows the average rating, star distribution, review content and homestay responses at the end of the detail content.
6. The guest selects `Chọn lịch và đặt phòng` to open the existing real-time schedule flow.

## Business rules

- A room supports one primary image and three secondary gallery images.
- Gallery sources should be landscape images of at least 1200x900px; 1600x1200px at 4:3 is recommended. The frontend requests responsive variants at quality 90 instead of stretching a low-resolution thumbnail.
- Existing equipment remains specific to the bookable homestay.
- Included amenities are reusable catalog definitions but do not automatically apply to every homestay.
- Each included amenity must be assigned to at least one valid homestay.
- Admin manages included amenities separately from in-home equipment, chooses their homestay assignments and may upload one representative Cloudinary image.
- The detail page exposes only amenities with `active = true` that are assigned to the requested homestay.
- The amenities overview may list the active catalog across locations, but its copy must state that availability varies by homestay.
- Deleting an included amenity from the admin application removes its assignments through the database foreign-key cascade. Application startup must not seed or reactivate admin-managed amenity definitions.
- Booking cost calculation and booking creation require at least one night, using the standard `14:00` check-in and `12:00` checkout on a later date.
- Check-in may be performed at most five minutes before the booked start time, according to the existing check-in policy.

## Related endpoints

- `GET /api/rooms/{roomId}`
- `GET /api/rooms/equipment?roomId={roomId}`
- `GET /api/rooms/common-amenities?roomId={roomId}`
- `GET /api/rooms/common-amenities` (cross-location overview)
- `POST /api/bookings/calculate-cost`
- `POST /api/bookings`

## Data touched

- `room.image_url`, `room.image_url_2`, `room.image_url_3`, `room.image_url_4`
- `equipment`
- `common_amenity`
- `room_included_amenity`
- `booking`

## Current implementation notes

- Admin room create/edit supports uploading all four images through the existing Cloudinary backend adapter.
- When legacy rooms do not yet have four images, the detail page shows an explicit empty gallery slot until admin uploads the missing asset.
- Migration `V17__scope_included_amenities_by_homestay.sql` assigns existing amenity definitions to existing homestays once to preserve the previous customer-visible data. Future assignments are managed explicitly by admin.
