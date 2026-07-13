package backend.staffschedule.application.port.in.query;

public record GetMyShiftBookingsQuery(
        String staffEmail,
        Integer shiftId
) {
}
