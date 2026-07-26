package backend.staffschedule.application.port.in.command;

public record DecideShiftRegistrationCommand(
        Integer registrationId,
        String adminEmail,
        Boolean approved,
        String rejectionReason,
        Integer roomId
) {
    public DecideShiftRegistrationCommand(
            Integer registrationId,
            String adminEmail,
            Boolean approved,
            String rejectionReason
    ) {
        this(registrationId, adminEmail, approved, rejectionReason, null);
    }
}
