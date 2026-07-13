package backend.staffschedule.application.port.out;

import backend.staffschedule.domain.model.ShiftRegistration;
import backend.staffschedule.domain.model.ShiftRegistrationStatus;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

public interface ShiftRegistrationPort {

    ShiftRegistration save(ShiftRegistration registration);

    ShiftRegistration updateDecision(ShiftRegistration registration);

    Optional<ShiftRegistration> loadRegistration(Integer registrationId);

    List<ShiftRegistration> loadStaffRegistrations(Integer staffId, LocalDate fromDate, LocalDate toDate);

    List<ShiftRegistration> searchRegistrations(
            ShiftRegistrationStatus status,
            LocalDate fromDate,
            LocalDate toDate,
            Integer staffId
    );

    boolean existsOverlappingPendingOrApprovedRegistration(
            Integer staffId,
            LocalDate workDate,
            LocalTime startTime,
            LocalTime endTime
    );
}
