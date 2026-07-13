# UC010 - Customer cancel booking with refund notification

## Business goal

Allow a customer to cancel a paid booking before the 24-hour policy deadline and receive a 100% refund confirmation by email and in-app notification.

## Actors

- Customer
- Booking system
- Email service
- In-app notification store

## Preconditions

- Customer is authenticated.
- Booking belongs to the authenticated customer.
- Booking has not been cancelled or completed.
- Booking start time is at least 24 hours after the cancellation request.

## Main flow

1. Customer requests cancellation for a booking.
2. Backend verifies ownership, status, and the 24-hour cancellation policy.
3. Backend sets booking status to `CANCELLED`.
4. Backend calculates refund amount as 100% of the booking total.
5. Backend creates an in-app notification with customer name, booking code, refund amount, refund method, and expected refund date.
6. Backend sends an email with the same template variables.
7. Backend returns the cancelled booking and refund summary.

## Alternate and error flows

- Booking not found or belongs to another customer: backend rejects the request.
- Booking already cancelled or completed: backend rejects the request.
- Cancellation is within 24 hours of the start time: backend rejects the request.
- Email delivery failure: backend returns an error and cancellation is not committed.

## Business rules

- Refund percentage is 100%.
- Expected refund date defaults to current time plus `app.refund.expected-days` days.
- Online payments are described as refunded to the original online payment method.
- Cash payments are described as refunded at the counter.

## Related endpoints

- `PUT /api/bookings/{id}/cancel`

## Data touched

- Updates `booking.status`.
- Inserts `app_notification`.

## Current implementation notes

- Implemented incrementally inside the booking use-case service.
- Notification content is template-based in `BookingCancellationNotificationService`.
- The refund summary (amount, percentage, method, expected date) is computed and communicated, but no `payment_transaction` refund row is written and no money is moved.

## Known gaps / follow-up (deliberately deferred)

- **Automated refund disbursement is not implemented and is intentionally deferred.** Actually returning money requires calling the live SePay/VNPay refund API with production merchant credentials, which is not available in this environment; implementing a fake disbursement would misrepresent behaviour.
- Recording a `REFUNDED` reconciliation row would require adding a value to the PostgreSQL `payment_transaction_status` named enum (a payment-table schema migration). This is scoped as a follow-up to be done alongside the real disbursement integration, so the enum and the code that sets it land together rather than leaving an unused status.
- Until then, cancellations of paid bookings should be reconciled manually by staff using the booking status change plus the emailed/in-app refund summary.
