package backend.payroll.application.port.in;

import backend.payroll.domain.model.PayrollReport;

public interface MarkPayrollPaidUseCase {
    PayrollReport markPaid(int year, int month);
}
