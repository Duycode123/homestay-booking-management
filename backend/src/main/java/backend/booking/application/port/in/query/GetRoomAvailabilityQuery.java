package backend.booking.application.port.in.query;

import java.time.LocalDateTime;

public record GetRoomAvailabilityQuery(
        Integer roomId,
        LocalDateTime from,
        LocalDateTime to
) {
}
