package backend.user.application.port.in;

import backend.dto.response.UserResponse;
import backend.user.application.port.in.query.GetCurrentUserProfileQuery;

public interface GetCurrentUserProfileUseCase {
    UserResponse getProfile(GetCurrentUserProfileQuery query);
}
