package backend.staffperformance.adapter.out.persistence;

import backend.entity.Role;
import backend.staffperformance.application.model.AttendancePerformanceRow;
import backend.staffperformance.application.model.StaffPerformanceActor;
import backend.staffperformance.application.model.StaffPerformanceReview;
import backend.staffperformance.application.port.out.StaffPerformancePort;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class JdbcStaffPerformanceAdapter implements StaffPerformancePort {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public Optional<StaffPerformanceActor> loadActorByEmail(String email) {
        String sql = """
                SELECT account.id AS account_id, account.role, staff.id AS staff_id
                FROM account
                LEFT JOIN staff ON staff.account_id = account.id
                WHERE LOWER(account.email) = LOWER(?)
                """;

        return jdbcTemplate.query(sql, (rs, rowNum) -> new StaffPerformanceActor(
                rs.getInt("account_id"),
                rs.getObject("staff_id", Integer.class),
                Role.valueOf(rs.getString("role"))
        ), email).stream().findFirst();
    }

    @Override
    public List<AttendancePerformanceRow> loadAttendanceRows(
            Integer staffId,
            LocalDateTime fromInclusive,
            LocalDateTime toExclusive
    ) {
        String sql = """
                SELECT attendance.status,
                       attendance.check_in_time,
                       attendance.work_duration_hours,
                       shift.start_time
                FROM staff_attendance attendance
                LEFT JOIN shift ON shift.id = attendance.shift_id
                WHERE attendance.staff_id = ?
                  AND attendance.check_in_time >= ?
                  AND attendance.check_in_time < ?
                ORDER BY attendance.check_in_time ASC
                """;

        return jdbcTemplate.query(sql, this::mapAttendanceRow, staffId, fromInclusive, toExclusive);
    }

    @Override
    public List<StaffPerformanceReview> loadReviews(
            Integer staffId,
            LocalDateTime fromInclusive,
            LocalDateTime toExclusive
    ) {
        String sql = """
                SELECT review.rating,
                       review.content,
                       review.booking_id,
                       review.created_at
                FROM review
                JOIN booking ON booking.id = review.booking_id
                WHERE booking.checkin_staff_id = ?
                  AND review.approved = true
                  AND review.created_at >= ?
                  AND review.created_at < ?
                ORDER BY review.created_at DESC
                """;

        return jdbcTemplate.query(sql, this::mapReview, staffId, fromInclusive, toExclusive);
    }

    private AttendancePerformanceRow mapAttendanceRow(ResultSet rs, int rowNum) throws SQLException {
        return new AttendancePerformanceRow(
                rs.getString("status"),
                rs.getTimestamp("check_in_time").toLocalDateTime(),
                rs.getBigDecimal("work_duration_hours"),
                rs.getTime("start_time") == null ? null : rs.getTime("start_time").toLocalTime()
        );
    }

    private StaffPerformanceReview mapReview(ResultSet rs, int rowNum) throws SQLException {
        return new StaffPerformanceReview(
                rs.getInt("rating"),
                rs.getString("content"),
                rs.getInt("booking_id"),
                rs.getTimestamp("created_at").toLocalDateTime()
        );
    }
}
