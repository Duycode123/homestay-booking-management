package backend.attendance.application.port.in;

import backend.attendance.application.port.in.command.CheckOutShiftCommand;
import backend.attendance.domain.model.AttendanceRecord;

public interface CheckOutShiftUseCase {
    AttendanceRecord checkOut(CheckOutShiftCommand command);
}
