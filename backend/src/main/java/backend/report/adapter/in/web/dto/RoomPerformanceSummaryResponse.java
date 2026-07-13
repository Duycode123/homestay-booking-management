package backend.report.adapter.in.web.dto;

public record RoomPerformanceSummaryResponse(
        Integer roomId,
        String roomName,
        String roomTypeName,
        long successfulBookingCount
) {
}
