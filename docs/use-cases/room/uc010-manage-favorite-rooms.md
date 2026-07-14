# UC010 - Manage favorite rooms

## Business goal

Let a signed-in customer keep a persistent shortlist of rooms and start a booking quickly from that list.

## Actors

- Customer

## Preconditions

- The customer has an authenticated account.
- The target room exists.

## Main flow

1. Customer selects the heart on a room card.
2. The system stores the unique account/room pair and returns the favorite room summary.
3. The heart becomes active across the public site.
4. Customer opens the favorite-room panel beside the account menu.
5. Customer selects `Đặt nhanh`; the room catalog opens the existing quick-booking flow for that room.

## Alternate flows

- Selecting an active heart removes the room from favorites.
- Adding the same room twice is idempotent and does not create duplicates.
- An unauthenticated visitor is redirected to login before modifying favorites.
- A deleted/nonexistent room returns not found.

## Related endpoints

- `GET /api/favorites`
- `POST /api/favorites/{roomId}`
- `DELETE /api/favorites/{roomId}`

## Data touched

- `favorite_room`
- `account`
- `room`
