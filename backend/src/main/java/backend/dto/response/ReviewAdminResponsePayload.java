package backend.dto.response;

import backend.entity.ReviewAdminResponse;

import java.time.LocalDateTime;

public record ReviewAdminResponsePayload(
        Integer id,
        String responderRole,
        String content,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public static ReviewAdminResponsePayload from(ReviewAdminResponse response) {
        return new ReviewAdminResponsePayload(
                response.getId(),
                response.getResponder().getRole().name(),
                response.getContent(),
                response.getCreatedAt(),
                response.getUpdatedAt()
        );
    }
}
