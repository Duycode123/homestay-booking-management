package backend.payroll.application.port.in;

import backend.payroll.domain.model.PayrollReport;

public interface GetPayrollUseCase {
    PayrollReport getPayroll(int year, int month);
}
