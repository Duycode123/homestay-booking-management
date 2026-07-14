package backend.review.application.model;

public record ReviewImageUploadResult(
        String publicId,
        String secureUrl
) {
}
