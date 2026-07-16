package backend.booking.application.port.in.command;

import java.time.LocalDateTime;

public record CalculateBookingCostCommand(
        Integer roomId,
        LocalDateTime startTime,
        LocalDateTime endTime,
        String couponCode,
        String customerEmail
) {
    public CalculateBookingCostCommand(
            Integer roomId,
            LocalDateTime startTime,
            LocalDateTime endTime,
            String couponCode
    ) {
        this(roomId, startTime, endTime, couponCode, null);
    }
}
