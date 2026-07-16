package backend.addon.domain.model;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record BookingAddonItem(
        Long id,
        Integer bookingId,
        Long serviceId,
        String name,
        String unit,
        BigDecimal unitPrice,
        int quantity,
        BigDecimal totalAmount,
        AddonSource source,
        BookingAddonStatus status,
        String note,
        LocalDateTime deliveredAt,
        LocalDateTime createdAt
) {
}
