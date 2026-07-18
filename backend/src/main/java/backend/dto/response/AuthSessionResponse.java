package backend.dto.response;

import lombok.Builder;

@Builder
public record AuthSessionResponse(
        Integer id,
        String role,
        String email,
        String avatarUrl
) {
}
