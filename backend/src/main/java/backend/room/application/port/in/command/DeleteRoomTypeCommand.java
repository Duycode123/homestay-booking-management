package backend.room.application.port.in.command;

public record DeleteRoomTypeCommand(
        Integer roomTypeId,
        String currentUserEmail
) {
}
