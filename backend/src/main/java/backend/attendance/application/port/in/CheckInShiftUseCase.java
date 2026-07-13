package backend.attendance.application.port.in;

import backend.attendance.application.port.in.command.CheckInShiftCommand;
import backend.attendance.domain.model.AttendanceRecord;

public interface CheckInShiftUseCase {
    AttendanceRecord checkIn(CheckInShiftCommand command);
}
