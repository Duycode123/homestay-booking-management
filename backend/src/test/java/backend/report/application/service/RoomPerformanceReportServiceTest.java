package backend.report.application.service;

import backend.report.domain.model.RoomPerformanceReport;
import backend.report.domain.model.RoomPerformanceSummary;
import backend.report.domain.port.in.GetRoomPerformanceReportQuery;
import backend.report.domain.port.out.RoomPerformanceReportPort;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class RoomPerformanceReportServiceTest {

    @Test
    void returnsSortedRoomPerformanceAndInclusiveDateWindow() {
        CapturingReportPort reportPort = new CapturingReportPort(List.of(
                new RoomPerformanceSummary(1, "Deluxe Balcony 201", "Premium", 5),
                new RoomPerformanceSummary(2, "Deluxe City View 202", "Standard", 2),
                new RoomPerformanceSummary(3, "Studio C", "Standard", 0)
        ));
        RoomPerformanceReportService service = new RoomPerformanceReportService(reportPort);

        RoomPerformanceReport report = service.getRoomPerformanceReport(
                new GetRoomPerformanceReportQuery(
                        LocalDate.of(2026, 7, 1),
                        LocalDate.of(2026, 7, 3)
                )
        );

        assertEquals(LocalDateTime.of(2026, 7, 1, 0, 0), reportPort.capturedFrom);
        assertEquals(LocalDateTime.of(2026, 7, 4, 0, 0), reportPort.capturedTo);
        assertEquals(7, report.totalSuccessfulBookings());
        assertEquals(3, report.rooms().size());
        assertEquals(0, report.rooms().get(2).successfulBookingCount());
    }

    @Test
    void rejectsInvertedDateRange() {
        RoomPerformanceReportService service = new RoomPerformanceReportService(new CapturingReportPort(List.of()));

        assertThrows(IllegalArgumentException.class, () -> service.getRoomPerformanceReport(
                new GetRoomPerformanceReportQuery(
                        LocalDate.of(2026, 7, 5),
                        LocalDate.of(2026, 7, 4)
                )
        ));
    }

    private static final class CapturingReportPort implements RoomPerformanceReportPort {

        private final List<RoomPerformanceSummary> rooms;
        private LocalDateTime capturedFrom;
        private LocalDateTime capturedTo;

        private CapturingReportPort(List<RoomPerformanceSummary> rooms) {
            this.rooms = rooms;
        }

        @Override
        public List<RoomPerformanceSummary> loadRoomPerformanceSummaries(LocalDateTime from, LocalDateTime to) {
            this.capturedFrom = from;
            this.capturedTo = to;
            return rooms;
        }
    }
}
