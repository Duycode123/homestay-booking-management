package backend.user.application.port.in.command;

public record UpdateCurrentUserNotificationSettingsCommand(
        String currentUserEmail,
        Boolean newBooking,
        Boolean bookingReminder,
        Boolean shiftReminder,
        Boolean roomIssue,
        Boolean equipmentIssue
) {
}
