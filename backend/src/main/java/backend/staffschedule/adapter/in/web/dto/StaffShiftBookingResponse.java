package backend.staffschedule.adapter.in.web.dto;

import java.time.LocalDateTime;

public record StaffShiftBookingResponse(
        Integer bookingId,
        String roomName,
        String customerName,
        LocalDateTime startTime,
        LocalDateTime endTime,
        String status,
        String equipmentNotes
) {
}
