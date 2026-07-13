package backend.dto.response;

import java.time.LocalDateTime;
import java.util.List;

public record RoomAvailabilityResponse(
        Integer roomId,
        String roomName,
        LocalDateTime from,
        LocalDateTime to,
        boolean operational,
        List<TimeSlotResponse> availableSlots
) {
}
