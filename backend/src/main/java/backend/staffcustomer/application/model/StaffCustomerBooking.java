package backend.staffcustomer.application.model;

import backend.entity.BookingStatus;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;

public record StaffCustomerBooking(
        Integer id,
        String code,
        Integer customerId,
        String roomName,
        LocalDate date,
        LocalTime startTime,
        LocalTime endTime,
        BigDecimal totalPrice,
        BookingStatus status
) {
}
