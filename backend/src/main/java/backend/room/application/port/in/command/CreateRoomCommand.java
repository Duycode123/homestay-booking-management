package backend.room.application.port.in.command;

import backend.entity.RoomStatus;

public record CreateRoomCommand(
        String roomName,
        Integer roomTypeId,
        Integer maxPeople,
        String imageUrl,
        RoomStatus status,
        String currentUserEmail
) {
}
