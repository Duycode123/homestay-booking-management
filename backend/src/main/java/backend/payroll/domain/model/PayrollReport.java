package backend.payroll.domain.model;

import java.math.BigDecimal;
import java.util.List;

public record PayrollReport(
        int year,
        int month,
        PayrollStatus status,
        BigDecimal totalHours,
        BigDecimal totalSalary,
        List<PayrollLine> staff
) {
}
