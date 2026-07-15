package backend.booking.application.port.in.command;

public record SettleBookingAtCheckoutCommand(
        Integer bookingId,
        CheckoutSettlementMethod method,
        String currentUserEmail
) {
}
