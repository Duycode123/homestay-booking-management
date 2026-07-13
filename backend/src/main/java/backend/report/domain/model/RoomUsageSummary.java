package backend.report.domain.model;

import java.math.BigDecimal;

public record RoomUsageSummary(
        Integer roomId,
        String roomName,
        String roomTypeName,
        BigDecimal revenue,
        long bookingCount,
        BigDecimal usageHours
) {
}
