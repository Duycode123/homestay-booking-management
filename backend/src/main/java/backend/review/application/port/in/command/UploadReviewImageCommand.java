package backend.review.application.port.in.command;

public record UploadReviewImageCommand(
        String customerEmail,
        String fileName,
        String contentType,
        byte[] content
) {
}
