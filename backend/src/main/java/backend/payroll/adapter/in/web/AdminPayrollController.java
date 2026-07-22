package backend.payroll.adapter.in.web;

import backend.common.ApiResponse;
import backend.payroll.adapter.in.web.dto.PayrollReportResponse;
import backend.payroll.adapter.in.web.dto.UpdateHourlyRateRequest;
import backend.payroll.application.port.in.FinalizePayrollUseCase;
import backend.payroll.application.port.in.GetPayrollUseCase;
import backend.payroll.application.port.in.MarkPayrollPaidUseCase;
import backend.payroll.application.port.in.UpdateStaffHourlyRateUseCase;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/payroll")
@RequiredArgsConstructor
public class AdminPayrollController {

    private final GetPayrollUseCase getPayrollUseCase;
    private final UpdateStaffHourlyRateUseCase updateStaffHourlyRateUseCase;
    private final FinalizePayrollUseCase finalizePayrollUseCase;
    private final MarkPayrollPaidUseCase markPayrollPaidUseCase;

    @GetMapping
    public ResponseEntity<ApiResponse<PayrollReportResponse>> getPayroll(
            @RequestParam int year,
            @RequestParam int month
    ) {
        return ok("Lay bang luong thanh cong", PayrollReportResponse.from(
                getPayrollUseCase.getPayroll(year, month)
        ));
    }

    @PatchMapping("/staff/{staffId}/hourly-rate")
    public ResponseEntity<ApiResponse<PayrollReportResponse>> updateHourlyRate(
            @PathVariable Integer staffId,
            @RequestParam int year,
            @RequestParam int month,
            @Valid @RequestBody UpdateHourlyRateRequest request
    ) {
        return ok("Cap nhat luong theo gio thanh cong", PayrollReportResponse.from(
                updateStaffHourlyRateUseCase.updateHourlyRate(staffId, request.hourlyRate(), year, month)
        ));
    }

    @PostMapping("/{year}/{month}/finalize")
    public ResponseEntity<ApiResponse<PayrollReportResponse>> finalizePayroll(
            @PathVariable int year,
            @PathVariable int month
    ) {
        return ok("Da chot bang luong", PayrollReportResponse.from(
                finalizePayrollUseCase.finalizePayroll(year, month)
        ));
    }

    @PostMapping("/{year}/{month}/mark-paid")
    public ResponseEntity<ApiResponse<PayrollReportResponse>> markPaid(
            @PathVariable int year,
            @PathVariable int month
    ) {
        return ok("Da danh dau thanh toan", PayrollReportResponse.from(
                markPayrollPaidUseCase.markPaid(year, month)
        ));
    }

    private ResponseEntity<ApiResponse<PayrollReportResponse>> ok(String message, PayrollReportResponse data) {
        return ResponseEntity.ok(ApiResponse.<PayrollReportResponse>builder()
                .success(true)
                .message(message)
                .data(data)
                .build());
    }
}
