package backend.payroll.adapter.out.persistence;

import backend.exception.ResourceNotFoundException;
import backend.payroll.application.port.out.PayrollPort;
import backend.payroll.domain.model.PayrollLine;
import backend.payroll.domain.model.PayrollStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.List;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class JdbcPayrollAdapter implements PayrollPort {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public Optional<PayrollStatus> loadStatus(YearMonth period) {
        return jdbcTemplate.query(
                "SELECT status FROM payroll_period WHERE pay_year = ? AND pay_month = ?",
                (rs, rowNum) -> PayrollStatus.valueOf(rs.getString("status")),
                period.getYear(), period.getMonthValue()
        ).stream().findFirst();
    }

    @Override
    public List<PayrollLine> calculateDraft(YearMonth period) {
        String sql = """
                SELECT staff.id AS staff_id,
                       staff.full_name,
                       COALESCE(staff.email, account.email) AS email,
                       account.enabled,
                       COALESCE(SUM(attendance.work_duration_hours)
                           FILTER (WHERE attendance.status = 'DONE'
                               AND attendance.check_out_time IS NOT NULL), 0) AS work_hours,
                       staff.hourly_rate,
                       ROUND(
                           COALESCE(SUM(attendance.work_duration_hours)
                               FILTER (WHERE attendance.status = 'DONE'
                                   AND attendance.check_out_time IS NOT NULL), 0)
                           * staff.hourly_rate,
                           2
                       ) AS total_salary
                FROM staff
                JOIN account ON account.id = staff.account_id
                LEFT JOIN staff_attendance attendance
                  ON attendance.staff_id = staff.id
                 AND attendance.check_in_time >= ?
                 AND attendance.check_in_time < ?
                GROUP BY staff.id, staff.full_name, staff.email, account.email, account.enabled, staff.hourly_rate
                ORDER BY staff.id
                """;

        LocalDateTime start = period.atDay(1).atStartOfDay();
        LocalDateTime end = period.plusMonths(1).atDay(1).atStartOfDay();
        return jdbcTemplate.query(sql, this::mapLine, start, end);
    }

    @Override
    public List<PayrollLine> loadSnapshot(YearMonth period) {
        String sql = """
                SELECT item.staff_id,
                       staff.full_name,
                       COALESCE(staff.email, account.email) AS email,
                       account.enabled,
                       item.work_hours,
                       item.hourly_rate,
                       item.total_salary
                FROM payroll_item item
                JOIN payroll_period period ON period.id = item.payroll_period_id
                JOIN staff ON staff.id = item.staff_id
                JOIN account ON account.id = staff.account_id
                WHERE period.pay_year = ? AND period.pay_month = ?
                ORDER BY item.staff_id
                """;
        return jdbcTemplate.query(sql, this::mapLine, period.getYear(), period.getMonthValue());
    }

    @Override
    public void updateHourlyRate(Integer staffId, BigDecimal hourlyRate) {
        int updated = jdbcTemplate.update(
                "UPDATE staff SET hourly_rate = ? WHERE id = ?",
                hourlyRate, staffId
        );
        if (updated == 0) {
            throw new ResourceNotFoundException("Khong tim thay nhan vien");
        }
    }

    @Override
    public void saveFinalizedSnapshot(YearMonth period, List<PayrollLine> lines) {
        jdbcTemplate.update("""
                INSERT INTO payroll_period (pay_year, pay_month, status)
                VALUES (?, ?, 'DRAFT')
                ON CONFLICT (pay_year, pay_month) DO NOTHING
                """, period.getYear(), period.getMonthValue());

        Long periodId = jdbcTemplate.queryForObject(
                "SELECT id FROM payroll_period WHERE pay_year = ? AND pay_month = ? FOR UPDATE",
                Long.class,
                period.getYear(), period.getMonthValue()
        );
        if (periodId == null) {
            throw new IllegalStateException("Khong the tao ky luong");
        }

        jdbcTemplate.update("DELETE FROM payroll_item WHERE payroll_period_id = ?", periodId);
        for (PayrollLine line : lines) {
            jdbcTemplate.update("""
                    INSERT INTO payroll_item (
                        payroll_period_id, staff_id, work_hours, hourly_rate, total_salary
                    ) VALUES (?, ?, ?, ?, ?)
                    """, periodId, line.staffId(), line.workHours(), line.hourlyRate(), line.totalSalary());
        }
        jdbcTemplate.update("""
                UPDATE payroll_period
                SET status = 'FINALIZED', finalized_at = ?, paid_at = NULL
                WHERE id = ?
                """, LocalDateTime.now(), periodId);
    }

    @Override
    public void markPaid(YearMonth period) {
        int updated = jdbcTemplate.update("""
                UPDATE payroll_period
                SET status = 'PAID', paid_at = ?
                WHERE pay_year = ? AND pay_month = ? AND status = 'FINALIZED'
                """, LocalDateTime.now(), period.getYear(), period.getMonthValue());
        if (updated == 0) {
            throw new IllegalStateException("Bang luong chua duoc chot hoac da thanh toan");
        }
    }

    private PayrollLine mapLine(ResultSet rs, int rowNum) throws SQLException {
        return new PayrollLine(
                rs.getInt("staff_id"),
                rs.getString("full_name"),
                rs.getString("email"),
                rs.getBoolean("enabled"),
                rs.getBigDecimal("work_hours"),
                rs.getBigDecimal("hourly_rate"),
                rs.getBigDecimal("total_salary")
        );
    }
}
