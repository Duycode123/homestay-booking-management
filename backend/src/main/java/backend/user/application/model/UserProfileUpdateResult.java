package backend.user.application.model;

import backend.dto.response.UserResponse;

public record UserProfileUpdateResult(
        UserResponse userResponse,
        String accessToken,
        String refreshToken
) {
}
