# Release Unpaid Payment Hold

## Business goal

Give a customer exactly five minutes to pay a newly generated VietQR on a dedicated payment page, while releasing the room immediately when that page is intentionally left. An abandoned or expired QR must never be reported as a customer cancellation.

## Actors

- Customer: creates a payment session, scans the QR, or leaves the payment page.
- Payment checkout application: owns the five-minute session and releases an unpaid hold.
- SePay: reports a matching incoming transfer.
- Expiry scheduler: releases abandoned sessions when the browser cannot notify the backend.

## Preconditions

- The authenticated customer owns the pending booking.
- The booking is still `PENDING_PAYMENT`.
- The payment transaction is `INITIALIZED` or `PENDING`.
- The selected room/time remains valid when the booking and transaction are created.

## Main flow

1. Customer reviews the booking and chooses deposit or full online payment.
2. Customer selects **Tạo mã QR**.
3. Backend locks and revalidates the room, creates the pending booking and a new payment transaction.
4. Backend returns the transaction-specific deadline: `payment_transaction.created_at + 300 seconds`.
5. Frontend navigates to `/customer/payment` and displays the complete stay, price, payment option, QR reference, exact amount, and remaining time.
6. The dedicated page polls the payment status every three seconds without animating or regenerating the QR.
7. When SePay confirms the transfer, backend records success and moves the booking to `DEPOSIT_PAID` or `PAID`.
8. Frontend navigates to the existing payment-success page.

## Alternate and error flows

- Customer explicitly leaves the payment page: frontend calls `POST /api/payments/transactions/{paymentId}/release`; transaction and still-pending booking become `EXPIRED` and the room is released immediately.
- Tab closes or browser navigates away: frontend sends the same release request with `keepalive`. The scheduler remains the fallback if the request cannot be delivered.
- Five minutes elapse: polling or scheduled expiry changes the pending transaction and booking to `EXPIRED`.
- Page refresh/navigation races with payment confirmation: the backend locks and re-reads state; a succeeded transaction is never downgraded to `EXPIRED`.
- Money arrives after the room was released: the transaction remains auditable as `SUCCEEDED` with `PAYMENT_AFTER_RELEASE_REQUIRES_REFUND`; the booking stays `EXPIRED` and is not resurrected. Support must reconcile and refund the late transfer.
- A newer QR replaces an older open QR: the old transaction becomes `EXPIRED`; the new transaction receives its own five-minute deadline.

## Business rules

- Every QR session has an independent five-minute deadline based on its own creation time.
- Only an unpaid `PENDING_PAYMENT` booking can be released by this use case.
- `EXPIRED` is not `CANCELLED` and must not appear in cancellation, refund, booking-history, or staff-workflow reports.
- Only a confirmed `PAID` or `DEPOSIT_PAID` booking that is later cancelled enters the cancellation/refund workflow.
- A payment success is authoritative over a concurrent page-leave request.
- Leaving the dedicated payment page intentionally forfeits the hold; returning requires a new availability check and a new session.

## Related endpoints

- `POST /api/payments/sessions`
- `GET /api/payments/transactions/{paymentId}`
- `POST /api/payments/transactions/{paymentId}/release`
- `POST /api/payments/sepay/webhook`

## Data touched

- `booking.status`: `PENDING_PAYMENT` to `EXPIRED`, `DEPOSIT_PAID`, or `PAID`.
- `payment_transaction.status`: `INITIALIZED`/`PENDING` to `EXPIRED` or `SUCCEEDED`.
- `payment_transaction.response_code`: release/timeout/reconciliation outcome.
- Pending booking add-ons: cancelled when their unpaid parent hold is released.

## Current implementation notes

- `ReleasePaymentHoldUseCase` is the inbound application boundary used by the payment web adapter.
- Transaction and booking rows are locked before state transitions so payment confirmation cannot be overwritten by expiry/release.
- The browser release call is an optimization for immediate availability; the scheduled expiry is the source-of-truth fallback.
- Flyway migrations `V11` and `V12` add the statuses and update the PostgreSQL overlap constraint.

## Known gaps

- A browser process killed without a final network opportunity cannot release immediately; the maximum fallback delay is the remaining five-minute deadline plus the scheduler interval.
- Late-payment refund execution remains a manual reconciliation workflow until a verified provider refund API is available.
