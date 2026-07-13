# Project Documentation

This folder contains the living backend-oriented documentation for the Homestay Booking Management project.

## Purpose

The source SRS and backlog documents are useful, but they are large and mix target scope with implementation ideas. The docs in this repository are intended to be:

- easier to keep in sync with code
- explicit about what is already implemented
- explicit about gaps that still exist
- aligned with the hexagonal direction of the backend

## Source Priority

When deciding what is true, use this order:

1. current user instruction
2. `AGENTS.md`
3. docs in this folder
4. `database/` docs and migrations
5. current code
6. external SRS and backlog exports

## Structure

- `docs/use-cases/`: normalized use case documents and traceability

## Maintenance Rule

If a task changes business behavior, API flow, or persistence semantics, update the relevant documentation in the same task when practical.
