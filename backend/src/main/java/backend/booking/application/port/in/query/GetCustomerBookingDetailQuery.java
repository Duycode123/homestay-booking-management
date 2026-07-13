package backend.booking.application.port.in.query;

public record GetCustomerBookingDetailQuery(
        Integer bookingId,
        String customerEmail
) {
}
