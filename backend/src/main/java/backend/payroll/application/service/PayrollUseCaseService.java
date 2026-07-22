package backend.payroll.application.service;

import backend.payroll.application.port.in.FinalizePayrollUseCase;
import backend.payroll.application.port.in.GetPayrollUseCase;
import backend.payroll.application.port.in.MarkPayrollPaidUseCase;
import backend.payroll.application.port.in.UpdateStaffHourlyRateUseCase;
import backend.payroll.application.port.out.PayrollPort;
import backend.payroll.domain.model.PayrollLine;
import backend.payroll.domain.model.PayrollReport;
import backend.payroll.domain.model.PayrollStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.YearMonth;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PayrollUseCaseService implements GetPayrollUseCase, UpdateStaffHourlyRateUseCase,
        FinalizePayrollUseCase, MarkPayrollPaidUseCase {

    private final PayrollPort payrollPort;

    @Override
    public PayrollReport getPayroll(int year, int month) {
        YearMonth period = validatePeriod(year, month);
        PayrollStatus status = payrollPort.loadStatus(period).orElse(PayrollStatus.DRAFT);
        List<PayrollLine> lines = status == PayrollStatus.DRAFT
                ? payrollPort.calculateDraft(period)
                : payrollPort.loadSnapshot(period);
        return toReport(period, status, lines);
    }

    @Override
    @Transactional
    public PayrollReport updateHourlyRate(Integer staffId, BigDecimal hourlyRate, int year, int month) {
        if (staffId == null || staffId <= 0) {
            throw new IllegalArgumentException("Nhan vien khong hop le");
        }
        if (hourlyRate == null || hourlyRate.signum() < 0) {
            throw new IllegalArgumentException("Luong theo gio phai lon hon hoac bang 0");
        }
        payrollPort.updateHourlyRate(staffId, hourlyRate);
        return getPayroll(year, month);
    }

    @Override
    @Transactional
    public PayrollReport finalizePayroll(int year, int month) {
        YearMonth period = validatePeriod(year, month);
        PayrollStatus status = payrollPort.loadStatus(period).orElse(PayrollStatus.DRAFT);
        if (status == PayrollStatus.PAID) {
            throw new IllegalStateException("Bang luong da thanh toan");
        }
        if (status == PayrollStatus.FINALIZED) {
            return toReport(period, status, payrollPort.loadSnapshot(period));
        }

        List<PayrollLine> lines = payrollPort.calculateDraft(period);
        payrollPort.saveFinalizedSnapshot(period, lines);
        return toReport(period, PayrollStatus.FINALIZED, lines);
    }

    @Override
    @Transactional
    public PayrollReport markPaid(int year, int month) {
        YearMonth period = validatePeriod(year, month);
        PayrollStatus status = payrollPort.loadStatus(period).orElse(PayrollStatus.DRAFT);
        if (status == PayrollStatus.DRAFT) {
            throw new IllegalStateException("Can chot bang luong truoc khi thanh toan");
        }
        if (status != PayrollStatus.PAID) {
            payrollPort.markPaid(period);
        }
        return toReport(period, PayrollStatus.PAID, payrollPort.loadSnapshot(period));
    }

    private YearMonth validatePeriod(int year, int month) {
        if (year < 2000 || year > 2100 || month < 1 || month > 12) {
            throw new IllegalArgumentException("Ky luong khong hop le");
        }
        return YearMonth.of(year, month);
    }

    private PayrollReport toReport(YearMonth period, PayrollStatus status, List<PayrollLine> lines) {
        BigDecimal totalHours = lines.stream()
                .map(PayrollLine::workHours)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalSalary = lines.stream()
                .map(PayrollLine::totalSalary)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        return new PayrollReport(period.getYear(), period.getMonthValue(), status, totalHours, totalSalary, lines);
    }
}
