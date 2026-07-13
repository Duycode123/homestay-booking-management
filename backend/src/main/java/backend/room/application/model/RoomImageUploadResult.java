package backend.room.application.model;

public record RoomImageUploadResult(
        String publicId,
        String secureUrl
) {
}
