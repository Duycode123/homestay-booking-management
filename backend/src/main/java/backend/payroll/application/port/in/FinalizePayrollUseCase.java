package backend.payroll.application.port.in;

import backend.payroll.domain.model.PayrollReport;

public interface FinalizePayrollUseCase {
    PayrollReport finalizePayroll(int year, int month);
}
