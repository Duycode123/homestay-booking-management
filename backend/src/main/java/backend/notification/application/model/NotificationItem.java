package backend.notification.application.model;

import java.time.LocalDateTime;

public record NotificationItem(
        Long id,
        String type,
        String title,
        String message,
        LocalDateTime createdAt,
        NotificationPriority priority,
        String actionUrl,
        boolean read,
        boolean resolved
) {
}
