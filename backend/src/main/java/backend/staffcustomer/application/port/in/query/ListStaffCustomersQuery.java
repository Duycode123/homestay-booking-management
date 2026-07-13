package backend.staffcustomer.application.port.in.query;

import java.time.LocalDate;

public record ListStaffCustomersQuery(
        String currentUserEmail,
        LocalDate today
) {
}
