package backend.review.adapter.in.web.dto;

import backend.review.application.model.ReviewImageUploadResult;

public record ReviewImageUploadResponse(
        String publicId,
        String secureUrl
) {
    public static ReviewImageUploadResponse from(ReviewImageUploadResult result) {
        return new ReviewImageUploadResponse(result.publicId(), result.secureUrl());
    }
}
