package backend.booking.application.port.in.command;

public record ReviewCustomerCancellationCommand(
        Integer bookingId,
        boolean approved,
        String adminNote,
        String currentUserEmail
) {
}
