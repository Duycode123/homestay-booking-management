package backend.payroll.application.port.out;

import backend.payroll.domain.model.PayrollLine;
import backend.payroll.domain.model.PayrollStatus;

import java.math.BigDecimal;
import java.time.YearMonth;
import java.util.List;
import java.util.Optional;

public interface PayrollPort {
    Optional<PayrollStatus> loadStatus(YearMonth period);

    List<PayrollLine> calculateDraft(YearMonth period);

    List<PayrollLine> loadSnapshot(YearMonth period);

    void updateHourlyRate(Integer staffId, BigDecimal hourlyRate);

    void saveFinalizedSnapshot(YearMonth period, List<PayrollLine> lines);

    void markPaid(YearMonth period);
}
