package backend.booking.application.port.in.command;

public record CancelCustomerBookingCommand(
        Integer bookingId,
        String reason,
        String customerEmail
) {
}
