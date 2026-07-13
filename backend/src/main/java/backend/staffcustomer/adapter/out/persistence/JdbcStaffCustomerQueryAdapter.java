package backend.staffcustomer.adapter.out.persistence;

import backend.entity.BookingStatus;
import backend.entity.Role;
import backend.staffcustomer.application.model.StaffCustomerActor;
import backend.staffcustomer.application.model.StaffCustomerBooking;
import backend.staffcustomer.application.model.StaffCustomerBookingRow;
import backend.staffcustomer.application.port.out.StaffCustomerQueryPort;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class JdbcStaffCustomerQueryAdapter implements StaffCustomerQueryPort {

    private static final int BOOKING_ROW_LIMIT = 500;

    private final JdbcTemplate jdbcTemplate;

    @Override
    public Optional<StaffCustomerActor> loadActorByEmail(String email) {
        String sql = """
                SELECT account.id AS account_id, account.role, staff.id AS staff_id
                FROM account
                LEFT JOIN staff ON staff.account_id = account.id
                WHERE LOWER(account.email) = LOWER(?)
                """;

        return jdbcTemplate.query(sql, (rs, rowNum) -> new StaffCustomerActor(
                rs.getInt("account_id"),
                rs.getObject("staff_id", Integer.class),
                Role.valueOf(rs.getString("role"))
        ), email).stream().findFirst();
    }

    @Override
    public List<StaffCustomerBookingRow> loadCustomerBookingRows() {
        String sql = """
                SELECT customer.id AS customer_id,
                       customer.full_name AS customer_name,
                       customer.phone_number,
                       customer.email,
                       booking.id AS booking_id,
                       room.name AS room_name,
                       booking.start_time,
                       booking.end_time,
                       booking.total_price,
                       booking.status
                FROM booking
                JOIN customer ON customer.id = booking.customer_id
                JOIN room ON room.id = booking.room_id
                ORDER BY booking.start_time DESC, booking.id DESC
                LIMIT ?
                """;

        return jdbcTemplate.query(sql, this::mapBookingRow, BOOKING_ROW_LIMIT);
    }

    private StaffCustomerBookingRow mapBookingRow(ResultSet rs, int rowNum) throws SQLException {
        Integer bookingId = rs.getInt("booking_id");
        LocalDateTime startTime = toLocalDateTime(rs.getTimestamp("start_time"));
        LocalDateTime endTime = toLocalDateTime(rs.getTimestamp("end_time"));
        StaffCustomerBooking booking = new StaffCustomerBooking(
                bookingId,
                "BR%08d".formatted(bookingId),
                rs.getInt("customer_id"),
                rs.getString("room_name"),
                startTime == null ? null : startTime.toLocalDate(),
                startTime == null ? null : startTime.toLocalTime(),
                endTime == null ? null : endTime.toLocalTime(),
                rs.getBigDecimal("total_price"),
                BookingStatus.valueOf(rs.getString("status"))
        );

        return new StaffCustomerBookingRow(
                rs.getInt("customer_id"),
                rs.getString("customer_name"),
                rs.getString("phone_number"),
                rs.getString("email"),
                booking
        );
    }

    private LocalDateTime toLocalDateTime(Timestamp timestamp) {
        return timestamp == null ? null : timestamp.toLocalDateTime();
    }
}
