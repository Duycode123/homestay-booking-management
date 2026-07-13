package backend.staffcustomer.adapter.in.web.dto;

import backend.staffcustomer.application.model.StaffCustomerBooking;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;

public record StaffCustomerBookingResponse(
        Integer id,
        String code,
        Integer customerId,
        String roomName,
        LocalDate date,
        LocalTime startTime,
        LocalTime endTime,
        BigDecimal totalPrice,
        String status
) {
    public static StaffCustomerBookingResponse from(StaffCustomerBooking booking) {
        return new StaffCustomerBookingResponse(
                booking.id(),
                booking.code(),
                booking.customerId(),
                booking.roomName(),
                booking.date(),
                booking.startTime(),
                booking.endTime(),
                booking.totalPrice(),
                booking.status() == null ? null : booking.status().name()
        );
    }
}
