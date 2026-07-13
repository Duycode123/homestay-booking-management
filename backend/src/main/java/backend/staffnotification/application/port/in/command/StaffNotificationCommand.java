package backend.staffnotification.application.port.in.command;

public record StaffNotificationCommand(
        String currentUserEmail,
        Long notificationId
) {
}
