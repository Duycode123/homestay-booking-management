package backend.report.adapter.in.web.mapper;

import backend.report.adapter.in.web.dto.RoomPerformanceReportResponse;
import backend.report.adapter.in.web.dto.RoomPerformanceSummaryResponse;
import backend.report.domain.model.RoomPerformanceReport;
import backend.report.domain.model.RoomPerformanceSummary;
import org.springframework.stereotype.Component;

@Component
public class RoomPerformanceReportWebMapper {

    public RoomPerformanceReportResponse toResponse(RoomPerformanceReport report) {
        return new RoomPerformanceReportResponse(
                report.startDate(),
                report.endDate(),
                report.totalSuccessfulBookings(),
                report.rooms().stream().map(this::toRoomResponse).toList()
        );
    }

    private RoomPerformanceSummaryResponse toRoomResponse(RoomPerformanceSummary room) {
        return new RoomPerformanceSummaryResponse(
                room.roomId(),
                room.roomName(),
                room.roomTypeName(),
                room.successfulBookingCount()
        );
    }
}
