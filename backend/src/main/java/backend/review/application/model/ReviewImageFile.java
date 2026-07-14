package backend.review.application.model;

public record ReviewImageFile(
        String fileName,
        String contentType,
        byte[] content
) {
}
