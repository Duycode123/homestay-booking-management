package backend.booking.application.port.out.model;

import backend.entity.BookingStatus;

import java.time.LocalDateTime;

public record CustomerBookingHistoryCriteria(
        Integer customerId,
        BookingStatus status,
        LocalDateTime from,
        LocalDateTime to,
        int page,
        int size,
        String sortBy,
        String direction
) {
}
