package backend.room.application.port.in.command;

public record UploadRoomImageAssetCommand(
        String currentUserEmail,
        String fileName,
        String contentType,
        byte[] content
) {
}
