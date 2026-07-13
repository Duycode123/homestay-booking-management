package backend.staffnotification.application.model;

import java.time.LocalDateTime;

public record StaffNotificationItem(
        Long id,
        String type,
        String title,
        String message,
        LocalDateTime createdAt,
        StaffNotificationPriority priority,
        boolean read,
        boolean resolved
) {
}
