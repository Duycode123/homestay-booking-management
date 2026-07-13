package backend.support.adapter.in.web;

import backend.common.ApiResponse;
import backend.support.adapter.in.web.dto.request.UpdateCustomerIssueReportStatusRequest;
import backend.support.application.model.AdminCustomerIssueReportResult;
import backend.support.application.service.CustomerSupportUseCaseService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/admin/incident-reports")
@RequiredArgsConstructor
public class AdminCustomerIssueReportController {

    private final CustomerSupportUseCaseService customerSupportUseCaseService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<AdminCustomerIssueReportResult>>> getIssueReports(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String priority,
            @RequestParam(required = false) String roomId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate submittedDate
    ) {
        List<AdminCustomerIssueReportResult> data = customerSupportUseCaseService.getAdminIssueReports(
                query,
                status,
                priority,
                roomId,
                submittedDate
        );

        return ResponseEntity.ok(success("Lay danh sach bao cao su co thanh cong", data));
    }

    @GetMapping("/{reportId}")
    public ResponseEntity<ApiResponse<AdminCustomerIssueReportResult>> getIssueReport(
            @PathVariable Long reportId
    ) {
        return ResponseEntity.ok(success(
                "Lay chi tiet bao cao su co thanh cong",
                customerSupportUseCaseService.getAdminIssueReport(reportId)
        ));
    }

    @PatchMapping("/{reportId}/status")
    public ResponseEntity<ApiResponse<AdminCustomerIssueReportResult>> updateIssueReportStatus(
            @PathVariable Long reportId,
            @RequestBody UpdateCustomerIssueReportStatusRequest request
    ) {
        AdminCustomerIssueReportResult data = customerSupportUseCaseService.updateAdminIssueReportStatus(
                reportId,
                request == null ? null : request.getStatus(),
                request == null ? null : request.getAdminNote()
        );

        return ResponseEntity.ok(success("Cap nhat bao cao su co thanh cong", data));
    }

    private <T> ApiResponse<T> success(String message, T data) {
        return ApiResponse.<T>builder()
                .success(true)
                .message(message)
                .data(data)
                .build();
    }
}
