package backend.staffcustomer.adapter.in.web.dto;

import backend.staffcustomer.application.model.StaffCustomerSummary;

import java.time.LocalDate;
import java.util.List;

public record StaffCustomerSummaryResponse(
        Integer id,
        String name,
        String phone,
        String email,
        String type,
        int bookingCount,
        LocalDate lastBookingAt,
        String favoriteRoom,
        boolean hasTodayBooking,
        List<StaffCustomerBookingResponse> recentBookings
) {
    public static StaffCustomerSummaryResponse from(StaffCustomerSummary summary) {
        return new StaffCustomerSummaryResponse(
                summary.id(),
                summary.name(),
                summary.phone(),
                summary.email(),
                summary.type().name(),
                summary.bookingCount(),
                summary.lastBookingAt(),
                summary.favoriteRoom(),
                summary.hasTodayBooking(),
                summary.recentBookings().stream()
                        .map(StaffCustomerBookingResponse::from)
                        .toList()
        );
    }
}
