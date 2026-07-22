package backend.payroll.adapter.in.web.dto;

import backend.payroll.domain.model.PayrollReport;

import java.math.BigDecimal;
import java.util.List;

public record PayrollReportResponse(
        int year,
        int month,
        String status,
        BigDecimal totalHours,
        BigDecimal totalSalary,
        List<PayrollLineResponse> staff
) {
    public static PayrollReportResponse from(PayrollReport report) {
        return new PayrollReportResponse(
                report.year(), report.month(), report.status().name(),
                report.totalHours(), report.totalSalary(),
                report.staff().stream().map(PayrollLineResponse::from).toList()
        );
    }
}
