package backend.booking.application.port.in.query;

import backend.entity.BookingStatus;

import java.time.LocalDateTime;

public record CustomerBookingHistoryQuery(
        String customerEmail,
        BookingStatus status,
        LocalDateTime from,
        LocalDateTime to,
        int page,
        int size,
        String sortBy,
        String direction
) {
}
