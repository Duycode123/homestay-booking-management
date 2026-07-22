package backend.payroll.application.port.in;

import backend.payroll.domain.model.PayrollReport;

import java.math.BigDecimal;

public interface UpdateStaffHourlyRateUseCase {
    PayrollReport updateHourlyRate(Integer staffId, BigDecimal hourlyRate, int year, int month);
}
