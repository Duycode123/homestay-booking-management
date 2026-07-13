package backend.user.application.port.in;

import backend.dto.response.UserResponse;
import backend.user.application.port.in.command.UploadCurrentUserAvatarCommand;

public interface UploadCurrentUserAvatarUseCase {
    UserResponse uploadAvatar(UploadCurrentUserAvatarCommand command);
}
