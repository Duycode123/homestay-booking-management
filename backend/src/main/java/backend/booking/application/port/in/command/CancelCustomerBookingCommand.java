package backend.booking.application.port.in.command;

public record CancelCustomerBookingCommand(
        Integer bookingId,
        String reason,
        String refundBankCode,
        String refundBankName,
        String refundAccountNumber,
        String refundAccountHolder,
        String customerEmail
) {
}
