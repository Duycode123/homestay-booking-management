package backend.user.application.port.in;

import backend.dto.response.NotificationSettingsResponse;
import backend.user.application.port.in.query.GetCurrentUserProfileQuery;

public interface GetCurrentUserNotificationSettingsUseCase {
    NotificationSettingsResponse getNotificationSettings(GetCurrentUserProfileQuery query);
}
