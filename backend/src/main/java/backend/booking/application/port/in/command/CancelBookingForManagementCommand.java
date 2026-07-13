package backend.booking.application.port.in.command;

public record CancelBookingForManagementCommand(
        Integer bookingId,
        String reason,
        String currentUserEmail
) {
}
