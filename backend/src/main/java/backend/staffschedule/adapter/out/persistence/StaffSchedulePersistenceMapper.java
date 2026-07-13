package backend.staffschedule.adapter.out.persistence;

import backend.entity.Booking;
import backend.staffschedule.domain.model.StaffShift;
import backend.staffschedule.domain.model.StaffShiftBooking;
import org.springframework.stereotype.Component;

@Component
public class StaffSchedulePersistenceMapper {

    StaffShift toDomain(ShiftJpaEntity shift) {
        return new StaffShift(
                shift.getId(),
                shift.getStaff().getId(),
                shift.getDate(),
                shift.getStartTime(),
                shift.getEndTime()
        );
    }

    StaffShiftBooking toShiftBooking(Booking booking) {
        return new StaffShiftBooking(
                booking.getId(),
                booking.getRoom().getRoomName(),
                booking.getCustomer().getFullName(),
                booking.getStartTime(),
                booking.getEndTime(),
                booking.getStatus().name(),
                booking.getInstrumentNote()
        );
    }
}
