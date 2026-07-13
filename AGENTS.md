# AGENTS.md

## Scope

This repository contains:

- `backend/`: Spring Boot 3.5.x, Java 21, Maven, Spring Web, Spring Data JPA, Spring Security
- `frontend/`: Next.js application
- `database/`: database scripts and related assets

Unless the user explicitly asks for frontend work, prioritize the backend in this repo.

## Backend Priority

The main collaborator for this project is a backend developer. When working in `backend/`, optimize for:

- clean business boundaries
- predictable API behavior
- incremental refactoring instead of broad rewrites
- preserving current behavior unless the task explicitly changes it
- tests for business rules and regression-prone flows

## Architectural Direction

The target architecture for `backend/` is **hexagonal architecture** implemented incrementally.

Current code is mostly layered:

- `controller`
- `service`
- `repository`
- `entity`

Do not force a full rewrite in one task. Prefer feature-by-feature migration.

## Hexagonal Rules

When adding new backend code or refactoring existing backend code, follow these rules:

1. Business logic belongs in the application/domain core, not in controllers or JPA repositories.
2. Controllers are inbound adapters. They should only:
   - parse HTTP input
   - call a use case
   - map the result to HTTP response DTOs
3. Persistence, JWT, email, payment gateways, and external integrations are outbound adapters.
4. The core must not depend directly on Spring MVC, Spring Data JPA repositories, servlet APIs, or HTTP DTOs.
5. Domain models must not depend on infrastructure concerns.
6. Request/response DTOs must not leak into the domain layer.
7. Spring Data repositories should stay inside persistence adapters and should not be injected directly into controllers.
8. `@Transactional` should live at the application/use-case boundary, not in controllers.

## Preferred Package Shape

For new or refactored backend features, prefer **feature-first** packaging with hexagonal boundaries inside each feature.

Example target structure:

```text
backend/src/main/java/backend/
  booking/
    domain/
      model/
      service/
      port/
        in/
        out/
    application/
      usecase/
      service/
    adapter/
      in/
        web/
          dto/
          mapper/
      out/
        persistence/
          entity/
          repository/
          mapper/
        payment/
        security/
```

Apply the same pattern for features like:

- `auth`
- `booking`
- `payment`
- `room`
- `user`

## Dependency Rule

Allowed direction of dependencies:

```text
adapter/in -> application -> domain
application -> domain
adapter/out -> domain/application port contracts
```

Not allowed:

- `controller -> repository`
- `controller -> entity`
- `domain -> JPA entity`
- `domain -> Spring framework annotations except where migration constraints make it temporarily unavoidable`
- `application -> HTTP request/response DTO`

## Persistence Guidance

When persistence is involved:

- treat JPA entities as persistence models, not domain models
- keep Spring Data interfaces in persistence adapters
- map between persistence entities and domain models explicitly
- avoid returning JPA entities directly from controllers
- avoid spreading `Specification`, `PageRequest`, or query-building logic across controllers

If a task only touches legacy code, improve boundaries without introducing unnecessary churn.

## Use Case Design

For non-trivial backend behavior, prefer explicit use cases such as:

- `CreateBookingUseCase`
- `CalculateBookingCostUseCase`
- `GetRoomAvailabilityUseCase`
- `UpdateBookingStatusUseCase`

Use cases should:

- expose intention-revealing methods
- accept command/query style inputs
- return domain results or application result models
- orchestrate ports
- enforce transaction boundaries

## Validation Rules

Split validation by concern:

- HTTP shape validation: request DTO annotations and controller boundary
- business rule validation: application/domain layer
- persistence constraints: database and adapter layer

Examples of business rules that belong outside controllers:

- booking overlap checks
- role-based management constraints
- room maintenance availability rules
- payment state transitions

## Testing Strategy

When changing backend code, prefer this testing pyramid:

1. domain/application unit tests without Spring
2. adapter tests with focused slices such as `@WebMvcTest` or repository tests
3. `@SpringBootTest` only when cross-layer wiring is the real thing under test

For every meaningful business-rule change, add or update tests near the changed feature.

## Migration Strategy

Because the backend is already in production-style layered code, migrate incrementally:

1. keep existing endpoints stable
2. extract a use-case boundary for the touched feature
3. introduce ports for persistence/external dependencies
4. move business logic out of legacy service classes
5. only move packages when the change clearly improves maintainability

Do not rename or move large areas of the backend unless the task explicitly asks for a broader refactor.

## Project-Specific Guidance

For this repo, the highest-value places to apply hexagonal structure first are:

- booking flows
- payment flows
- auth/security boundaries
- room availability logic

These areas already contain business rules and are likely to benefit most from clear ports and use cases.

## Documentation Sources

Treat documentation as part of the backend contract.

Use this priority order when sources disagree:

1. direct user instruction in the current task
2. this `AGENTS.md`
3. in-repo use case docs under `docs/use-cases/`
4. in-repo database docs under `database/` plus SQL migrations
5. current production code behavior
6. external SRS, backlog exports, and other off-repo reference documents

External documents such as SRS files, backlog exports, or meeting notes are useful source material, but they are not the living source of truth until their relevant parts are normalized into this repository.

## Use Case Documentation Rules

For meaningful backend flows, keep or create a use case document under `docs/use-cases/`.

Each use case document should capture:

- business goal
- actors
- preconditions
- main flow
- alternate/error flows
- business rules
- related endpoints
- data touched
- current implementation notes
- known gaps between desired SRS scope and current repo behavior

Use case names in documentation should closely match application/use-case names in code when those exist or when introducing them would help the hexagonal migration.

When a task changes business behavior, update the corresponding use case doc in the same task when practical.

Do not document unimplemented behavior as if it already exists. Mark gaps explicitly.

## Database Documentation Rules

Database documentation lives in `database/README.md`, SQL files under `database/`, and future focused docs that may be added there.

When changing schema or persistence behavior:

- add or update a migration script
- update the relevant database documentation
- update affected use case docs if business behavior changes

Document at least:

- table purpose
- important relationships
- enum/status meaning
- uniqueness and concurrency constraints
- lifecycle-sensitive fields such as timestamps, payment state, and cancellation state

Do not rely on JPA entities alone as the only database documentation.

For database naming:

- prefer English `snake_case` for new schema objects, table names, column names, and enum type names
- keep enum values in English as well
- do not create new Vietnamese-named schema objects unless maintaining an existing untouched legacy area
- when a legacy Vietnamese schema is being migrated, avoid partial mixed-language renames across the same bounded context unless the task explicitly scopes that migration
- keep Java model names in English even when JPA temporarily maps to legacy Vietnamese table or column names during migration

## Coding Conventions

When editing backend code:

- use constructor injection
- keep methods small and intention-revealing
- prefer explicit mappers over hidden implicit conversion
- keep exceptions meaningful and aligned with API behavior
- prefer domain-oriented names over framework-oriented names
- avoid editing generated files under `backend/target/`

## Commands

Useful backend commands:

```powershell
cd backend
mvn test
mvn -DskipTests compile
```

## Collaboration Notes For Agents

When handling backend tasks in this repo:

- explain how a change fits the hexagonal direction when relevant
- preserve user-visible behavior unless change is requested
- prefer incremental architectural improvements over theoretical purity
- if a task conflicts with the hexagonal target, call out the tradeoff clearly
