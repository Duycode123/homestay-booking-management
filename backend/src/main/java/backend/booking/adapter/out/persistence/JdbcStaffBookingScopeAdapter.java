package backend.booking.adapter.out.persistence;

import backend.booking.application.port.out.LoadStaffBookingScopePort;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.LinkedHashSet;
import java.util.Set;

@Component
@RequiredArgsConstructor
public class JdbcStaffBookingScopeAdapter implements LoadStaffBookingScopePort {

    private static final String STAFF_BOOKING_SCOPE = """
            FROM booking booking
            WHERE CAST(booking.status AS text) NOT IN ('CANCELLED', 'EXPIRED')
              AND EXISTS (
                  SELECT 1
                  FROM shift assigned_shift
                  JOIN staff assigned_staff ON assigned_staff.id = assigned_shift.staff_id
                  JOIN account staff_account ON staff_account.id = assigned_staff.account_id
                  WHERE LOWER(staff_account.email) = LOWER(?)
                    AND booking.start_time < (
                        assigned_shift.date + assigned_shift.end_time
                        + CASE
                            WHEN assigned_shift.end_time <= assigned_shift.start_time
                            THEN INTERVAL '1 day'
                            ELSE INTERVAL '0 day'
                          END
                    )
                    AND booking.end_time > (assigned_shift.date + assigned_shift.start_time)
              )
            """;

    private final JdbcTemplate jdbcTemplate;

    @Override
    public Set<Integer> loadAccessibleBookingIds(String accountEmail) {
        String sql = "SELECT booking.id " + STAFF_BOOKING_SCOPE + " ORDER BY booking.start_time";
        return new LinkedHashSet<>(jdbcTemplate.queryForList(sql, Integer.class, accountEmail));
    }

    @Override
    public boolean canAccessBooking(String accountEmail, Integer bookingId) {
        String sql = "SELECT EXISTS (SELECT 1 " + STAFF_BOOKING_SCOPE + " AND booking.id = ?)";
        return Boolean.TRUE.equals(jdbcTemplate.queryForObject(sql, Boolean.class, accountEmail, bookingId));
    }
}
