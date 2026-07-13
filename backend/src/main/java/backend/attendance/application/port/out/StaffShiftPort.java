package backend.attendance.application.port.out;

import backend.attendance.domain.model.StaffShift;

import java.time.LocalDateTime;
import java.util.Optional;

public interface StaffShiftPort {
    Optional<StaffShift> loadCurrentShift(Integer staffId, LocalDateTime currentTime);
}
