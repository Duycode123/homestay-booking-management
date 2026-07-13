package backend.room.application.port.in.query;

import backend.entity.RoomStatus;

public record ListRoomsQuery(
        Integer roomTypeId,
        RoomStatus status,
        String search,
        Integer minCapacity,
        Integer page,
        Integer size
) {

    public ListRoomsQuery(Integer roomTypeId, RoomStatus status) {
        this(roomTypeId, status, null, null, null, null);
    }
}
