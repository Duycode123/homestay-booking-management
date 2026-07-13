package backend.booking.application.port.in.query;

import backend.entity.BookingStatus;

import java.time.LocalDateTime;

public record ListBookingsForManagementQuery(
        BookingStatus status,
        Integer roomId,
        String search,
        LocalDateTime from,
        LocalDateTime to,
        Integer page,
        Integer size,
        String sortBy,
        String direction,
        String currentUserEmail
) {

    public ListBookingsForManagementQuery(BookingStatus status, String currentUserEmail) {
        this(status, null, null, null, null, null, null, null, null, currentUserEmail);
    }
}
