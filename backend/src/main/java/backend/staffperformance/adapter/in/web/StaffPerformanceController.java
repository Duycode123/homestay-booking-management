package backend.staffperformance.adapter.in.web;

import backend.common.ApiResponse;
import backend.staffperformance.adapter.in.web.dto.StaffPerformanceReportResponse;
import backend.staffperformance.application.port.in.GetMyStaffPerformanceUseCase;
import backend.staffperformance.application.port.in.query.GetMyStaffPerformanceQuery;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/staff/performance")
@RequiredArgsConstructor
public class StaffPerformanceController {

    private final GetMyStaffPerformanceUseCase getMyStaffPerformanceUseCase;

    @GetMapping
    public ResponseEntity<ApiResponse<StaffPerformanceReportResponse>> getMyPerformance(
            Authentication authentication,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate
    ) {
        StaffPerformanceReportResponse data = StaffPerformanceReportResponse.from(
                getMyStaffPerformanceUseCase.getMyPerformance(new GetMyStaffPerformanceQuery(
                        authentication.getName(),
                        fromDate,
                        toDate
                ))
        );

        return ResponseEntity.ok(ApiResponse.<StaffPerformanceReportResponse>builder()
                .success(true)
                .message("Tong hop cong lam va danh gia cua nhan vien")
                .data(data)
                .build());
    }
}
