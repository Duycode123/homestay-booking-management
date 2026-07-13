package backend.staffschedule.application.port.out;

import backend.staffschedule.domain.model.StaffShift;
import backend.staffschedule.domain.model.StaffShiftBooking;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface LoadStaffSchedulePort {

    Optional<Integer> loadStaffIdByAccountEmail(String email);

    List<StaffShift> loadShifts(Integer staffId, LocalDate fromDate, LocalDate toDate);

    Optional<StaffShift> loadShift(Integer shiftId);

    List<StaffShiftBooking> loadBookingsInShiftWindow(LocalDateTime shiftStart, LocalDateTime shiftEnd);
}
