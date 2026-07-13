# UC002 - List Rooms

## Metadata

- Source: Product Backlog `UC002`
- Primary actor: Customer
- Current status in repo: Implemented core flow

## Goal

Allow a customer to browse available rooms and narrow the list to rooms that match their needs.

## Related Endpoints

- `GET /api/rooms`

## Preconditions

- Room data exists in the system.
- Public room listing is allowed without authentication.

## Main Flow

1. Customer opens the room listing page.
2. Frontend calls the room list endpoint.
3. Backend returns room summaries.
4. Customer optionally applies filters.
5. Frontend refreshes the list with the selected filters.

## Alternate and Error Flows

- No matching rooms: frontend should show an empty state.
- Invalid filter value: backend rejects invalid enum or malformed query values.

## Business Rules

- Only rooms that belong to the active dataset should be shown.
- Room cards can display persisted `imageUrl` and `maxPeople` values from the backend response.
- Listing logic should not expose internal persistence details.
- Filtering rules should stay consistent with room status semantics.

## Data Touched

- `Room`
- `RoomType`

## Current Implementation Notes

- Current backend supports `roomTypeId`, `status`, `search`, and `minCapacity` query parameters.
- `search` matches the room name case-insensitively (substring match); blank input is treated as no filter and LIKE wildcards in the input are escaped.
- `minCapacity` filters rooms whose `maxPeople` is greater than or equal to the given value and must be at least 1.
- Pagination is opt-in: when `page` or `size` is provided, the response is `ApiResponse<PagedResponse<RoomResponse>>` (defaults: `page=0`, `size=10`, max size 100). Without them, the response stays `ApiResponse<List<RoomResponse>>` so existing consumers are unaffected.
- Results are always sorted by room name ascending.
- Room summary payload includes stored image URL and maximum people capacity when available.
- Filtering is implemented with a JPA specification inside `RoomPersistenceAdapter`; the application layer only sees `RoomSearchCriteria` and `PageResult`.

## Known Gaps / Follow-up

- Search covers room name only; address/description search is not in the current schema.
- The name search is a leading-wildcard LIKE, which cannot use a btree index; acceptable at current data volume, revisit (e.g. `pg_trgm`) if the room table grows large.
- Clarify whether rooms in maintenance should be excluded completely or shown with status.

## Hexagonal Notes

Inbound port:

- `ListRoomsUseCase` (`getRooms` for the plain list, `getRoomsPage` for the paged variant)

Outbound port:

- `RoomCatalogPort.loadRooms(RoomSearchCriteria)` / `RoomCatalogPort.searchRooms(RoomSearchCriteria)`
