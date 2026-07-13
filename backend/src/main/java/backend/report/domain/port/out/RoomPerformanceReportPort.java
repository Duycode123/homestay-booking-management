package backend.report.domain.port.out;

import backend.report.domain.model.RoomPerformanceSummary;

import java.time.LocalDateTime;
import java.util.List;

public interface RoomPerformanceReportPort {

    List<RoomPerformanceSummary> loadRoomPerformanceSummaries(LocalDateTime from, LocalDateTime to);
}
