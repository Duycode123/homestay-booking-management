package backend.user.application.port.in;

import backend.dto.response.NotificationSettingsResponse;
import backend.user.application.port.in.command.UpdateCurrentUserNotificationSettingsCommand;

public interface UpdateCurrentUserNotificationSettingsUseCase {
    NotificationSettingsResponse updateNotificationSettings(UpdateCurrentUserNotificationSettingsCommand command);
}
