# UC010 - Customer cancel booking with refund notification

## Business goal

Allow a customer to cancel a paid or deposit-paid booking before the 24-hour policy deadline and receive a 100% refund confirmation for the amount actually collected.

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
3. Backend creates a cancellation request in `PENDING`; the booking and room reservation stay active while admin reviews it.
4. Admin approval sets the booking to `CANCELLED`, releases availability, and calculates the refund as the booking total for a fully paid booking or the successful collected amount for a deposit-paid booking.
5. Backend creates a unique `booking_refund` in `PENDING` and sends the approval/expected-date notification.
6. Admin moves the refund through `PROCESSING` to `COMPLETED` with one confirmation after the banking application reports success. The system generates a unique reconciliation reference when the optional bank code is omitted; an optional Cloudinary proof image may also be retained. A failed transfer moves to `RETRY_REQUIRED`.
7. Customer reads a three-step timeline from `GET /api/bookings/{id}/refund`.

## Alternate and error flows

- Booking not found or belongs to another customer: backend rejects the request.
- Booking already cancelled or completed: backend rejects the request.
- Cancellation is within 24 hours of the start time: backend rejects the request.
- Email delivery failure: in-app state remains authoritative and the mail failure is logged; financial state is not rolled back because of a notification outage.

## Business rules

- Refund percentage is 100%.
- A deposit-paid booking refunds only the collected deposit, not the unpaid booking balance.
- Expected refund date defaults to current time plus `app.refund.expected-days` days.
- Online payments are described as refunded to the original online payment method.
- Cash payments are described as refunded at the counter.

## Related endpoints

- `PUT /api/bookings/{id}/cancel`

## Data touched

- Updates `booking.status`.
- Inserts `app_notification`.

## Current implementation notes

- Cancellation approval remains inside the booking use-case boundary; refund reconciliation is implemented in the feature-first `refund` module with explicit inbound/outbound ports.
- Notification content is template-based in `BookingCancellationNotificationService`.
- Successful online payment amounts are loaded through `LoadSuccessfulPaymentAmountPort`; cancellation is rejected for manual reconciliation if no successful amount can be established.
- The original successful payment remains immutable. A separate `booking_refund` row records the manual transfer lifecycle and proof without falsifying the original payment transaction.

## Known gaps / follow-up (deliberately deferred)

- **Automated provider disbursement remains deferred.** Real provider reversal requires supported production merchant APIs and credentials. The implemented center records authenticated admin confirmation, completion time, and a unique reconciliation reference, with optional bank code/proof. It does not pretend that cancellation approval itself moved money.
