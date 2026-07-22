package backend.payroll.adapter.in.web.dto;

import backend.payroll.domain.model.PayrollLine;

import java.math.BigDecimal;

public record PayrollLineResponse(
        Integer staffId,
        String fullName,
        String email,
        boolean enabled,
        BigDecimal workHours,
        BigDecimal hourlyRate,
        BigDecimal totalSalary
) {
    public static PayrollLineResponse from(PayrollLine line) {
        return new PayrollLineResponse(
                line.staffId(), line.fullName(), line.email(), line.enabled(),
                line.workHours(), line.hourlyRate(), line.totalSalary()
        );
    }
}
