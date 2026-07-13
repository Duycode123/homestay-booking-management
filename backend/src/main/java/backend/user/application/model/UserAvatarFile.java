package backend.user.application.model;

public record UserAvatarFile(
        String fileName,
        String contentType,
        byte[] content
) {
}
