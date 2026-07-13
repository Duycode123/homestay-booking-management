package backend.booking.application.port.in.command;

import backend.entity.PaymentMethod;

import java.time.LocalDateTime;

public record CreateBookingCommand(
        Integer roomId,
        LocalDateTime startTime,
        LocalDateTime endTime,
        PaymentMethod paymentMethod,
        String couponCode,
        String note,
        String customerEmail
) {
}
