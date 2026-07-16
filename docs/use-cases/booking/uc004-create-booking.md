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
4. Customer selects a start time and end time, then confirms the booking without entering a coupon.
5. Frontend requests cost calculation.
6. Backend calculates the original price based on room hourly rate and duration.
7. Customer confirms the details. Frontend saves only a browser-side checkout draft and opens checkout; no database booking exists and the room remains available to other customers.
8. At checkout, the customer may validate an optional coupon and chooses either a 50% deposit or 100% payment.
9. When the customer clicks `Tạo mã QR`, frontend sends the booking request. Backend validates the request again, locks the room, checks availability under concurrency control, and creates the booking in `PENDING_PAYMENT`.
10. Frontend immediately requests the online payment session for that booking. Backend validates and stores the optional coupon, calculates the payable amount, and creates a pending payment transaction using a `PAY...` transfer reference.
11. The pending booking holds the room/time slot for at most five minutes and backend returns a VietQR image URL plus the exact expiry time.
12. If payment-session creation fails after booking creation, the same pending booking remains reusable for retry only until its five-minute expiry; the expiry sweep then cancels it and releases the room.
13. Frontend renders the QR code and polls `GET /api/payments/transactions/{paymentId}` about every 10 seconds.
14. On each poll, backend queries SePay Transactions API when `payment.sepay.api-access-token` is configured, matches an incoming transfer by amount plus `PAY...` reference in the SePay `code` or transaction content, then marks the transaction as succeeded and the booking as `DEPOSIT_PAID` for a partial deposit or `PAID` for full payment.
15. If no matching SePay transaction is found before the configured payment expiry, the same poll endpoint marks the transaction and held booking as `CANCELLED`.

## Alternate and Error Flows

- Customer is not authenticated: request must be rejected by auth layer.
- Room does not exist: backend returns not found.
- Room is under maintenance: booking is rejected.
- Requested time overlaps an existing blocking booking: backend rejects the request.
- Another user books the same slot concurrently: backend rejects the later request.
- Invalid time range or booking in the past: backend rejects the request.
- Invalid, expired, or ineligible coupon at checkout: backend rejects payment-session creation with the coupon validation reason and does not create a transaction.
- Customer cancels on the SePay portal: backend accepts the SePay cancel/void notification, marks the pending transaction as `CANCELLED`, and marks the held booking as `CANCELLED` to release the slot.
- Portal payment fails: backend marks the pending transaction as `FAILED` and marks the held booking as `CANCELLED`.
- Payment timeout: the single deadline is `booking.created_at + app.booking.payment-expiration-seconds` (default `300`, or 5 minutes). Both the room hold and every initial-payment SePay QR use this exact deadline. Creating another QR for the same booking never extends the hold. At the deadline, the transaction and still-pending booking are marked `CANCELLED`, releasing availability.
- Payment API responses serialize `expiresAt` with an explicit UTC offset. This prevents a Render UTC timestamp from being interpreted as Vietnam local time by the browser and expiring a newly created QR seven hours early.
- SePay transaction timestamps are Vietnam local time. The SePay lookup and webhook adapters convert them to the backend system timeline before comparing them with the QR deadline or storing `paid_at`; otherwise a valid Render payment would be misclassified as seven hours late.
- If SePay reports that money arrived after session expiry, the transaction is retained as `SUCCEEDED` with response code `LATE_PAYMENT_REQUIRES_REFUND`, while the booking stays cancelled to avoid reclaiming a room that may already have been released. The customer must contact support for reconciliation instead of paying again.

## Business Rules

- Booking start time must be before end time.
- Booking cannot be created in the past.
- Every booking is a night stay. Check-in is fixed at `14:00`, checkout is fixed at `12:00` on a later date, and the minimum selection is one night (22 actual hours for the first night). Backend cost calculation and booking creation both enforce this rule.
- Rooms in maintenance are not bookable.
- Only bookings in `PENDING_PAYMENT`, `DEPOSIT_PAID`, `PAID`, or `CHECKED_IN` block availability. `COMPLETED` and `CANCELLED` bookings remain in history without holding the room.
- After today's check-in time has passed, the public catalog guides the customer to the next available date instead of applying an hourly cutoff or describing every room as genuinely booked.
- Room cards keep the primary action `Đặt phòng` when today's 14:00 check-in was available but has merely passed; opening the picker starts from the next valid date. `Chọn ngày khác` is reserved for rooms that actually have a blocking booking today.
- A new booking starts in `PENDING_PAYMENT` state.
- Online deposit amount is exactly 50% of the discounted booking total, rounded to two decimal places. Full online payment uses 100% of that total.
- Cash payment does not create a `payment_transaction`; it remains pending until staff collects and confirms the full payment at the homestay.
- Cash bookings are not cancelled by the short online-payment expiry sweep. The selected room/time remains reserved for the customer.
- An online checkout session must create a pending `payment_transaction` before showing the QR or redirecting the user to a payment portal.
- Creating a new checkout session for the same booking cancels any older open payment sessions with `PAYMENT_SESSION_REPLACED`.
- A pending checkout holds the selected room/time slot until payment success, portal cancel/failure, or timeout.
- Public room availability exposes only a non-sensitive blocking classification: `PAYMENT_HOLD` for an unpaid five-minute hold and `BOOKED` for a confirmed stay. It never exposes the customer or booking identity.
- The room catalog displays `PAYMENT_HOLD` separately as `Đang giữ chỗ`, excludes it from the available-room count, and refreshes when the reported hold countdown expires. After the expiry sweep cancels an unpaid booking, the room returns to the available count automatically.
- Deposit success moves the booking to `DEPOSIT_PAID`; full-payment success moves it to `PAID`.
- A valid coupon entered at checkout changes the pending booking total before the payment transaction is created, but does not create `coupon_usage` until payment is confirmed.

## Data Touched

- `Booking`
- `Room`
- `RoomType`
- `Customer`
- `User`
- `DiscountCode`

## Current Implementation Notes

- Payment HTTP endpoints depend on focused inbound use-case ports. SePay QR/portal construction, callback URL composition, and HMAC signing are isolated in the outbound `SePayCheckoutAdapter`.
- The scheduled expiry service delegates database state changes through `ExpireStalePendingBookingsPort`, keeping scheduling policy separate from JPA persistence.

- Availability is calculated through `GET /api/rooms/{id}/available-slots`.
- The public room flow uses a night-stay date range: check-in at `14:00`, checkout at `12:00` on the selected departure date, with a minimum of one night and a maximum selection of 30 nights.
- Before enabling continuation, the frontend requests availability for the entire multi-day interval and requires one backend availability range to cover it completely.
- Changing date clears the previous date's availability before loading the new result. A failed availability request blocks selection and exposes a retry action instead of presenting stale slots as bookable.
- Cost calculation is exposed as a separate endpoint before creation.
- Booking creation uses room locking plus overlap checks to reduce race conditions.
- The service catches persistence conflicts and converts them into booking conflict errors.
- Viewing a room, selecting dates, and reviewing the confirmation page only create a browser-side draft; they do not create a database booking or block the room. The frontend creates the booking immediately before requesting the VietQR session when the customer clicks `Tạo mã QR`.
- A scheduled expiry job exists to auto-cancel stale unpaid payment sessions after the configured timeout (`app.booking.payment-expiration-seconds`, default `300`, or 5 minutes). The default sweep interval is 10 seconds so abandoned holds are released promptly.
- Checkout now asks the backend to create a `payment_transaction` record instead of simulating payment only in the frontend.
- Customer checkout only supports online payment through SePay: either a 50% deposit or the full amount, both via VietQR plus SePay transaction lookup. `cash` is rejected by `POST /api/payments/sessions`; the booking payment method is always set to `ONLINE` by checkout.
- Booking creation stores the original room total. Payment-session creation reuses the coupon validation use case and applies an optional coupon atomically before calculating the deposit/full-payment amount.
- Room types still store an hourly rate. The night-stay UI displays the first-night reference as 22 hours (`14:00` to `12:00` next day), while backend totals remain based on the exact real duration. A dedicated nightly-rate schema is a future migration rather than being silently inferred in persistence.
- `POST /api/payments/sessions` now returns a VietQR image URL from `payment.sepay.qr-bank-account`, `payment.sepay.qr-bank-code`, and `payment.sepay.qr-template`, using the generated `PAY...` payment reference as transfer content.
- Payment completion is primarily closed by `GET /api/payments/transactions/{paymentId}`: `PaymentCheckoutUseCaseService` calls the outbound `FindSePayIncomingPaymentPort`, implemented by `SePayTransactionLookupAdapter` against SePay Transactions API with the API Access Bearer token. The adapter queries the v2 `GET /v2/transactions` endpoint first, falls back to the legacy v1 `GET /userapi/transactions/list` endpoint, filters by account, amount, date window, and then matches `PAY...` in SePay `code` or `transaction_content`.
- Provider webhooks are still supported as a fallback: `PaymentWebhookServiceImpl` moves the transaction to `SUCCEEDED`/`FAILED`/`CANCELLED`, flips the booking from `PENDING_PAYMENT` to `DEPOSIT_PAID`, `PAID`, or `CANCELLED`, and records coupon usage on success. VNPay IPN is HMAC-SHA512 signature-verified; SePay can use HMAC-SHA256 headers (`payment.sepay.webhook-hmac-secret`) or the fallback `Authorization: Apikey <secret>` value from `payment.sepay.ipn-secret`.
- `POST /api/payments/sepay/webhook` handles two SePay payload shapes: (1) the Payment Gateway IPN (nested `notification_type` + `order` + `transaction`; configured in the SePay dashboard under Payment Gateway → Configuration → IPN; authenticated by the `X-Secret-Key` header matched against `payment.sepay.ipn-secret`) — `ORDER_PAID` with `order_invoice_number = PAY...` and sufficient `order_amount` confirms the transaction and booking; `TRANSACTION_VOID`, `ORDER_CANCELLED`, and `ORDER_EXPIRED` cancel the pending transaction and booking; `ORDER_FAILED`/`PAYMENT_FAILED` fail the transaction and cancel the booking; (2) the legacy flat bank-transfer webhook (`transferType: "in"` + `PAY...` reference inside the transfer content), kept for the VietQR fallback flow.
- The SePay secret is optional in local/dev (blank secret = webhook open so the flow can be exercised without a SePay account); production should set `payment.sepay.webhook-hmac-secret`.

## Known Gaps / Follow-up

- Live SePay polling requires an active API Access token in `payment.sepay.api-access-token`. Local tests validate QR generation and status sync behavior, not live money movement.
- Homestay service/equipment add-ons and a richer checkout breakdown from the backlog are not yet covered in this backend path.
- Deposit vs full-payment booking statuses are modelled. Management responses calculate `paidAmount` and `remainingAmount` from successful payment transactions; the remaining balance is settled through the management checkout use case.

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
