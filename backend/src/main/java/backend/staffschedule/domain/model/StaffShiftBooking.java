package backend.staffschedule.domain.model;

import java.time.LocalDateTime;

public record StaffShiftBooking(
        Integer bookingId,
        String roomName,
        String customerName,
        LocalDateTime startTime,
        LocalDateTime endTime,
        String status,
        String equipmentNotes
) {
}
