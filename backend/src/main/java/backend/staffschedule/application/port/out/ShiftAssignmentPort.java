package backend.staffschedule.application.port.out;

import java.time.LocalDate;
import java.time.LocalTime;

public interface ShiftAssignmentPort {

    void lockStaffSchedule(Integer staffId, LocalDate workDate);

    boolean existsOverlappingAssignedShift(
            Integer staffId,
            LocalDate workDate,
            LocalTime startTime,
            LocalTime endTime
    );

    void createAssignedShift(Integer staffId, LocalDate workDate, LocalTime startTime, LocalTime endTime);
}
