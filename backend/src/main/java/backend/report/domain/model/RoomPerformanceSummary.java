package backend.report.domain.model;

public record RoomPerformanceSummary(
        Integer roomId,
        String roomName,
        String roomTypeName,
        long successfulBookingCount
) {
}
