package backend.staffschedule.application.port.in.command;

public record DecideShiftRegistrationCommand(
        Integer registrationId,
        String adminEmail,
        Boolean approved,
        String rejectionReason
) {
}
