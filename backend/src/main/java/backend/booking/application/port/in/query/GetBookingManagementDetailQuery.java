package backend.booking.application.port.in.query;

public record GetBookingManagementDetailQuery(
        Integer bookingId,
        String currentUserEmail
) {
}
