package backend.staffnotification.application.model;

import backend.entity.Role;

public record StaffNotificationActor(
        Integer accountId,
        Integer staffId,
        Role role
) {
}
