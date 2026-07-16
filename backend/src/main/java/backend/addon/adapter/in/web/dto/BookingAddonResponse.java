package backend.addon.adapter.in.web.dto;

import backend.addon.domain.model.BookingAddonItem;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public record BookingAddonResponse(Long id, Long serviceId, String name, String unit, BigDecimal unitPrice,
                                   int quantity, BigDecimal totalAmount, String source, String status,
                                   String note, LocalDateTime deliveredAt, LocalDateTime createdAt) {
    public static BookingAddonResponse from(BookingAddonItem item) {
        return new BookingAddonResponse(item.id(), item.serviceId(), item.name(), item.unit(), item.unitPrice(),
                item.quantity(), item.totalAmount(), item.source().name(), item.status().name(), item.note(),
                item.deliveredAt(), item.createdAt());
    }
}
