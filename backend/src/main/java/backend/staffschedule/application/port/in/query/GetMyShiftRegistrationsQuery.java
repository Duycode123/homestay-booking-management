package backend.staffschedule.application.port.in.query;

import java.time.LocalDate;

public record GetMyShiftRegistrationsQuery(
        String staffEmail,
        LocalDate fromDate,
        LocalDate toDate
) {
}
