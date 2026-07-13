package backend.staffschedule.adapter.in.web.mapper;

import backend.staffschedule.adapter.in.web.dto.StaffShiftBookingResponse;
import backend.staffschedule.adapter.in.web.dto.StaffShiftResponse;
import backend.staffschedule.domain.model.StaffShift;
import backend.staffschedule.domain.model.StaffShiftBooking;
import org.springframework.stereotype.Component;

@Component
public class StaffScheduleWebMapper {

    public StaffShiftResponse toResponse(StaffShift shift) {
        return new StaffShiftResponse(
                shift.id(),
                shift.date(),
                shift.startTime(),
                shift.endTime()
        );
    }

    public StaffShiftBookingResponse toResponse(StaffShiftBooking booking) {
        return new StaffShiftBookingResponse(
                booking.bookingId(),
                booking.roomName(),
                booking.customerName(),
                booking.startTime(),
                booking.endTime(),
                booking.status(),
                booking.equipmentNotes()
        );
    }
}
