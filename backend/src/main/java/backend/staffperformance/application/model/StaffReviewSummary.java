package backend.staffperformance.application.model;

import java.math.BigDecimal;
import java.util.List;

public record StaffReviewSummary(
        BigDecimal avgRating,
        List<StaffPerformanceReview> items
) {
}
