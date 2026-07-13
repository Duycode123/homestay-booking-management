package backend.staffschedule.adapter.out.persistence;

import backend.entity.Booking;
import backend.entity.BookingStatus;
import backend.repository.BookingRepository;
import backend.staffschedule.application.port.out.LoadStaffSchedulePort;
import backend.staffschedule.domain.model.StaffShift;
import backend.staffschedule.domain.model.StaffShiftBooking;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class StaffSchedulePersistenceAdapter implements LoadStaffSchedulePort {

    private final StaffScheduleStaffRepository staffRepository;
    private final ShiftRepository shiftRepository;
    private final BookingRepository bookingRepository;
    private final StaffSchedulePersistenceMapper mapper;
    private final JdbcTemplate jdbcTemplate;

    @Override
    public Optional<Integer> loadStaffIdByAccountEmail(String email) {
        Optional<Integer> existingStaffId = staffRepository.findByAccount_Email(email).map(staff -> staff.getId());
        if (existingStaffId.isPresent()) {
            return existingStaffId;
        }

        return createMissingStaffProfileForStaffAccount(email);
    }

    @Override
    public List<StaffShift> loadShifts(Integer staffId, LocalDate fromDate, LocalDate toDate) {
        String sql = """
                SELECT id, staff_id, date, start_time, end_time
                FROM shift
                WHERE staff_id = ?
                  AND date BETWEEN ? AND ?
                ORDER BY date ASC, start_time ASC
                """;

        return jdbcTemplate.query(
                sql,
                (rs, rowNum) -> new StaffShift(
                        rs.getInt("id"),
                        rs.getInt("staff_id"),
                        rs.getDate("date").toLocalDate(),
                        rs.getTime("start_time").toLocalTime(),
                        rs.getTime("end_time").toLocalTime()
                ),
                staffId,
                fromDate,
                toDate
        );
    }

    @Override
    public Optional<StaffShift> loadShift(Integer shiftId) {
        return shiftRepository.findById(shiftId).map(mapper::toDomain);
    }

    @Override
    public List<StaffShiftBooking> loadBookingsInShiftWindow(LocalDateTime shiftStart, LocalDateTime shiftEnd) {
        List<Booking> bookings = bookingRepository.findBookingsOverlappingWindow(
                shiftStart,
                shiftEnd,
                BookingStatus.CANCELLED
        );

        return bookings.stream()
                .map(mapper::toShiftBooking)
                .toList();
    }

    private Optional<Integer> createMissingStaffProfileForStaffAccount(String email) {
        String insertSql = """
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

        Optional<Integer> insertedStaffId = jdbcTemplate.query(
                insertSql,
                (rs, rowNum) -> rs.getInt("id"),
                email
        ).stream().findFirst();

        if (insertedStaffId.isPresent()) {
            return insertedStaffId;
        }

        return staffRepository.findByAccount_Email(email).map(staff -> staff.getId());
    }
}
