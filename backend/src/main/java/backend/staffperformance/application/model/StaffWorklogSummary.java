package backend.staffperformance.application.model;

import java.math.BigDecimal;

public record StaffWorklogSummary(
        long totalShifts,
        BigDecimal totalHours,
        long lateCount,
        long missingCheckout
) {
}
