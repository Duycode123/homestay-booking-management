# UC004 - Create Booking

## Metadata

- Source: Product Backlog `UC004`
- Primary actor: Customer
- Supporting actors: Booking system, payment flow
- Current status in repo: Implemented — availability lookup, cost calculation, booking creation, VietQR checkout session, frontend polling status sync, and authenticated provider-webhook payment completion as a fallback

## Related Endpoints

- `GET /api/rooms/{id}/available-slots`
- `POST /api/bookings/calculate-cost`
- `POST /api/bookings`
- `POST /api/payments/sessions`
- `GET /api/payments/transactions/{paymentId}`
- `POST /api/payments/sepay/webhook` (fallback SePay confirmation, authenticated by HMAC or API-key shared secret)
- `GET /api/payments/vnpay/ipn` (VNPay confirmation, signature-verified)

## Goal

Allow an authenticated customer to select a valid room/time range, see the expected cost, and create a booking without overbooking the room.

## Preconditions

- Customer is authenticated.
- Selected room exists.
- Requested booking time is in the future.
- Requested booking duration is valid.

## Main Flow

1. Customer opens the booking flow for a room.
2. Frontend requests available slots for a selected time window.
3. Backend returns free slots based on existing blocking bookings and room status.
4. Customer selects a start time, end time, payment method, and optional coupon code.
5. Frontend requests cost calculation.
6. Backend calculates price based on room hourly rate and duration, and applies the coupon when one is provided and valid.
7. Customer confirms booking.
8. Backend validates the request again, checks availability under concurrency control, and creates the booking.
9. Backend stores the booking with pending-payment status and returns booking summary data.
10. For online SePay payment, backend creates a pending payment transaction using a `PAY...` transfer reference, keeps the booking in `PENDING_PAYMENT` to hold the room/time slot, and returns a VietQR image URL as `paymentUrl`.
11. Frontend renders the QR code and polls `GET /api/payments/transactions/{paymentId}` about every 10 seconds.
12. On each poll, backend queries SePay Transactions API when `payment.sepay.api-access-token` is configured, matches an incoming transfer by amount plus `PAY...` reference in the SePay `code` or transaction content, then marks the transaction as succeeded and the booking as `DEPOSIT_PAID` for a partial deposit or `PAID` for full payment.
13. If no matching SePay transaction is found before the configured payment expiry, the same poll endpoint marks the transaction and held booking as `CANCELLED`.

## Alternate and Error Flows

- Customer is not authenticated: request must be rejected by auth layer.
- Room does not exist: backend returns not found.
- Room is under maintenance: booking is rejected.
- Requested time overlaps an existing blocking booking: backend rejects the request.
- Another user books the same slot concurrently: backend rejects the later request.
- Invalid time range or booking in the past: backend rejects the request.
- Invalid, expired, or ineligible coupon: backend rejects the request with the coupon validation reason.
- Customer cancels on the SePay portal: backend accepts the SePay cancel/void notification, marks the pending transaction as `CANCELLED`, and marks the held booking as `CANCELLED` to release the slot.
- Portal payment fails: backend marks the pending transaction as `FAILED` and marks the held booking as `CANCELLED`.
- Payment timeout: pending checkout sessions older than `app.booking.payment-expiration-seconds` (default `300`) are marked `CANCELLED` by the poll endpoint or scheduled expiry job; their still-pending bookings are also marked `CANCELLED` so availability is released.

## Business Rules

- Booking start time must be before end time.
- Booking cannot be created in the past.
- Minimum booking duration is one hour.
- Rooms in maintenance are not bookable.
- Cancelled bookings do not block availability.
- A new booking starts in `PENDING_PAYMENT` state.
- A checkout session must create a pending `payment_transaction` before redirecting the user to the payment portal.
- Creating a new checkout session for the same booking cancels any older open payment sessions with `PAYMENT_SESSION_REPLACED`.
- A pending checkout holds the selected room/time slot until payment success, portal cancel/failure, or timeout.
- Deposit success moves the booking to `DEPOSIT_PAID`; full-payment success moves it to `PAID`.
- A valid coupon changes the final payable amount but does not create `coupon_usage` until payment is confirmed.

## Data Touched

- `Booking`
- `Room`
- `RoomType`
- `Customer`
- `User`
- `DiscountCode`

## Current Implementation Notes

- Availability is calculated through `GET /api/rooms/{id}/available-slots`.
- Cost calculation is exposed as a separate endpoint before creation.
- Booking creation uses room locking plus overlap checks to reduce race conditions.
- The service catches persistence conflicts and converts them into booking conflict errors.
- A scheduled expiry job exists to auto-cancel stale unpaid payment sessions after the configured timeout (`app.booking.payment-expiration-seconds`, default `300`).
- Checkout now asks the backend to create a `payment_transaction` record instead of simulating payment only in the frontend.
- Customer checkout only supports online payment through SePay: either a 50,000 VND deposit or the full amount, both via VietQR plus SePay transaction lookup. `cash` is rejected by `POST /api/payments/sessions`; the booking payment method is always set to `ONLINE` by checkout. (`PaymentProvider.COUNTER` remains only for reading historical counter transactions.)
- Cost calculation and booking creation now reuse the coupon validation use case so the same coupon rules apply before and during booking creation.
- `POST /api/payments/sessions` now returns a VietQR image URL from `payment.sepay.qr-bank-account`, `payment.sepay.qr-bank-code`, and `payment.sepay.qr-template`, using the generated `PAY...` payment reference as transfer content.
- Payment completion is primarily closed by `GET /api/payments/transactions/{paymentId}`: `PaymentCheckoutUseCaseService` calls the outbound `FindSePayIncomingPaymentPort`, implemented by `SePayTransactionLookupAdapter` against SePay Transactions API with the API Access Bearer token. The adapter queries the v2 `GET /v2/transactions` endpoint first, falls back to the legacy v1 `GET /userapi/transactions/list` endpoint, filters by account, amount, date window, and then matches `PAY...` in SePay `code` or `transaction_content`.
- Provider webhooks are still supported as a fallback: `PaymentWebhookServiceImpl` moves the transaction to `SUCCEEDED`/`FAILED`/`CANCELLED`, flips the booking from `PENDING_PAYMENT` to `DEPOSIT_PAID`, `PAID`, or `CANCELLED`, and records coupon usage on success. VNPay IPN is HMAC-SHA512 signature-verified; SePay can use HMAC-SHA256 headers (`payment.sepay.webhook-hmac-secret`) or the fallback `Authorization: Apikey <secret>` value from `payment.sepay.ipn-secret`.
- `POST /api/payments/sepay/webhook` handles two SePay payload shapes: (1) the Payment Gateway IPN (nested `notification_type` + `order` + `transaction`; configured in the SePay dashboard under Payment Gateway → Configuration → IPN; authenticated by the `X-Secret-Key` header matched against `payment.sepay.ipn-secret`) — `ORDER_PAID` with `order_invoice_number = PAY...` and sufficient `order_amount` confirms the transaction and booking; `TRANSACTION_VOID`, `ORDER_CANCELLED`, and `ORDER_EXPIRED` cancel the pending transaction and booking; `ORDER_FAILED`/`PAYMENT_FAILED` fail the transaction and cancel the booking; (2) the legacy flat bank-transfer webhook (`transferType: "in"` + `PAY...` reference inside the transfer content), kept for the VietQR fallback flow.
- The SePay secret is optional in local/dev (blank secret = webhook open so the flow can be exercised without a SePay account); production should set `payment.sepay.webhook-hmac-secret`.

## Known Gaps / Follow-up

- Live SePay polling requires an active API Access token in `payment.sepay.api-access-token`. Local tests validate QR generation and status sync behavior, not live money movement.
- Instrument add-ons and richer checkout breakdown from backlog are not yet covered in this backend path.
- Deposit vs full-payment booking statuses are modelled, but remaining-balance tracking after `DEPOSIT_PAID` is not yet a first-class booking field.

## Hexagonal Refactor Notes

Suggested inbound ports:

- `GetRoomAvailabilityUseCase`
- `CalculateBookingCostUseCase`
- `CreateBookingUseCase`

Suggested outbound ports:

- `LoadRoomPort`
- `LockRoomPort`
- `LoadCustomerPort`
- `LoadBlockingBookingsPort`
- `SaveBookingPort`
