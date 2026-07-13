package backend.staffcustomer.application.model;

import java.time.LocalDate;
import java.util.List;

public record StaffCustomerSummary(
        Integer id,
        String name,
        String phone,
        String email,
        StaffCustomerType type,
        int bookingCount,
        LocalDate lastBookingAt,
        String favoriteRoom,
        boolean hasTodayBooking,
        List<StaffCustomerBooking> recentBookings
) {
}
