package backend.booking.application.port.in.command;

import backend.addon.domain.model.AddonSelection;
import backend.entity.PaymentMethod;

import java.time.LocalDateTime;
import java.util.List;

public record CreateBookingCommand(
        Integer roomId,
        LocalDateTime startTime,
        LocalDateTime endTime,
        PaymentMethod paymentMethod,
        String couponCode,
        String note,
        String customerEmail,
        List<AddonSelection> addons
) {
    public CreateBookingCommand(Integer roomId, LocalDateTime startTime, LocalDateTime endTime,
                                PaymentMethod paymentMethod, String couponCode, String note, String customerEmail) {
        this(roomId, startTime, endTime, paymentMethod, couponCode, note, customerEmail, List.of());
    }
}
