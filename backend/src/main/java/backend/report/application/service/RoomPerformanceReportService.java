package backend.report.application.service;

import backend.report.domain.model.RoomPerformanceReport;
import backend.report.domain.model.RoomPerformanceSummary;
import backend.report.domain.port.in.GetRoomPerformanceReportQuery;
import backend.report.domain.port.in.GetRoomPerformanceReportUseCase;
import backend.report.domain.port.out.RoomPerformanceReportPort;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class RoomPerformanceReportService implements GetRoomPerformanceReportUseCase {

    private final RoomPerformanceReportPort reportPort;

    @Override
    @Transactional(readOnly = true)
    public RoomPerformanceReport getRoomPerformanceReport(GetRoomPerformanceReportQuery query) {
        validate(query);

        LocalDateTime from = query.startDate().atStartOfDay();
        LocalDateTime to = query.endDate().plusDays(1).atStartOfDay();
        List<RoomPerformanceSummary> rooms = reportPort.loadRoomPerformanceSummaries(from, to);
        long totalSuccessfulBookings = rooms.stream()
                .mapToLong(RoomPerformanceSummary::successfulBookingCount)
                .sum();

        return new RoomPerformanceReport(
                query.startDate(),
                query.endDate(),
                totalSuccessfulBookings,
                rooms
        );
    }

    private void validate(GetRoomPerformanceReportQuery query) {
        if (query == null) {
            throw new IllegalArgumentException("Room performance report query is required");
        }
        if (query.startDate() == null) {
            throw new IllegalArgumentException("startDate is required");
        }
        if (query.endDate() == null) {
            throw new IllegalArgumentException("endDate is required");
        }
        if (query.endDate().isBefore(query.startDate())) {
            throw new IllegalArgumentException("endDate must be on or after startDate");
        }
    }
}
