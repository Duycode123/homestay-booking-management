# Booking Add-on Services

## Business goal

Allow The Serene Villa to sell a compact set of practical services without turning the graduation project into a full retail system. Services can be selected during booking or requested after check-in, while payment and checkout remain consistent with the existing booking total.

## Actors

- Customer
- Staff assigned to the booking's work shift
- Administrator
- SePay/payment flow

## Preconditions

- An administrator has created at least one active add-on service.
- A service may apply to all room tiers or one room tier.
- A customer must own the booking.
- During-stay ordering requires the booking to be `CHECKED_IN`.

## Main flow: selected with booking

1. Customer opens booking confirmation.
2. System loads active services valid for the selected room tier.
3. Customer selects service and quantity.
4. Backend recalculates prices from the server-side catalog; client-submitted prices are never trusted.
5. Booking stores room amount, add-on amount, total amount, and a price snapshot for each service.
6. Customer pays the deposit or full amount through the existing payment flow.
7. Successful payment changes initial services from `PENDING_PAYMENT` to `CONFIRMED`.
8. Failed or expired payment releases the room and cancels undelivered services.

## Main flow: requested after check-in

1. Customer opens booking detail while the booking is `CHECKED_IN`.
2. Customer selects an active service and quantity, then sends a request.
3. The request starts at `REQUESTED` and does not yet increase the booking total.
4. Staff assigned to the relevant shift confirms and prepares the request.
5. When staff marks the service `DELIVERED`, its snapshotted amount is added to `booking.addon_amount` and `booking.total_amount` exactly once.
6. At checkout, the remaining amount includes delivered services.
7. Staff collects cash or creates the existing SePay balance QR.

## Alternate and error flows

- Inactive or wrong-tier service: reject the selection and ask the customer to reload the catalog.
- Duplicate service in one request: reject instead of merging implicitly.
- Quantity outside 1–20: reject.
- Customer requests before check-in: reject.
- Staff outside the assigned shift: return forbidden.
- Customer can cancel only their `REQUESTED` during-stay item.
- Admin/staff can cancel an unpaid item or a during-stay item before delivery. A paid booking-time service must use the refund workflow so collected money is not silently lost.
- Delivered item: cannot be cancelled or delivered again.
- Checkout with an item in `REQUESTED`, `CONFIRMED`, or `PREPARED`: block checkout until staff delivers or cancels it.

## Business rules

- Coupons discount the room amount only; add-on services keep their configured price.
- Initial services are included in deposit/full-payment calculation.
- During-stay services affect money only after delivery.
- Service name, unit price, unit, quantity, and total are snapshotted in `booking_addon` so later catalog edits do not change historical bookings.
- Catalog services are deactivated instead of physically deleted to preserve history.
- Delivered services are non-refundable as part of the normal cancellation flow.

## Related endpoints

- `GET /api/addons?roomId={roomId}`
- `GET|POST|PUT|PATCH /api/admin/addons`
- `GET|POST /api/bookings/{bookingId}/addons`
- `PATCH /api/bookings/{bookingId}/addons/{itemId}/cancel`
- `GET /api/admin/bookings/{bookingId}/addons`
- `PATCH /api/admin/bookings/{bookingId}/addons/{itemId}/status`

## Data touched

- `addon_service`
- `booking_addon`
- `booking.room_amount`
- `booking.addon_amount`
- `booking.total_amount`
- existing payment transaction rows for initial and checkout payments

## Current implementation notes

- The add-on feature uses feature-first hexagonal boundaries: web adapters call `AddonUseCase`; JPA, user/booking access, and staff-scope checks are outbound adapters.
- Status changes use pessimistic row locking and transaction boundaries in the application service.
- Customer, staff, and admin interfaces use the same backend status source.

## Known scope limits

- No inventory/stock management.
- No delivery-route optimization.
- No separate add-on refund workflow after delivery.
- No supplier or purchase-order module.

These limits are intentional to keep the flow suitable for a graduation project while retaining realistic booking and payment behavior.
