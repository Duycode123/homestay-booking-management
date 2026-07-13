package backend.dto.response;

import java.time.LocalDateTime;

public record TimeSlotResponse(
        LocalDateTime startTime,
        LocalDateTime endTime
) {
}
