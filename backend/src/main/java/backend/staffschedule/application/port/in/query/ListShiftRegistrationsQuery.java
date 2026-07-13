package backend.staffschedule.application.port.in.query;

import backend.staffschedule.domain.model.ShiftRegistrationStatus;

import java.time.LocalDate;

public record ListShiftRegistrationsQuery(
        ShiftRegistrationStatus status,
        LocalDate fromDate,
        LocalDate toDate,
        Integer staffId
) {
}
