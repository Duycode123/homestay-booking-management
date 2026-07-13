package backend.booking.application.port.in.command;

import java.time.LocalDateTime;

public record CalculateBookingCostCommand(
        Integer roomId,
        LocalDateTime startTime,
        LocalDateTime endTime,
        String couponCode
) {
}
