package backend.report.domain.port.in;

import backend.report.domain.model.RoomPerformanceReport;

public interface GetRoomPerformanceReportUseCase {

    RoomPerformanceReport getRoomPerformanceReport(GetRoomPerformanceReportQuery query);
}
