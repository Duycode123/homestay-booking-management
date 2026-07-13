package backend.staffnotification.adapter.in.web.dto;

import backend.staffnotification.application.model.StaffNotificationItem;

import java.time.LocalDateTime;

public record StaffNotificationResponse(
        Long id,
        String type,
        String title,
        String message,
        LocalDateTime createdAt,
        String priority,
        boolean isRead,
        boolean isResolved
) {
    public static StaffNotificationResponse from(StaffNotificationItem item) {
        return new StaffNotificationResponse(
                item.id(),
                item.type(),
                item.title(),
                item.message(),
                item.createdAt(),
                item.priority().name(),
                item.read(),
                item.resolved()
        );
    }
}
