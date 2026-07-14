# UC008 - Admin Manage Bookings

## Metadata

- Source: Product Backlog `UC008`
- Primary actor: Admin or staff with management permission
- Current status in repo: Implemented core flow

## Related Endpoints

- `GET /api/admin/bookings`
- `GET /api/admin/bookings/{id}`
- `PATCH /api/admin/bookings/{id}/status`
- `PUT /api/admin/bookings/{id}/cancel`

## Goal

Allow operational staff to inspect bookings, review details, update booking status, and cancel bookings when management action is required.

## Preconditions

- Caller is authenticated.
- Caller has `ADMIN` or `STAFF` permission for management actions.
- Target booking exists for detail or update actions.

## Main Flow

### View Booking List

1. Manager opens booking management.
2. Frontend requests booking list, optionally filtered by status, room, customer search, or date range.
3. Backend validates caller role.
4. Backend returns booking summaries (newest first by default), either as a plain list or as a page when pagination is requested.

### View Booking Detail

1. Manager selects a booking.
2. Backend validates role and loads the booking.
3. Backend returns detail data.

### Update Booking Status

1. Manager chooses a new status.
2. Backend validates role and target booking.
3. Backend validates the requested state transition against the booking lifecycle.
4. When checking in, backend validates the time window and records actual check-in time plus the staff profile when applicable.
5. When completing, backend records actual checkout time.
6. Backend returns the updated booking.

### Cancel Booking

1. Manager chooses cancel action.
2. Backend validates role and target booking.
3. Backend blocks cancellation for cancelled, checked-in, or completed bookings. A reason is mandatory after any payment/deposit has been collected.
4. Backend updates status to cancelled and appends cancellation reason when provided.

## Alternate and Error Flows

- Caller lacks management permission: backend rejects the request.
- Booking does not exist: backend returns not found.
- Invalid status change request: backend rejects the request.
- Attempt to cancel completed booking: backend rejects the request.

## Business Rules

- Only admin/staff management roles can use the admin booking endpoints.
- A deposit-paid booking can move from `DEPOSIT_PAID -> CHECKED_IN`; full-payment bookings move from `PAID -> CHECKED_IN`.
- Management responses expose the successful amount already collected and the remaining balance.
- `CHECKED_IN -> COMPLETED` is rejected while a balance remains. Admin/staff uses `POST /api/admin/bookings/{id}/settle-checkout` to record a successful `COUNTER` transaction for the exact remainder and complete checkout atomically.
- The settlement use case locks the booking row while calculating and recording the remainder, preventing duplicate collection from concurrent staff actions.
- Online `PENDING_PAYMENT` bookings are confirmed only by the payment integration, not manually through booking management.
- Check-in is accepted from 5 minutes before the planned start until before the planned end.
- A booking with a `PENDING` customer cancellation request cannot be checked in until admin reviews that request.
- Cancelled, checked-in, and completed bookings cannot be cancelled through the management flow.
- Cancellation reason, if provided, is appended into booking note history.

## Data Touched

- `Booking`
- `User`

## Current Implementation Notes

- List endpoint (`GET /api/admin/bookings`) supports: `status`, `roomId`, `search` (matches customer full name, customer email, or room name, case-insensitive with LIKE wildcards escaped), `from`/`to` (inclusive range on booking `startTime`), plus `page`, `size`, `sortBy`, `direction`.
- Pagination is opt-in: when `page` or `size` is provided, the response wraps a `PagedResponse<BookingResponse>`; without them it stays a plain `List<BookingResponse>`, so the existing admin UI keeps working unchanged.
- Sorting is whitelisted to `createdAt`, `startTime`, `endTime`, `totalAmount`, `status` (reusing the same guard as customer history); default is `createdAt` descending. `direction` accepts `asc`/`desc`. `size` is capped at 100.
- Filtering runs as a JPA specification inside `BookingPersistenceAdapter` behind the `SearchBookingsForManagementPort`; the application layer sees only `BookingManagementSearchCriteria` and `PageResult`. This replaced the old `findAllByOrderByCreatedAtDesc` / `findByStatusOrderByCreatedAtDesc` repository methods.
- Current detail endpoint returns one booking detail record.
- Status update uses query param `status`.
- Current management cancel flow changes booking state and records the reason; it does not automatically create or move refund money.

## Known Gaps / Follow-up

- Payment-status synchronization and a structured status-history audit log should still be formalized.
- State transitions are now enforced by `BookingStatusTransitionPolicy` at the application boundary. Moving the policy away from the legacy JPA booking model remains part of the incremental hexagonal migration.
- The customer/room search is a leading-wildcard LIKE; acceptable at current volume, revisit indexing (e.g. `pg_trgm`) if booking volume grows large.

## Hexagonal Notes

Inbound ports:

- `ListBookingsForManagementUseCase` (`getAllBookings` plain list, `getBookingsPage` paged)
- `GetBookingManagementDetailUseCase`
- `UpdateBookingStatusUseCase`
- `CancelBookingForManagementUseCase`

Outbound ports:

- `SearchBookingsForManagementPort` (`loadBookingsForManagement` / `searchBookingsForManagement`)
- `LoadBookingPort`
- `SaveBookingPort`
- `LoadUserPort`
