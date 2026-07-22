package backend.payroll.domain.model;

import java.math.BigDecimal;

public record PayrollLine(
        Integer staffId,
        String fullName,
        String email,
        boolean enabled,
        BigDecimal workHours,
        BigDecimal hourlyRate,
        BigDecimal totalSalary
) {
}
