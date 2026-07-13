package backend.facilitycondition.application.port.in.command;

import backend.entity.RoomStatus;

public record UpdateRoomStatusCommand(
        String currentUserEmail,
        Integer roomId,
        RoomStatus status,
        String note,
        String imageUrl
) {
}
