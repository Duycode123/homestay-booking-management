package backend.user.application.port.in;

import backend.user.application.model.UserProfileUpdateResult;
import backend.user.application.port.in.command.UpdateCurrentUserProfileCommand;

public interface UpdateCurrentUserProfileUseCase {
    UserProfileUpdateResult updateProfile(UpdateCurrentUserProfileCommand command);
}
