# Staff Customer Lookup

## Business Goal

Give staff a quick view of customers who have booking history, including contact details, recent bookings, and simple service context before supporting them at the studio.

## Actors

- Staff member

## Preconditions

- The actor is authenticated with the `STAFF` role.
- Customers exist through booking records.

## Main Flow

1. Staff opens the customer screen.
2. The frontend calls `GET /api/staff/customers`.
3. The backend verifies the signed-in account is a staff account.
4. The backend loads recent booking rows with customer and room data.
5. The use case groups bookings by customer and returns a customer summary with recent bookings.
6. Staff can filter or open a customer profile on the frontend.

## Alternate/Error Flows

- If the signed-in user is not a staff account, the backend returns a forbidden response.
- If no booking rows exist, the backend returns an empty list.

## Business Rules

- Customer type is currently derived from booking count:
  - `NEW`: 1 booking
  - `RETURNING`: 2 to 19 bookings
  - `VIP`: 20 or more bookings
- A customer is marked as having a booking today when any booking date equals the server's current date.
- Favorite room is derived from the room with the highest booking count in the loaded rows.

## Related Endpoints

- `GET /api/staff/customers`

## Data Touched

- `account`
- `staff`
- `customer`
- `booking`
- `room`

## Current Implementation Notes

- Backend implementation lives under `backend.staffcustomer` with a controller, use case, and JDBC query adapter.
- The endpoint returns customer summaries and recent bookings only.
- Frontend internal notes remain local-only because the database does not currently include a customer-note table.

## Known Gaps

- Customer notes are not persisted.
- Favorite equipment is not derived yet because there is no normalized booking-equipment history connected to this staff view.
- The query currently reads the latest booking rows and groups in memory; pagination/search can be added when the dataset grows.
