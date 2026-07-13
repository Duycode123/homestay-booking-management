package backend.room.application.port.in.command;

import backend.entity.RoomStatus;

public record UpdateRoomStatusCommand(
        Integer roomId,
        RoomStatus status,
        String currentUserEmail
) {
}
