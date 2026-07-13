package backend.staffperformance.adapter.in.web.dto;

import backend.staffperformance.application.model.StaffWorklogSummary;

import java.math.BigDecimal;

public record StaffWorklogSummaryResponse(
        long totalShifts,
        BigDecimal totalHours,
        long lateCount,
        long missingCheckout
) {
    public static StaffWorklogSummaryResponse from(StaffWorklogSummary summary) {
        return new StaffWorklogSummaryResponse(
                summary.totalShifts(),
                summary.totalHours(),
                summary.lateCount(),
                summary.missingCheckout()
        );
    }
}
