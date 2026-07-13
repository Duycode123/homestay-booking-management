package backend.staffperformance.application.model;

import java.time.LocalDateTime;

public record StaffPerformanceReview(
        Integer rating,
        String content,
        Integer bookingId,
        LocalDateTime createdAt
) {
}
