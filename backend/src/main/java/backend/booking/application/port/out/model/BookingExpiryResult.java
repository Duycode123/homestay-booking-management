package backend.booking.application.port.out.model;

public record BookingExpiryResult(
        int expiredBookingCount,
        int expiredTransactionCount
) {
}
