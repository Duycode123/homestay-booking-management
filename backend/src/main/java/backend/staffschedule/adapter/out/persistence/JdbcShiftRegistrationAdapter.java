package backend.staffschedule.adapter.out.persistence;

import backend.staffschedule.application.port.out.ShiftAssignmentPort;
import backend.staffschedule.application.port.out.ShiftRegistrationActorPort;
import backend.staffschedule.application.port.out.ShiftRegistrationPort;
import backend.staffschedule.domain.model.ShiftRegistration;
import backend.staffschedule.domain.model.ShiftRegistrationStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class JdbcShiftRegistrationAdapter implements
        ShiftRegistrationActorPort,
        ShiftRegistrationPort,
        ShiftAssignmentPort {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public Optional<Integer> loadStaffIdByAccountEmail(String email) {
        String sql = """
                SELECT staff.id
                FROM staff
                JOIN account ON account.id = staff.account_id
                WHERE LOWER(account.email) = LOWER(?)
                """;

        Optional<Integer> existingStaffId = jdbcTemplate.query(sql, (rs, rowNum) -> rs.getInt("id"), email)
                .stream()
                .findFirst();
        if (existingStaffId.isPresent()) {
            return existingStaffId;
        }

        return createMissingStaffProfileForStaffAccount(email);
    }

    @Override
    public Optional<Integer> loadAccountIdByEmail(String email) {
        String sql = "SELECT id FROM account WHERE LOWER(email) = LOWER(?)";
        return jdbcTemplate.query(sql, (rs, rowNum) -> rs.getInt("id"), email).stream().findFirst();
    }

    @Override
    public ShiftRegistration save(ShiftRegistration registration) {
        String sql = """
                INSERT INTO staff_shift_registration (
                    staff_id,
                    work_date,
                    start_time,
                    end_time,
                    status,
                    reviewed_by_account_id,
                    reviewed_at,
                    rejection_reason,
                    created_at,
                    updated_at
                )
                VALUES (?, ?, ?, ?, CAST(? AS shift_registration_status), ?, ?, ?, ?, ?)
                RETURNING id
                """;

        Integer id = jdbcTemplate.queryForObject(
                sql,
                Integer.class,
                registration.staffId(),
                registration.workDate(),
                registration.startTime(),
                registration.endTime(),
                registration.status().name(),
                registration.reviewedByAccountId(),
                timestamp(registration.reviewedAt()),
                registration.rejectionReason(),
                timestamp(registration.createdAt()),
                timestamp(registration.updatedAt())
        );

        return loadRegistration(id).orElseThrow();
    }

    @Override
    public ShiftRegistration updateDecision(ShiftRegistration registration) {
        String sql = """
                UPDATE staff_shift_registration
                SET status = CAST(? AS shift_registration_status),
                    reviewed_by_account_id = ?,
                    reviewed_at = ?,
                    rejection_reason = ?,
                    updated_at = ?
                WHERE id = ?
                RETURNING id
                """;

        Integer id = jdbcTemplate.queryForObject(
                sql,
                Integer.class,
                registration.status().name(),
                registration.reviewedByAccountId(),
                timestamp(registration.reviewedAt()),
                registration.rejectionReason(),
                timestamp(registration.updatedAt()),
                registration.id()
        );

        return loadRegistration(id).orElseThrow();
    }

    @Override
    public Optional<ShiftRegistration> loadRegistration(Integer registrationId) {
        String sql = """
                SELECT registration.id,
                       registration.staff_id,
                       staff.full_name AS staff_name,
                       staff.email AS staff_email,
                       registration.work_date,
                       registration.start_time,
                       registration.end_time,
                       registration.status,
                       registration.reviewed_by_account_id,
                       registration.reviewed_at,
                       registration.rejection_reason,
                       registration.created_at,
                       registration.updated_at
                FROM staff_shift_registration registration
                JOIN staff ON staff.id = registration.staff_id
                WHERE registration.id = ?
                """;

        return jdbcTemplate.query(sql, this::mapRegistration, registrationId).stream().findFirst();
    }

    @Override
    public List<ShiftRegistration> loadStaffRegistrations(Integer staffId, LocalDate fromDate, LocalDate toDate) {
        String sql = """
                SELECT registration.id,
                       registration.staff_id,
                       staff.full_name AS staff_name,
                       staff.email AS staff_email,
                       registration.work_date,
                       registration.start_time,
                       registration.end_time,
                       registration.status,
                       registration.reviewed_by_account_id,
                       registration.reviewed_at,
                       registration.rejection_reason,
                       registration.created_at,
                       registration.updated_at
                FROM staff_shift_registration registration
                JOIN staff ON staff.id = registration.staff_id
                WHERE registration.staff_id = ?
                  AND registration.work_date BETWEEN ? AND ?
                ORDER BY registration.work_date ASC, registration.start_time ASC, registration.id ASC
                """;

        return jdbcTemplate.query(sql, this::mapRegistration, staffId, fromDate, toDate);
    }

    @Override
    public List<ShiftRegistration> searchRegistrations(
            ShiftRegistrationStatus status,
            LocalDate fromDate,
            LocalDate toDate,
            Integer staffId
    ) {
        StringBuilder sql = new StringBuilder("""
                SELECT registration.id,
                       registration.staff_id,
                       staff.full_name AS staff_name,
                       staff.email AS staff_email,
                       registration.work_date,
                       registration.start_time,
                       registration.end_time,
                       registration.status,
                       registration.reviewed_by_account_id,
                       registration.reviewed_at,
                       registration.rejection_reason,
                       registration.created_at,
                       registration.updated_at
                FROM staff_shift_registration registration
                JOIN staff ON staff.id = registration.staff_id
                WHERE 1 = 1
                """);
        List<Object> args = new ArrayList<>();

        if (status != null) {
            sql.append(" AND registration.status = CAST(? AS shift_registration_status)");
            args.add(status.name());
        }
        if (fromDate != null) {
            sql.append(" AND registration.work_date >= ?");
            args.add(fromDate);
        }
        if (toDate != null) {
            sql.append(" AND registration.work_date <= ?");
            args.add(toDate);
        }
        if (staffId != null) {
            sql.append(" AND registration.staff_id = ?");
            args.add(staffId);
        }

        sql.append(" ORDER BY registration.work_date ASC, registration.start_time ASC, registration.id ASC");

        return jdbcTemplate.query(sql.toString(), this::mapRegistration, args.toArray());
    }

    @Override
    public boolean existsOverlappingPendingOrApprovedRegistration(
            Integer staffId,
            LocalDate workDate,
            LocalTime startTime,
            LocalTime endTime
    ) {
        String sql = """
                SELECT COUNT(*)
                FROM staff_shift_registration
                WHERE staff_id = ?
                  AND work_date = ?
                  AND status IN ('PENDING', 'APPROVED')
                  AND start_time < ?
                  AND end_time > ?
                """;

        Integer count = jdbcTemplate.queryForObject(sql, Integer.class, staffId, workDate, endTime, startTime);
        return count != null && count > 0;
    }

    @Override
    public boolean existsOverlappingAssignedShift(
            Integer staffId,
            LocalDate workDate,
            LocalTime startTime,
            LocalTime endTime
    ) {
        String sql = """
                SELECT COUNT(*)
                FROM shift
                WHERE staff_id = ?
                  AND date = ?
                  AND start_time < ?
                  AND end_time > ?
                """;

        Integer count = jdbcTemplate.queryForObject(sql, Integer.class, staffId, workDate, endTime, startTime);
        return count != null && count > 0;
    }

    @Override
    public void createAssignedShift(Integer staffId, LocalDate workDate, LocalTime startTime, LocalTime endTime) {
        String sql = """
                INSERT INTO shift (staff_id, date, start_time, end_time, status)
                SELECT ?, ?, ?, ?, CAST('ASSIGNED' AS shift_status)
                WHERE NOT EXISTS (
                    SELECT 1
                    FROM shift
                    WHERE staff_id = ?
                      AND date = ?
                      AND start_time = ?
                      AND end_time = ?
                )
                """;

        jdbcTemplate.update(sql, staffId, workDate, startTime, endTime, staffId, workDate, startTime, endTime);
    }

    private ShiftRegistration mapRegistration(ResultSet rs, int rowNum) throws SQLException {
        return new ShiftRegistration(
                rs.getInt("id"),
                rs.getInt("staff_id"),
                rs.getString("staff_name"),
                rs.getString("staff_email"),
                rs.getDate("work_date").toLocalDate(),
                rs.getTime("start_time").toLocalTime(),
                rs.getTime("end_time").toLocalTime(),
                ShiftRegistrationStatus.valueOf(rs.getString("status")),
                rs.getObject("reviewed_by_account_id", Integer.class),
                localDateTime(rs, "reviewed_at"),
                rs.getString("rejection_reason"),
                rs.getTimestamp("created_at").toLocalDateTime(),
                rs.getTimestamp("updated_at").toLocalDateTime()
        );
    }

    private Timestamp timestamp(LocalDateTime value) {
        return value == null ? null : Timestamp.valueOf(value);
    }

    private Optional<Integer> createMissingStaffProfileForStaffAccount(String email) {
        String sql = """
                INSERT INTO staff (account_id, full_name, email)
                SELECT account.id,
                       COALESCE(NULLIF(split_part(account.email, '@', 1), ''), account.email),
                       account.email
                FROM account
                WHERE LOWER(account.email) = LOWER(?)
                  AND account.role = 'STAFF'
                  AND NOT EXISTS (
                      SELECT 1
                      FROM staff
                      WHERE staff.account_id = account.id
                  )
                RETURNING id
                """;

        Optional<Integer> insertedStaffId = jdbcTemplate.query(sql, (rs, rowNum) -> rs.getInt("id"), email)
                .stream()
                .findFirst();
        if (insertedStaffId.isPresent()) {
            return insertedStaffId;
        }

        return jdbcTemplate.query(
                        """
                        SELECT staff.id
                        FROM staff
                        JOIN account ON account.id = staff.account_id
                        WHERE LOWER(account.email) = LOWER(?)
                        """,
                        (rs, rowNum) -> rs.getInt("id"),
                        email
                )
                .stream()
                .findFirst();
    }

    private LocalDateTime localDateTime(ResultSet rs, String columnName) throws SQLException {
        Timestamp timestamp = rs.getTimestamp(columnName);
        return timestamp == null ? null : timestamp.toLocalDateTime();
    }
}
