package backend.booking.application.port.in.command;

import backend.addon.domain.model.AddonSelection;
import java.time.LocalDateTime;
import java.util.List;

public record CalculateBookingCostCommand(
        Integer roomId,
        LocalDateTime startTime,
        LocalDateTime endTime,
        String couponCode,
        String customerEmail,
        List<AddonSelection> addons
) {
    public CalculateBookingCostCommand(
            Integer roomId,
            LocalDateTime startTime,
            LocalDateTime endTime,
            String couponCode
    ) {
        this(roomId, startTime, endTime, couponCode, null, List.of());
    }

    public CalculateBookingCostCommand(Integer roomId, LocalDateTime startTime, LocalDateTime endTime,
                                       String couponCode, String customerEmail) {
        this(roomId, startTime, endTime, couponCode, customerEmail, List.of());
    }
}
