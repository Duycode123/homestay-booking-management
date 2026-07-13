# AI room consultant chatbot

## Business goal

Help a customer ask natural-language questions about room options, pricing, capacity, availability, equipment, and review quality before booking.

## Actors

- Customer or anonymous visitor
- Backend AI consultant endpoint
- Gemini API provider when configured

## Preconditions

- Room, room type, equipment, and review data exists in the database.
- Booking data exists when availability for a requested time window must be checked.
- `gemini.ai.api-key` is configured when Gemini-generated answers are desired.

## Main flow

1. Client calls `POST /api/ai/chat` with a message.
2. Backend extracts intent hints such as people count, price ceiling, and time range.
3. Backend loads room, room type, price, capacity, status, image URL, equipment, approved review stats, booking availability context, and active coupon rules from the database.
4. Backend filters matching rooms using deterministic business rules.
5. Backend adds relevant booking, payment, coupon, cancellation, and fallback policy context.
6. If Gemini is configured, backend sends the customer message plus database context to Gemini.
7. Backend returns the Gemini answer, suggested room cards, interpreted filters, and suggested follow-up questions.

## Alternate and error flows

- Gemini API key is missing: backend returns a deterministic local answer from database rules.
- Gemini request fails: backend falls back to the deterministic local answer.
- No matching room is found: backend explains the missing condition and asks for another time, budget, or party size.
- Missing requested time: backend can suggest rooms by price/capacity/status and asks for a time window for exact availability.
- No exact match: backend explains the limiting factor and can suggest closest alternatives by capacity, price, or time availability.
- Room detail or equipment question: backend can answer from local database context even when Gemini is unavailable.

## Business rules

- Room, price, capacity, status, and availability facts must come from the database context.
- Equipment names, equipment status, equipment notes, image URLs, and approved review ratings must come from database context.
- Rooms in `MAINTENANCE` must not be suggested as bookable.
- Broken or maintenance equipment must be visible as unavailable equipment, not promised as ready.
- When a time range is known, rooms with blocking bookings are not bookable for that range.
- Gemini must not invent coupons, prices, room names, or availability.
- SePay payment details can be mentioned only as general checkout policy.
- The chatbot must not reveal customer names, emails, phone numbers, booking notes, payment references, provider secrets, or another customer's booking detail.
- Booking data exposed to the chatbot is limited to availability checks and aggregate room schedule hints.
- Natural language time ranges such as `13h-15h`, `13:30-15:00`, explicit dates such as `07/07`, and start-plus-duration phrasing such as `luc 13h trong 2 tieng` are interpreted before availability lookup.

## Related endpoints

- `POST /api/ai/chat`
- `GET /api/ai/suggested-questions`

## Data touched

- Reads `room`.
- Reads `room_type`.
- Reads `equipment`.
- Reads approved `review` aggregates through completed booking relationships.
- Reads `booking` for overlap checks.
- Reads active `discount_code` rules for public coupon guidance.

## Current implementation notes

- Implemented by `AiConsultantServiceImpl`.
- The endpoint keeps the existing response shape used by the frontend chatbot.
- Gemini integration is implemented by `GeminiAiClient`.
- Configuration lives under `gemini.ai.*`.
- Room context now includes room images, equipment summaries, unavailable equipment, approved review rating/count, upcoming booking aggregates, requested-time availability, and active coupon guidance.

## Known gaps

- Chat history is not persisted.
- Retrieval is currently based on structured rooms and blocking bookings, not embeddings.
- The chatbot does not create bookings directly.
