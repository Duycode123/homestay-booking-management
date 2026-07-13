package backend.report.adapter.in.web.dto;

import java.math.BigDecimal;

public record RoomUsageSummaryResponse(
        Integer roomId,
        String roomName,
        String roomTypeName,
        BigDecimal revenue,
        long bookingCount,
        BigDecimal usageHours
) {
}
