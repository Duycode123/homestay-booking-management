package backend.support.adapter.in.web;

import backend.common.ApiResponse;
import backend.support.adapter.in.web.dto.request.CreateCustomerIssueReportRequest;
import backend.support.application.model.CustomerIssueReportResult;
import backend.support.application.service.CustomerSupportUseCaseService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/customer")
@RequiredArgsConstructor
public class CustomerSupportController {

    private final CustomerSupportUseCaseService customerSupportUseCaseService;

    @PostMapping("/report-issue")
    public ResponseEntity<ApiResponse<CustomerIssueReportResult>> createIssueReport(
            @RequestBody CreateCustomerIssueReportRequest request,
            Authentication authentication
    ) {
        CustomerIssueReportResult data = customerSupportUseCaseService.createIssueReport(
                authentication.getName(),
                request.getIssueType(),
                request.getBookingCode(),
                request.getDescription()
        );

        return ResponseEntity.ok(success("Gui bao cao su co thanh cong", data));
    }

    private <T> ApiResponse<T> success(String message, T data) {
        return ApiResponse.<T>builder()
                .success(true)
                .message(message)
                .data(data)
                .build();
    }
}
