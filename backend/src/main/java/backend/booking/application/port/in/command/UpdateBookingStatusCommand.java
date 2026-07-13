package backend.booking.application.port.in.command;

import backend.entity.BookingStatus;

public record UpdateBookingStatusCommand(
        Integer bookingId,
        BookingStatus status,
        String currentUserEmail
) {
}
