# Manage Multi-location Whole-unit Accommodations

## Business goal

Operate The Serene Villa as a collection of whole accommodations distributed
across Hà Nội while keeping one consistent booking, payment, review, and staff
workflow.

## Actors

- Customer: searches, views the map, books, pays for, and reviews a whole accommodation.
- Admin: creates the accommodation, maintains its address and price, and assigns staff shifts.
- Staff: sees the assigned accommodation, serves only its bookings, and checks in on location.

## Preconditions

- A room tier exists for pricing/category presentation.
- Every accommodation used for booking has a positive nightly rate.
- Every accommodation used for staff assignment has latitude, longitude, and a valid check-in radius.
- The customer or staff member is authenticated where the existing endpoint requires it.

## Main customer flow

1. The customer opens the accommodation catalog.
2. The system lists active whole accommodations and allows filtering by district.
3. The customer switches between list and map views.
4. Each map marker and card shows the accommodation name, area, image, capacity, internal bedroom/bathroom details, and nightly price.
5. The customer opens one accommodation, reviews its exact address and map, then chooses a stay period.
6. Availability is checked against that accommodation's existing `room_id`.
7. The existing booking, QR payment, hold release, favorite, notification, and review flows continue without a second inventory level.

## Main administration flow

1. The admin creates or edits one accommodation.
2. The admin enters its type, whole-unit nightly price, internal bedroom/bed/bathroom counts, address, coordinates, and staff check-in radius.
3. The system validates coordinate ranges, positive price, and capacity fields.
4. The accommodation becomes searchable and visible on the map according to its operational status.
5. When approving a staff shift registration, the admin must select the accommodation that the employee will cover.

## Main staff flow

1. The employee opens the approved weekly schedule.
2. The schedule shows the assigned accommodation and its address.
3. Booking details for the shift include only bookings of that assigned accommodation that overlap the shift window.
4. At check-in, the browser submits GPS coordinates and reported accuracy.
5. The server calculates the distance to the assigned accommodation.
6. Check-in succeeds only when the employee is inside the configured radius.
7. Check-out completes the existing attendance record and payroll continues to use the recorded working duration.

## Alternate and error flows

- No coordinates on an accommodation: it cannot be selected for a new approved shift.
- Staff outside the allowed radius: check-in is rejected and no attendance row is created.
- Location permission denied: the client explains that GPS permission is required.
- Archived accommodation: it is hidden from the active customer catalog and cannot receive new shift assignments.
- Overlapping customer booking: the existing PostgreSQL exclusion constraint rejects the overlap.
- Overlapping employee shift: the existing advisory lock and overlap constraint reject the assignment.
- Historical shift without `room_id`: it remains readable for migration compatibility but cannot pass location-based check-in.

## Business rules

1. One `room` row is one independently bookable whole accommodation.
2. Bedrooms, beds, and bathrooms are descriptive attributes, not separate inventory.
3. A booking always reserves the entire selected accommodation.
4. The price is `base_nightly_rate × number of calendar nights`; one night runs from 14:00 to 12:00 the next day.
5. One approved shift is associated with exactly one accommodation in new application flows.
6. Booking visibility during a shift is restricted to the assigned accommodation.
7. The backend, not the browser, is authoritative for attendance distance validation.
8. Existing business records remain linked by `room_id`; no duplicate property/room hierarchy is introduced.

## Related endpoints

- `GET /api/rooms?district=&search=`
- `GET /api/rooms/{roomId}`
- `POST /api/rooms`
- `PUT /api/rooms/{roomId}`
- `PATCH /api/admin/shift-registrations/{registrationId}/decision`
- `GET /api/staff/schedule/shifts`
- `GET /api/staff/schedule/shifts/{shiftId}/bookings`
- `POST /api/staff/attendance/check-in`
- `POST /api/staff/attendance/check-out`

## Data touched

- `room`
- `booking`
- `shift`
- `staff_shift_registration`
- `staff_attendance`

## Current implementation notes

- The current bounded context retains the historical `Room` name in code and
  database to avoid breaking production relationships. In customer-facing copy
  it is treated as an accommodation/stay.
- Location and attendance rules are implemented behind existing application
  use cases and outbound ports; controllers only map HTTP data.
- Migrations:
  - `V14__multi_location_whole_unit_stays.sql`
  - `V15__assign_shifts_to_accommodations.sql`

## Known gaps

- Coordinates are currently entered by the admin; address geocoding/autocomplete is not yet integrated.
- Travel-time and distance sorting from the customer's live position are not yet implemented.
- A shift covers one accommodation. Multi-stop routes for one employee are intentionally outside the current project scope.
