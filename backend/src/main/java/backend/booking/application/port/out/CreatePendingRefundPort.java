package backend.booking.application.port.out;

import backend.entity.Booking;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public interface CreatePendingRefundPort {
    void createPendingRefundIfAbsent(
            Booking booking,
            BigDecimal amount,
            String refundMethod,
            LocalDateTime expectedAt
    );
}
