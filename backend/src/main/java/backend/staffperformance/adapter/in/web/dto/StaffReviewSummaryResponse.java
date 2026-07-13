package backend.staffperformance.adapter.in.web.dto;

import backend.staffperformance.application.model.StaffReviewSummary;

import java.math.BigDecimal;
import java.util.List;

public record StaffReviewSummaryResponse(
        BigDecimal avgRating,
        List<StaffPerformanceReviewResponse> items
) {
    public static StaffReviewSummaryResponse from(StaffReviewSummary summary) {
        return new StaffReviewSummaryResponse(
                summary.avgRating(),
                summary.items().stream()
                        .map(StaffPerformanceReviewResponse::from)
                        .toList()
        );
    }
}
