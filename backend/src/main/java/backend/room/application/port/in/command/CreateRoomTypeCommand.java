package backend.room.application.port.in.command;

import java.math.BigDecimal;

public record CreateRoomTypeCommand(
        String typeName,
        String description,
        BigDecimal pricePerHour,
        String currentUserEmail
) {
}
