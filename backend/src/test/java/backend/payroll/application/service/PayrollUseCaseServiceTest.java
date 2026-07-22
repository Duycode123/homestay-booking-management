package backend.payroll.application.service;

import backend.payroll.application.port.out.PayrollPort;
import backend.payroll.domain.model.PayrollLine;
import backend.payroll.domain.model.PayrollStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.YearMonth;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PayrollUseCaseServiceTest {

    @Mock
    private PayrollPort payrollPort;

    private PayrollUseCaseService service;

    @BeforeEach
    void setUp() {
        service = new PayrollUseCaseService(payrollPort);
    }

    @Test
    void draftPayrollUsesOnlyHoursProvidedByCompletedAttendanceCalculation() {
        YearMonth period = YearMonth.of(2026, 7);
        when(payrollPort.loadStatus(period)).thenReturn(Optional.empty());
        when(payrollPort.calculateDraft(period)).thenReturn(List.of(
                line(1, "8.50", "30000", "255000"),
                line(2, "0.00", "40000", "0")
        ));

        var report = service.getPayroll(2026, 7);

        assertEquals(PayrollStatus.DRAFT, report.status());
        assertEquals(new BigDecimal("8.50"), report.totalHours());
        assertEquals(new BigDecimal("255000"), report.totalSalary());
    }

    @Test
    void updateHourlyRateRejectsNegativeValue() {
        assertThrows(
                IllegalArgumentException.class,
                () -> service.updateHourlyRate(1, new BigDecimal("-1"), 2026, 7)
        );
    }

    @Test
    void finalizeStoresCurrentCalculationAsSnapshot() {
        YearMonth period = YearMonth.of(2026, 7);
        List<PayrollLine> lines = List.of(line(1, "8.00", "30000", "240000"));
        when(payrollPort.loadStatus(period)).thenReturn(Optional.empty());
        when(payrollPort.calculateDraft(period)).thenReturn(lines);

        var report = service.finalizePayroll(2026, 7);

        verify(payrollPort).saveFinalizedSnapshot(period, lines);
        assertEquals(PayrollStatus.FINALIZED, report.status());
        assertEquals(new BigDecimal("240000"), report.totalSalary());
    }

    @Test
    void cannotMarkDraftPayrollAsPaid() {
        YearMonth period = YearMonth.of(2026, 7);
        when(payrollPort.loadStatus(period)).thenReturn(Optional.empty());

        assertThrows(IllegalStateException.class, () -> service.markPaid(2026, 7));
    }

    private PayrollLine line(int staffId, String hours, String rate, String salary) {
        return new PayrollLine(
                staffId, "Staff " + staffId, "staff@example.com", true,
                new BigDecimal(hours), new BigDecimal(rate), new BigDecimal(salary)
        );
    }
}
