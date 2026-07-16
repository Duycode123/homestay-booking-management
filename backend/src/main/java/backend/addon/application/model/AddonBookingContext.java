package backend.addon.application.model;

import java.math.BigDecimal;

public record AddonBookingContext(
        Integer bookingId,
        Integer roomTierId,
        String customerEmail,
        String bookingStatus,
        BigDecimal totalAmount,
        BigDecimal addonAmount
) {
}
