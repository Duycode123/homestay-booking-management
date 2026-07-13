package backend.staffcustomer.application.service;

import backend.entity.BookingStatus;
import backend.entity.Role;
import backend.exception.ForbiddenException;
import backend.staffcustomer.application.model.StaffCustomerActor;
import backend.staffcustomer.application.model.StaffCustomerBooking;
import backend.staffcustomer.application.model.StaffCustomerBookingRow;
import backend.staffcustomer.application.model.StaffCustomerType;
import backend.staffcustomer.application.port.in.query.ListStaffCustomersQuery;
import backend.staffcustomer.application.port.out.StaffCustomerQueryPort;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class StaffCustomerServiceTest {

    @Test
    void listsCustomerSummariesFromBookingRows() {
        StubPort port = new StubPort(
                Optional.of(new StaffCustomerActor(1, 10, Role.STAFF)),
                List.of(
                        row(1, "Blue River", booking(101, 1, "Deluxe Balcony 201", LocalDate.of(2026, 7, 8))),
                        row(1, "Blue River", booking(100, 1, "Deluxe Balcony 201", LocalDate.of(2026, 7, 1))),
                        row(2, "New Guest", booking(102, 2, "Deluxe City View 202", LocalDate.of(2026, 7, 7)))
                )
        );
        StaffCustomerService service = new StaffCustomerService(port);

        var result = service.listCustomers(new ListStaffCustomersQuery("staff@example.com", LocalDate.of(2026, 7, 8)));

        assertThat(result).hasSize(2);
        assertThat(result.getFirst().name()).isEqualTo("Blue River");
        assertThat(result.getFirst().type()).isEqualTo(StaffCustomerType.RETURNING);
        assertThat(result.getFirst().bookingCount()).isEqualTo(2);
        assertThat(result.getFirst().favoriteRoom()).isEqualTo("Deluxe Balcony 201");
        assertThat(result.getFirst().hasTodayBooking()).isTrue();
        assertThat(result.getFirst().recentBookings()).extracting(StaffCustomerBooking::id).containsExactly(101, 100);
        assertThat(result.get(1).type()).isEqualTo(StaffCustomerType.NEW);
    }

    @Test
    void rejectsNonStaffActor() {
        StaffCustomerService service = new StaffCustomerService(new StubPort(
                Optional.of(new StaffCustomerActor(1, null, Role.CUSTOMER)),
                List.of()
        ));

        assertThatThrownBy(() -> service.listCustomers(new ListStaffCustomersQuery("customer@example.com", LocalDate.now())))
                .isInstanceOf(ForbiddenException.class);
    }

    private StaffCustomerBookingRow row(Integer customerId, String customerName, StaffCustomerBooking booking) {
        return new StaffCustomerBookingRow(customerId, customerName, "0900000000", customerName + "@example.com", booking);
    }

    private StaffCustomerBooking booking(Integer id, Integer customerId, String roomName, LocalDate date) {
        return new StaffCustomerBooking(
                id,
                "BR%08d".formatted(id),
                customerId,
                roomName,
                date,
                LocalTime.of(9, 0),
                LocalTime.of(10, 0),
                BigDecimal.valueOf(250000),
                BookingStatus.PAID
        );
    }

    private record StubPort(
            Optional<StaffCustomerActor> actor,
            List<StaffCustomerBookingRow> rows
    ) implements StaffCustomerQueryPort {
        @Override
        public Optional<StaffCustomerActor> loadActorByEmail(String email) {
            return actor;
        }

        @Override
        public List<StaffCustomerBookingRow> loadCustomerBookingRows() {
            return rows;
        }
    }
}
