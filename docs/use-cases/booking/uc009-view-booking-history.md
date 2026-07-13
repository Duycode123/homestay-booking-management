# UC009 - View Customer Booking History

## Metadata

- Source: Product Backlog `UC009`
- Primary actor: Customer
- Current status in repo: Implemented core flow

## Related Endpoints

- `GET /api/bookings/my/history`
- `GET /api/bookings/my/{bookingId}`

## Goal

Allow an authenticated customer to review their own bookings with filtering, sorting, and pagination.

## Preconditions

- Customer is authenticated.
- Customer profile exists and is linked to the authenticated account.

## Main Flow

1. Customer opens the booking history page.
2. Frontend requests booking history for the current customer.
3. Customer may filter by status and time range.
4. Customer may request a page and sort order.
5. Backend validates the query and returns paged results.
6. When the customer opens one item, backend returns the owned booking detail by booking id.

## Alternate and Error Flows

- Customer profile is missing: backend returns not found.
- Invalid page or size: backend rejects the request.
- Invalid date range: backend rejects the request.
- Invalid sort field or direction: backend rejects the request.

## Business Rules

- Customers can see only their own bookings.
- Supported sort fields are limited to approved booking fields.
- Status and time filters can be combined.
- Page size is constrained to a safe range.

## Data Touched

- `Booking`
- `Customer`

## Current Implementation Notes

- Current endpoint supports `status`, `from`, `to`, `page`, `size`, `sortBy`, and `direction`.
- Results are returned as `PagedResponse<BookingResponse>`.
- Filtering is implemented with a booking specification at the service level today.
- Booking detail lookup reuses the same response model and explicitly rejects access to another customer's booking.

## Known Gaps / Follow-up

- Review handoff, cancellation handoff, and richer breakdown data from the backlog are still follow-up work.
- Query-building logic should eventually move behind ports/adapters during hexagonal migration.

## Hexagonal Refactor Notes

Suggested inbound port:

- `GetCustomerBookingHistoryUseCase`

Suggested outbound ports:

- `LoadCustomerPort`
- `SearchCustomerBookingsPort`
