package backend.room.application.port.in.command;

public record DeleteRoomCommand(
        Integer roomId,
        String currentUserEmail
) {
}
