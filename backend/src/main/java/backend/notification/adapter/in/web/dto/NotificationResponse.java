package backend.notification.adapter.in.web.dto;

import backend.notification.application.model.NotificationItem;

import java.time.LocalDateTime;

public record NotificationResponse(
        Long id,
        String type,
        String title,
        String message,
        LocalDateTime createdAt,
        String priority,
        String actionUrl,
        boolean isRead,
        boolean isResolved
) {
    public static NotificationResponse from(NotificationItem item) {
        return new NotificationResponse(
                item.id(), item.type(), item.title(), item.message(), item.createdAt(),
                item.priority().name(), item.actionUrl(), item.read(), item.resolved()
        );
    }
}
