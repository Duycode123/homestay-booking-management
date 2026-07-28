# End-to-End Test Traceability

| Flow | Automated evidence | External evidence still required |
| --- | --- | --- |
| Public homepage | `homepage renders the primary booking experience` | None |
| Login accessibility | `login form exposes accessible fields and password visibility` | Screen-reader manual pass |
| Login rejection | `login failure from backend is shown without losing entered credentials` | Live backend smoke test |
| Room catalog outage | `public room catalog remains usable when backend is temporarily unavailable` | None |
| Room price validation | `RoomPriceValidationTest` | Admin browser demonstration |
| Booking overlap | `BookingUseCaseServiceTest` suite | Two-browser concurrency demo |
| Payment lifecycle | payment checkout and webhook test suites | SePay/VNPay sandbox credentials |
| Cancellation/refund | booking cancellation and refund test suites | Admin/customer browser demonstration |
| Staff attendance | attendance application tests | Geolocation-enabled device demo |

## Next browser scenarios

The next E2E layer should run against the Docker Compose stack and a disposable
PostgreSQL database:

1. Customer registration and verification using a local mail catcher.
2. Customer login, room search, booking creation, and payment-session creation.
3. Two isolated browser contexts competing for the same room and stay period.
4. Customer cancellation followed by administrator approval and refund tracking.
5. Staff attendance, room-condition reporting, and checkout.
6. Customer review followed by administrator approval and response.

These scenarios require deterministic seed accounts and resettable database state;
they must not run against production or a developer's personal payment account.
