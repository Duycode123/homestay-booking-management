# SOLID Refactoring Baseline

## Goal

Move the repository toward SOLID and feature-first hexagonal architecture without changing existing API contracts or attempting a high-risk rewrite.

SOLID is evaluated through concrete boundaries:

- **SRP**: web adapters parse/map HTTP, use cases orchestrate business behavior, domain models hold business state, and persistence adapters handle JPA.
- **OCP**: external behavior is exposed through ports so another persistence or integration adapter can be added without changing the use case.
- **LSP**: port implementations must preserve the contract expressed by the port and its tests.
- **ISP**: inbound ports represent one caller intention; outbound ports expose only the persistence or integration operations required by that feature.
- **DIP**: controllers and application services depend on port interfaces rather than concrete services or Spring Data repositories.

## Current Baseline

The repository is already partly migrated. Booking, user, room, auth, equipment, coupon, reporting, attendance, staff scheduling, and other features contain feature-first packages and ports. The remaining legacy code is not considered migrated merely because it uses a service interface.

The first enforced slices are:

- `homepage`: controller depends on `GetRecentHomepageActivitiesUseCase`; the use case depends on `LoadRecentHomepageBookingsPort`; JPA mapping lives in `HomepageBookingPersistenceAdapter`.
- `support`: customer/admin controllers depend on focused inbound ports; application logic depends on context/report ports; support business state is represented by domain models; JPA mapping lives in outbound adapters.
- `payment` (partial): the web adapter depends on focused session/query/form use-case ports. SePay QR generation, hosted-form fields, return URLs, and HMAC signing live behind `BuildSePayCheckoutPort` in `SePayCheckoutAdapter`.
- `booking expiry`: the scheduled service owns scheduling/cutoff policy while `BookingExpiryPersistenceAdapter` owns JPA state updates.
- `token revocation`: JWT expiration parsing and revoked-token persistence are separate outbound ports/adapters.
- `frontend staff rooms`: backend mapping, UI metadata, types, and facility-condition translations live in `staff-rooms-domain.ts` instead of the page component.
- `frontend staff schedule`: geolocation acquisition and distance policy live in `staff-location.ts` instead of the schedule page.

`HexagonalBoundaryTest` prevents these slices from regressing to direct `entity`, `repository`, JPA, or Spring Data dependencies in their core.

## Migration Order

Refactor one feature at a time and keep endpoints stable:

1. Payment checkout and webhook: finish separating payment state transitions and persistence. Signing/URL creation and provider lookup are already behind outbound ports.
2. Booking: split the large orchestration service into focused command/query handlers while retaining existing inbound port contracts.
3. Review: introduce domain/application ports and move repository access behind persistence adapters.
4. AI consultant: separate catalog queries, ranking/prompt construction, provider transport, and response mapping.
5. Security and scheduled jobs: replace direct repository dependencies with focused token/booking expiry ports.
6. Frontend staff/admin pages: extract data hooks, state reducers, and focused presentational components from the largest page components.

## Definition of Done per Feature

- HTTP routes and response shapes remain compatible unless a behavior change is explicitly requested.
- Controllers import inbound ports, not concrete application services, repositories, or JPA entities.
- Application/domain code has no dependency on JPA, Spring Data, servlet APIs, or HTTP DTOs.
- Business rules are covered by fast application/domain tests.
- Persistence and external integrations implement outbound ports.
- The relevant use-case document describes current implementation and known gaps.
- Backend tests and frontend type/build checks pass.

## Known Legacy Hotspots

- `AiConsultantServiceImpl` combines catalog access, recommendation logic, prompt construction, and AI integration.
- `PaymentWebhookServiceImpl` combines provider verification, transaction reconciliation, and booking state changes.
- `PaymentCheckoutUseCaseService` still depends directly on JPA repositories; signing and URL concerns have been extracted.
- `BookingUseCaseService` implements many distinct commands and queries in one class.
- `ReviewServiceImpl`, coupon tracking, cancellation notifications, and some legacy security services still access repositories directly.
- Large frontend staff pages combine remote data access, state transitions, layout, and presentation.

These are migration gaps, not completed SOLID conversions. They should be handled incrementally with regression tests rather than by package-only moves.
