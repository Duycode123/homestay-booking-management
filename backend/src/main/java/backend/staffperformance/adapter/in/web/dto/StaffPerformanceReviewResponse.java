package backend.staffperformance.adapter.in.web.dto;

import backend.staffperformance.application.model.StaffPerformanceReview;

import java.time.LocalDateTime;

public record StaffPerformanceReviewResponse(
        Integer rating,
        String content,
        Integer bookingId,
        LocalDateTime createdAt
) {
    public static StaffPerformanceReviewResponse from(StaffPerformanceReview review) {
        return new StaffPerformanceReviewResponse(
                review.rating(),
                review.content(),
                review.bookingId(),
                review.createdAt()
        );
    }
}
