package backend.booking.application.port.out.model;

import backend.entity.BookingStatus;

import java.time.LocalDateTime;

public record BookingManagementSearchCriteria(
        BookingStatus status,
        Integer roomId,
        String search,
        LocalDateTime from,
        LocalDateTime to,
        Integer page,
        Integer size,
        String sortBy,
        String direction
) {
}
