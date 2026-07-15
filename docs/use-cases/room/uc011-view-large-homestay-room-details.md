# UC011 - View large homestay room details

## Business goal

Give guests a full-page view of a room, its four-image gallery, room-specific amenities, shared homestay facilities, policies, pricing and direct booking action.

## Actors

- Visitor
- Customer
- Administrator (configures room images and amenities)

## Preconditions

- The room exists and is exposed by the public room API.
- Shared amenities are active in `common_amenity`.

## Main flow

1. Guest selects a room card.
2. The system navigates to `/rooms/{roomId}`.
3. The page loads the room, up to four room images, private equipment, review summary and active common amenities.
4. The guest reviews pricing and the eight-hour minimum-stay policy.
5. If approved reviews exist, the page shows the average rating, star distribution, review content and homestay responses at the end of the detail content.
6. The guest selects `Chọn lịch và đặt phòng` to open the existing real-time schedule flow.

## Business rules

- A room supports one primary image and three secondary gallery images.
- Gallery sources should be landscape images of at least 1200x900px; 1600x1200px at 4:3 is recommended. The frontend requests responsive variants at quality 90 instead of stretching a low-resolution thumbnail.
- Existing room equipment remains room-specific.
- Shared facilities are stored independently and apply to every room.
- Admin manages shared facilities separately from room-specific equipment and may upload a representative Cloudinary image for each shared facility.
- Only shared facilities with `active = true` are exposed to guests.
- Deleting a shared facility from the admin application removes it from the catalog permanently; application startup must not seed or reactivate admin-managed facilities.
- Booking cost calculation and booking creation require at least one night, using the standard `14:00` check-in and `12:00` checkout on a later date.
- Check-in may be performed at most five minutes before the booked start time, according to the existing check-in policy.

## Related endpoints

- `GET /api/rooms/{roomId}`
- `GET /api/rooms/equipment?roomId={roomId}`
- `GET /api/rooms/common-amenities`
- `POST /api/bookings/calculate-cost`
- `POST /api/bookings`

## Data touched

- `room.image_url`, `room.image_url_2`, `room.image_url_3`, `room.image_url_4`
- `equipment`
- `common_amenity`
- `booking`

## Current implementation notes

- Admin room create/edit supports uploading all four images through the existing Cloudinary backend adapter.
- When legacy rooms do not yet have four images, the detail page shows an explicit empty gallery slot until admin uploads the missing asset.
