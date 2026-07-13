package backend.homepage.application.model;

import java.time.LocalDateTime;

public record HomepageRecentActivity(
        String id,
        String customerName,
        String roomName,
        String action,
        LocalDateTime createdAt
) {
}
