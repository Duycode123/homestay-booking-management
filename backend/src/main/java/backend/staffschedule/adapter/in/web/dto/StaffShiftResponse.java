package backend.staffschedule.adapter.in.web.dto;

import java.time.LocalDate;
import java.time.LocalTime;
import java.math.BigDecimal;

public record StaffShiftResponse(
        Integer shiftId,
        Integer roomId,
        String roomName,
        String roomAddress,
        BigDecimal roomLatitude,
        BigDecimal roomLongitude,
        Integer checkInRadiusMeters,
        LocalDate date,
        LocalTime startTime,
        LocalTime endTime
) {
}
