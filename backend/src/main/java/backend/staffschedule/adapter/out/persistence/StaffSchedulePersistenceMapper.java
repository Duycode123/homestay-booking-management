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
                shift.getRoom() == null ? null : shift.getRoom().getId(),
                shift.getRoom() == null ? null : shift.getRoom().getRoomName(),
                shift.getRoom() == null ? null : formatAddress(shift.getRoom()),
                shift.getRoom() == null ? null : shift.getRoom().getLatitude(),
                shift.getRoom() == null ? null : shift.getRoom().getLongitude(),
                shift.getRoom() == null ? null : shift.getRoom().getCheckInRadiusMeters(),
                shift.getDate(),
                shift.getStartTime(),
                shift.getEndTime()
        );
    }

    private String formatAddress(backend.entity.Room room) {
        return java.util.stream.Stream.of(
                        room.getAddressLine(),
                        room.getWard(),
                        room.getDistrict(),
                        room.getCity()
                )
                .filter(value -> value != null && !value.isBlank())
                .distinct()
                .collect(java.util.stream.Collectors.joining(", "));
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
