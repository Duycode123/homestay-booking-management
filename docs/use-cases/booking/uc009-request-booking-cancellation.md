# UC009 - Request and approve booking cancellation

## Business goal

Allow a customer to request cancellation without immediately releasing a paid room, and let an admin review the request before the system records a cancellation and refund.

## Actors

- Customer: submits a cancellation reason.
- Admin: approves or rejects the request.

## Preconditions

- The booking belongs to the signed-in customer.
- The booking status is `PAID` or `DEPOSIT_PAID`.
- The request is submitted at least 24 hours before check-in.

## Main flow

1. The customer opens a booking, enters a cancellation reason of at least 10 characters, and provides the bank destination for the refund.
2. The system records the request as `PENDING`; the booking remains active and the room remains reserved.
3. Admin reviews the request in booking management.
4. Admin approves the request.
5. The system changes the booking to `CANCELLED`, records the request as `APPROVED`, calculates a 100% refund of the amount actually collected, and creates one `booking_refund` record in `PENDING` state.
6. Admin starts reconciliation, which changes the refund to `PROCESSING` without changing the already-cancelled booking.
7. The refund center generates VietQR using the approved amount and `REFUND {bookingCode}`. Admin verifies the recipient name and amount in the banking application, transfers the money, then confirms success with one action. Bank reference, receipt, and note are optional evidence; the system generates a unique reconciliation reference when they are omitted.
8. A failed transfer becomes `RETRY_REQUIRED`; it can be retried without restoring or duplicating the booking.

## Alternate flows

- Admin rejects: request becomes `REJECTED`; booking remains unchanged.
- Request is within 24 hours of check-in: reject the request and direct the customer to support.
- Booking has already started, completed, or been cancelled: approval is rejected.
- A non-admin attempts review: return forbidden.
- Bank destination is missing or the account number is not 6-30 digits: reject the request before saving it.

## Related endpoints

- `PUT /api/bookings/{id}/cancel`: submit a request (kept for endpoint compatibility).
- `POST /api/admin/bookings/{id}/cancellation-request/approve`
- `POST /api/admin/bookings/{id}/cancellation-request/reject`
- `GET /api/admin/refunds`
- `POST /api/admin/refunds/{id}/start`
- `POST /api/admin/refunds/{id}/complete`
- `POST /api/admin/refunds/{id}/fail`
- `POST /api/admin/refunds/proofs`
- `GET /api/bookings/{id}/refund`

## Data touched

- `booking.status`
- `booking.cancellation_*`
- `booking.refund_*`
- `booking.refund_bank_*` and `booking.refund_account_*`
- `booking.expected_refund_at`
- `booking_refund.*`

## Current implementation notes

Manual refund reconciliation is implemented as a separate feature-first module. Approval creates an idempotent refund record keyed by `booking_id`; processing and completion use pessimistic/optimistic concurrency controls and require a unique reconciliation reference before completion. The backend generates that reference when no bank transaction code is supplied. The customer-provided destination is normalized and copied into the refund ledger as an immutable snapshot. The application never requests a bank password, OTP, card PIN, or account balance. Automatic provider disbursement is deliberately not claimed: admin performs the real transfer and explicitly confirms the result; bank reference, proof, and notes are optional evidence. Customer UI reads the resulting timeline independently from booking status.
