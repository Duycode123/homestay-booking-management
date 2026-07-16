package backend.addon.domain.model;

import java.math.BigDecimal;

public record QuotedAddon(
        Long serviceId,
        String name,
        String unit,
        BigDecimal unitPrice,
        int quantity,
        BigDecimal totalAmount,
        String note
) {
}
