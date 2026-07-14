# Admin Reconcile Booking Refund

## Business goal

Provide an auditable refund workflow after an administrator approves a customer's cancellation request. The workflow must distinguish **approving a refund obligation** from **money actually leaving the business account**.

## Actors

- Customer: requests cancellation and follows the refund timeline.
- Administrator: approves or rejects the cancellation, processes the refund, and records evidence.
- Payment provider or bank: executes the real transfer outside the application until a live refund API is integrated.

## Preconditions

- The booking belongs to the requesting customer.
- Booking status is `PAID` or `DEPOSIT_PAID`.
- The request is submitted at least 24 hours before check-in.
- The booking has a pending cancellation request.
- The approved refund amount is the amount actually collected, never more than the booking total.

## Main flow

1. Customer submits a cancellation request.
2. Booking remains active while the request is `PENDING`; staff must not check it in.
3. Administrator approves the request.
4. The booking changes to `CANCELLED` and the cancellation request changes to `APPROVED`.
5. The application creates exactly one `booking_refund` in `PENDING` status for the collected amount.
6. Administrator opens the refund center and starts processing. The refund changes to `PROCESSING`.
7. The refund center displays the customer-provided bank destination and generates a VietQR containing the exact approved amount and `REFUND {bookingCode}` transfer content.
8. Administrator scans the VietQR in the homestay banking application and verifies the recipient name before executing the real transfer.
9. After the banking application reports success, the administrator confirms the transfer with one action. A bank transaction reference, receipt image, and note may be attached but are optional.
10. When no bank reference is supplied, the application creates a deterministic unique reconciliation reference in the form `REFUND-{bookingCode}-{refundId}`.
11. The refund changes to `COMPLETED`; completion time, processor, reconciliation reference, and any optional evidence are retained.
12. Customer receives an in-app notification and a branded HTML email containing the refunded amount, booking code, room, receiving bank, masked account number, reconciliation reference, completion time, booking-history link, and support link.
13. Customer can also see the completed timeline and reconciliation reference from booking history.

## Alternate and error flows

- Cancellation rejected: booking remains unchanged and no refund record is created.
- Existing refund for the booking: return the existing record; never create a duplicate.
- Transfer fails: administrator records the reason and the refund changes to `RETRY_REQUIRED`.
- Retry: administrator starts the same refund again; no second record is created.
- Duplicate supplied bank/reconciliation reference: completion is rejected by the database uniqueness constraint.
- Email or notification failure: the financial result remains committed and can be reconciled from the refund center.
- Concurrent administrators: pessimistic row locking and optimistic versioning prevent invalid double transitions.

## Business rules

- One booking has at most one refund record.
- Only `PENDING`, `FAILED`, or `RETRY_REQUIRED` can move to `PROCESSING`.
- Only `PROCESSING` can move to `COMPLETED` or `RETRY_REQUIRED`.
- `COMPLETED` requires a completion time and unique reconciliation reference. The application generates the reference when admin does not provide a bank transaction code.
- Bank transaction code, receipt image, and admin note are optional evidence. The UI keeps them in an advanced reconciliation section.
- Admin must verify the recipient name displayed by the banking application; the QR is a transfer instruction, not proof that money moved.
- Incoming `payment_transaction` rows are immutable evidence and are not rewritten as refunds.
- Optional proof files accept JPG, PNG, or WebP up to 5 MB and use the dedicated Cloudinary refund folder.
- The application does not claim that money was refunded until an authenticated administrator explicitly confirms the banking application reported success. The processor and completion time form the required audit trail until provider reconciliation is integrated.
- Refund email never includes the full bank account number, bank credentials, password, PIN, or OTP. Dynamic text is HTML-escaped before rendering.

## Related endpoints

- `POST /api/admin/bookings/{id}/cancellation-request/approve`
- `POST /api/admin/bookings/{id}/cancellation-request/reject`
- `GET /api/admin/refunds`
- `POST /api/admin/refunds/{id}/start`
- `POST /api/admin/refunds/{id}/complete`
- `POST /api/admin/refunds/{id}/fail`
- `POST /api/admin/refunds/proofs`
- `GET /api/bookings/{bookingId}/refund`

## Data touched

- `booking`: final booking status.
- booking cancellation fields: request status, reason, review metadata, approved amount and expected date.
- `booking_refund`: reconciliation lifecycle, amount, method, evidence and timestamps.
- Refund destination is stored as an immutable snapshot on `booking_refund`; QR URLs are derived and are not persisted.
- `payment_transaction`: read-only reference to the latest successful incoming transaction.
- `app_notification`: customer refund result notification.

## Current implementation notes

- The refund core is feature-first and follows hexagonal boundaries: web controllers call `RefundUseCaseService`, which uses persistence and notification ports.
- The booking use case creates the pending refund through `CreatePendingRefundPort`; it does not depend on the JPA refund repository.
- Manual bank/provider execution is intentional until verified gateway refund APIs and credentials are available. Completion uses one-action admin attestation with an automatically generated reconciliation reference; optional bank evidence can be retained for exceptions.

## Known gaps

- Automatic provider refund submission and webhook reconciliation are not implemented.
- Partial refund policies, cancellation fees, and accounting export are not implemented.
- A future provider integration should add an idempotency key and retain every provider attempt in a separate append-only table.
