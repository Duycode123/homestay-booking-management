package backend.attendance.adapter.out.persistence;

import backend.attendance.application.model.AttendanceActor;
import backend.attendance.application.port.out.AttendanceActorPort;
import backend.attendance.application.port.out.AttendanceRecordPort;
import backend.attendance.application.port.out.StaffShiftPort;
import backend.attendance.domain.model.AttendanceRecord;
import backend.attendance.domain.model.AttendanceStatus;
import backend.attendance.domain.model.StaffShift;
import backend.entity.Role;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class JdbcAttendanceAdapter implements AttendanceActorPort, StaffShiftPort, AttendanceRecordPort {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void lockStaffAttendance(Integer staffId) {
        jdbcTemplate.query(
                "SELECT pg_advisory_xact_lock(1096045636, ?)",
                resultSet -> null,
                staffId
        );
    }

    @Override
    public Optional<AttendanceActor> loadActorByEmail(String email) {
        String sql = """
                SELECT account.id AS account_id, account.role, staff.id AS staff_id
                FROM account
                LEFT JOIN staff ON staff.account_id = account.id
                WHERE LOWER(account.email) = LOWER(?)
                """;

        return jdbcTemplate.query(sql, (rs, rowNum) -> new AttendanceActor(
                rs.getInt("account_id"),
                rs.getObject("staff_id", Integer.class),
                Role.valueOf(rs.getString("role"))
        ), email).stream().findFirst();
    }

    @Override
    public Optional<StaffShift> loadCurrentShift(Integer staffId, LocalDateTime currentTime) {
        String sql = """
                SELECT shift.id,
                       shift.staff_id,
                       shift.room_id,
                       room.name AS room_name,
                       room.latitude,
                       room.longitude,
                       room.check_in_radius_m,
                       shift.date,
                       shift.start_time,
                       shift.end_time
                FROM shift
                LEFT JOIN room ON room.id = shift.room_id
                WHERE shift.staff_id = ?
                  AND shift.date = ?
                  AND shift.start_time <= ?
                  AND shift.end_time >= ?
                  AND shift.status IN ('ASSIGNED', 'IN_PROGRESS')
                ORDER BY shift.start_time DESC
                LIMIT 1
                """;

        return jdbcTemplate.query(sql, (rs, rowNum) -> new StaffShift(
                rs.getInt("id"),
                rs.getInt("staff_id"),
                rs.getObject("room_id", Integer.class),
                rs.getString("room_name"),
                rs.getBigDecimal("latitude"),
                rs.getBigDecimal("longitude"),
                rs.getObject("check_in_radius_m", Integer.class),
                rs.getDate("date").toLocalDate(),
                rs.getTime("start_time").toLocalTime(),
                rs.getTime("end_time").toLocalTime()
        ), staffId, currentTime.toLocalDate(), currentTime.toLocalTime(), currentTime.toLocalTime())
                .stream()
                .findFirst();
    }

    @Override
    public boolean existsAttendanceForShift(Integer staffId, Integer shiftId) {
        String sql = """
                SELECT COUNT(*)
                FROM staff_attendance
                WHERE staff_id = ?
                  AND shift_id = ?
                """;

        Integer count = jdbcTemplate.queryForObject(sql, Integer.class, staffId, shiftId);
        return count != null && count > 0;
    }

    @Override
    public boolean existsWorkingAttendance(Integer staffId, Integer shiftId) {
        String sql = """
                SELECT COUNT(*)
                FROM staff_attendance
                WHERE staff_id = ?
                  AND shift_id = ?
                  AND status = 'WORKING'
                """;

        Integer count = jdbcTemplate.queryForObject(sql, Integer.class, staffId, shiftId);
        return count != null && count > 0;
    }

    @Override
    public Optional<AttendanceRecord> loadWorkingAttendance(Integer staffId) {
        String sql = """
                SELECT id, staff_id, shift_id, check_in_time, check_out_time, work_duration_hours,
                       check_in_latitude, check_in_longitude, check_in_accuracy_m, check_in_distance_m,
                       status
                FROM staff_attendance
                WHERE staff_id = ?
                  AND status = 'WORKING'
                ORDER BY check_in_time DESC
                LIMIT 1
                FOR UPDATE
                """;

        return jdbcTemplate.query(sql, this::mapAttendanceRecord, staffId).stream().findFirst();
    }

    @Override
    public Optional<AttendanceRecord> loadLatestAttendanceForShift(Integer staffId, Integer shiftId) {
        String sql = """
                SELECT id, staff_id, shift_id, check_in_time, check_out_time, work_duration_hours,
                       check_in_latitude, check_in_longitude, check_in_accuracy_m, check_in_distance_m,
                       status
                FROM staff_attendance
                WHERE staff_id = ?
                  AND shift_id = ?
                ORDER BY check_in_time DESC
                LIMIT 1
                """;

        return jdbcTemplate.query(sql, this::mapAttendanceRecord, staffId, shiftId).stream().findFirst();
    }

    @Override
    public AttendanceRecord save(AttendanceRecord attendanceRecord) {
        if (existsById(attendanceRecord.id())) {
            update(attendanceRecord);
        } else {
            insert(attendanceRecord);
        }

        return attendanceRecord;
    }

    @Override
    public void markMissingCheckoutsBefore(LocalDateTime cutoffTime) {
        String sql = """
                UPDATE staff_attendance
                SET status = 'MISSING_CHECKOUT'
                WHERE status = 'WORKING'
                  AND check_out_time IS NULL
                  AND check_in_time < ?
                """;

        jdbcTemplate.update(sql, cutoffTime);
    }

    private boolean existsById(UUID attendanceId) {
        String sql = "SELECT COUNT(*) FROM staff_attendance WHERE id = ?";
        Integer count = jdbcTemplate.queryForObject(sql, Integer.class, attendanceId);
        return count != null && count > 0;
    }

    private void insert(AttendanceRecord attendanceRecord) {
        String sql = """
                INSERT INTO staff_attendance (
                    id, staff_id, shift_id, check_in_time, check_out_time, work_duration_hours,
                    check_in_latitude, check_in_longitude, check_in_accuracy_m, check_in_distance_m,
                    status
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CAST(? AS attendance_status))
                """;

        jdbcTemplate.update(
                sql,
                attendanceRecord.id(),
                attendanceRecord.staffId(),
                attendanceRecord.shiftId(),
                attendanceRecord.checkInTime(),
                attendanceRecord.checkOutTime(),
                attendanceRecord.workDurationHours(),
                attendanceRecord.checkInLatitude(),
                attendanceRecord.checkInLongitude(),
                attendanceRecord.checkInAccuracyMeters(),
                attendanceRecord.checkInDistanceMeters(),
                attendanceRecord.status().name()
        );
    }

    private void update(AttendanceRecord attendanceRecord) {
        String sql = """
                UPDATE staff_attendance
                SET staff_id = ?,
                    shift_id = ?,
                    check_in_time = ?,
                    check_out_time = ?,
                    work_duration_hours = ?,
                    check_in_latitude = ?,
                    check_in_longitude = ?,
                    check_in_accuracy_m = ?,
                    check_in_distance_m = ?,
                    status = CAST(? AS attendance_status)
                WHERE id = ?
                """;

        jdbcTemplate.update(
                sql,
                attendanceRecord.staffId(),
                attendanceRecord.shiftId(),
                attendanceRecord.checkInTime(),
                attendanceRecord.checkOutTime(),
                attendanceRecord.workDurationHours(),
                attendanceRecord.checkInLatitude(),
                attendanceRecord.checkInLongitude(),
                attendanceRecord.checkInAccuracyMeters(),
                attendanceRecord.checkInDistanceMeters(),
                attendanceRecord.status().name(),
                attendanceRecord.id()
        );
    }

    private AttendanceRecord mapAttendanceRecord(ResultSet rs, int rowNum) throws SQLException {
        return AttendanceRecord.builder()
                .id((UUID) rs.getObject("id"))
                .staffId(rs.getInt("staff_id"))
                .shiftId(rs.getObject("shift_id", Integer.class))
                .checkInTime(rs.getTimestamp("check_in_time").toLocalDateTime())
                .checkOutTime(rs.getTimestamp("check_out_time") == null
                        ? null
                        : rs.getTimestamp("check_out_time").toLocalDateTime())
                .workDurationHours(rs.getBigDecimal("work_duration_hours"))
                .checkInLatitude(rs.getBigDecimal("check_in_latitude"))
                .checkInLongitude(rs.getBigDecimal("check_in_longitude"))
                .checkInAccuracyMeters(rs.getBigDecimal("check_in_accuracy_m"))
                .checkInDistanceMeters(rs.getBigDecimal("check_in_distance_m"))
                .status(AttendanceStatus.valueOf(rs.getString("status")))
                .build();
    }
}
