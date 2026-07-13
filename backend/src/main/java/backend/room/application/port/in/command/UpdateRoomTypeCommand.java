package backend.room.application.port.in.command;

import java.math.BigDecimal;

public record UpdateRoomTypeCommand(
        Integer roomTypeId,
        String typeName,
        String description,
        BigDecimal pricePerHour,
        String currentUserEmail
) {
}
