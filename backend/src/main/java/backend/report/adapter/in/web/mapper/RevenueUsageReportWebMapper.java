package backend.report.adapter.in.web.mapper;

import backend.report.adapter.in.web.dto.RevenueUsagePeriodResponse;
import backend.report.adapter.in.web.dto.RevenueUsageReportResponse;
import backend.report.adapter.in.web.dto.RoomUsageSummaryResponse;
import backend.report.domain.model.RevenueUsagePeriod;
import backend.report.domain.model.RevenueUsageReport;
import backend.report.domain.model.RoomUsageSummary;
import org.springframework.stereotype.Component;

@Component
public class RevenueUsageReportWebMapper {

    public RevenueUsageReportResponse toResponse(RevenueUsageReport report) {
        return new RevenueUsageReportResponse(
                report.from(),
                report.to(),
                report.bucket(),
                report.totalRevenue(),
                report.totalBookings(),
                report.totalUsageHours(),
                report.periods().stream().map(this::toPeriodResponse).toList(),
                report.rooms().stream().map(this::toRoomResponse).toList()
        );
    }

    private RevenueUsagePeriodResponse toPeriodResponse(RevenueUsagePeriod period) {
        return new RevenueUsagePeriodResponse(
                period.periodStart(),
                period.revenue(),
                period.bookingCount(),
                period.usageHours()
        );
    }

    private RoomUsageSummaryResponse toRoomResponse(RoomUsageSummary room) {
        return new RoomUsageSummaryResponse(
                room.roomId(),
                room.roomName(),
                room.roomTypeName(),
                room.revenue(),
                room.bookingCount(),
                room.usageHours()
        );
    }
}
