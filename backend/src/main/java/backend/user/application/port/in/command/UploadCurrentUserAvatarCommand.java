package backend.user.application.port.in.command;

public record UploadCurrentUserAvatarCommand(
        String currentUserEmail,
        String fileName,
        String contentType,
        byte[] content
) {
}
