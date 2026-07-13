package backend.room.application.model;

public record RoomImageFile(
        String fileName,
        String contentType,
        byte[] content
) {
}
