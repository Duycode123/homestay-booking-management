package backend.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record CustomerBookingCancellationResponse(
        BookingResponse booking,
        BigDecimal refundAmount,
        Integer refundPercentage,
        String refundMethod,
        LocalDateTime expectedRefundAt
) {
}
