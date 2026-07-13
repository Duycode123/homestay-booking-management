package backend.room.application.port.out.model;

import backend.entity.RoomStatus;

public record RoomSearchCriteria(
        Integer roomTypeId,
        RoomStatus status,
        String search,
        Integer minCapacity,
        Integer page,
        Integer size
) {
}
