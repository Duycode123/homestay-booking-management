package backend.user.application.port.out;

import backend.user.application.model.UserAvatarFile;
import backend.user.application.model.UserAvatarUploadResult;

public interface UserAvatarStoragePort {
    UserAvatarUploadResult uploadAvatar(UserAvatarFile avatarFile);
}
