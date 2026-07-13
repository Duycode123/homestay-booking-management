package backend.report.adapter.in.web;

import backend.common.ApiResponse;
import backend.report.adapter.in.web.dto.RoomPerformanceReportResponse;
import backend.report.adapter.in.web.dto.RevenueUsageReportResponse;
import backend.report.adapter.in.web.mapper.RoomPerformanceReportWebMapper;
import backend.report.adapter.in.web.mapper.RevenueUsageReportWebMapper;
import backend.report.domain.model.ReportBucket;
import backend.report.domain.port.in.GetRoomPerformanceReportQuery;
import backend.report.domain.port.in.GetRoomPerformanceReportUseCase;
import backend.report.domain.port.in.GetRevenueUsageReportQuery;
import backend.report.domain.port.in.GetRevenueUsageReportUseCase;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Clock;

@RestController
@RequestMapping("/api/admin/reports")
@RequiredArgsConstructor
public class AdminReportController {

    private static final long DEFAULT_REPORT_DAYS = 30;

    private final GetRevenueUsageReportUseCase getRevenueUsageReportUseCase;
    private final RevenueUsageReportWebMapper revenueUsageReportWebMapper;
    private final GetRoomPerformanceReportUseCase getRoomPerformanceReportUseCase;
    private final RoomPerformanceReportWebMapper roomPerformanceReportWebMapper;
    private final Clock clock;

    @GetMapping("/revenue-usage")
    public ResponseEntity<ApiResponse<RevenueUsageReportResponse>> getRevenueUsageReport(
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
            LocalDateTime from,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
            LocalDateTime to,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate startDate,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate endDate,
            @RequestParam(defaultValue = "DAY") ReportBucket bucket
    ) {
        ReportWindow reportWindow = resolveRevenueUsageWindow(from, to, startDate, endDate);
        RevenueUsageReportResponse data = revenueUsageReportWebMapper.toResponse(
                getRevenueUsageReportUseCase.getRevenueUsageReport(
                        new GetRevenueUsageReportQuery(reportWindow.from(), reportWindow.to(), bucket)
                )
        );

        return ResponseEntity.ok(ApiResponse.<RevenueUsageReportResponse>builder()
                .success(true)
                .message("Revenue and room usage report loaded successfully")
                .data(data)
                .build());
    }

    @GetMapping("/room-performance")
    public ResponseEntity<ApiResponse<RoomPerformanceReportResponse>> getRoomPerformanceReport(
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate startDate,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate endDate
    ) {
        DateRange dateRange = resolveDateRange(startDate, endDate);
        RoomPerformanceReportResponse data = roomPerformanceReportWebMapper.toResponse(
                getRoomPerformanceReportUseCase.getRoomPerformanceReport(
                        new GetRoomPerformanceReportQuery(dateRange.startDate(), dateRange.endDate())
                )
        );

        return ResponseEntity.ok(ApiResponse.<RoomPerformanceReportResponse>builder()
                .success(true)
                .message("Room performance report loaded successfully")
                .data(data)
                .build());
    }

    private ReportWindow resolveRevenueUsageWindow(
            LocalDateTime from,
            LocalDateTime to,
            LocalDate startDate,
            LocalDate endDate
    ) {
        if (from != null || to != null) {
            if (from == null || to == null) {
                throw new IllegalArgumentException("from and to must be provided together");
            }

            return new ReportWindow(from, to);
        }

        DateRange dateRange = resolveDateRange(startDate, endDate);
        return new ReportWindow(
                dateRange.startDate().atStartOfDay(),
                dateRange.endDate().plusDays(1).atStartOfDay()
        );
    }

    private DateRange resolveDateRange(LocalDate startDate, LocalDate endDate) {
        LocalDate effectiveEndDate = endDate != null ? endDate : LocalDate.now(clock);
        LocalDate effectiveStartDate = startDate != null
                ? startDate
                : effectiveEndDate.minusDays(DEFAULT_REPORT_DAYS - 1);

        return new DateRange(effectiveStartDate, effectiveEndDate);
    }

    private record ReportWindow(
            LocalDateTime from,
            LocalDateTime to
    ) {
    }

    private record DateRange(
            LocalDate startDate,
            LocalDate endDate
    ) {
    }
}
