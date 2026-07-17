# AI booking agent

## Business goal

Help guests discover a suitable room through natural conversation while keeping pricing, availability, booking creation and payment under deterministic backend control.

## Actors

- Guest (anonymous or authenticated)
- HomeBot booking agent
- Room availability and booking use cases
- Gemini language service (optional)

## Preconditions

- Public room, room-tier, amenity and review data are available.
- A write action still requires the normal authenticated booking flow.
- Gemini may be unavailable; deterministic database rules must continue to work.

## Main flow

1. The guest describes a need in one or several messages.
2. HomeBot accumulates check-in date, check-out date, adults, children, budget, bedrooms, beds and amenities in a client-session context.
3. HomeBot asks one focused question for the next required field.
4. Once dates and guest count are complete, the backend checks real room data and booking overlaps.
5. HomeBot presents matching rooms with image, nightly price, capacity and sleeping layout.
6. The guest chooses a room; HomeBot repeats the selected room, stay and guest count for confirmation.
7. The guest explicitly continues to the existing booking modal from the confirmation action.
8. The existing booking flow rechecks availability and price, requires login, creates the booking and starts payment.

## Alternate and error flows

- No exact match: explain that no room meets every condition and offer the room list so the guest can relax filters.
- Gemini unavailable: return the deterministic database-backed response.
- Anonymous guest: preserve the existing quick-booking draft and redirect through login.
- Availability changes after a recommendation: the normal booking use case rejects the stale choice on its final availability check.
- Guest asks about payment, cancellation, coupons or add-ons: answer that intent without discarding the booking context.
- Guest selects “new conversation”: clear only the browser session context; no database data is changed.

## Business rules

- One night is 22 hours: check-in at 14:00 and check-out at 12:00 the next day.
- Chatting, viewing recommendations or opening a room never holds inventory.
- Only the normal booking/payment use case may create a hold.
- The payment QR and room hold last exactly five minutes.
- Online payment supports a 50% deposit or full payment.
- Gemini can phrase answers but must not invent rooms, prices, promotions, availability or booking state.
- A booking is never created solely from ambiguous natural-language text; the guest must explicitly continue through confirmation.
- Conversation context, transcript and quick replies are stored in versioned `sessionStorage`, not persisted as a customer profile or booking record.

## Related endpoints

- `POST /api/ai/chat`
- `GET /api/ai/suggested-questions`
- Existing public room, availability, booking confirmation and payment endpoints

## Data touched

- Reads rooms, room tiers, equipment, review aggregates, active coupons and blocking booking intervals.
- Does not write booking or payment data during chat.
- The downstream existing confirmation flow performs all writes.

## Current implementation notes

- The orchestration is deterministic and stateful across browser-session turns.
- Gemini remains optional and is used for broad natural-language answers; booking slot collection and tool decisions stay in Java.
- Room cards separate “view” from “choose”; choosing a room requires a second explicit confirmation before opening the booking form.
- The chat panel restores the bounded recent transcript and collected requirements after a same-tab reload.
- Room deep-links prefill the selected stay dates, but booking creation remains in the established transactional booking use case.

## Known gaps

- Conversation context is not shared across devices and intentionally expires with the browser session.
- Voice input, multilingual conversation and a persisted agent audit trail are not implemented.
- Direct server-side booking creation from the chat panel is intentionally deferred because the current confirmation screen provides the safest explicit-consent boundary.
