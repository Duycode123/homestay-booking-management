# Use Cases

This folder converts the source SRS and backlog material into use-case documents that are easier to maintain alongside code.

## Writing Standard

Each use case should capture:

- business goal
- actors
- preconditions
- main flow
- alternate and error flows
- business rules
- related backend endpoints
- data touched
- current implementation notes
- known gaps versus desired product scope

## Current Focus

The first pass in this repository focuses on flows that already exist in the backend codebase:

- authentication
- current user profile and avatar management
- room listing and room detail
- multi-location whole-accommodation catalog, map, and staff assignment
- create booking
- customer checkout and payment session handoff
- customer booking history
- customer issue reporting
- admin booking management
- review moderation and admin response
- equipment management
- staff check-in/check-out
- staff room/equipment condition reporting
- staff performance summary

## Traceability

See [traceability.md](./traceability.md) for the mapping between backlog UC IDs and current backend coverage.
