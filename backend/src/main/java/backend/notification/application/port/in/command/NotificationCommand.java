package backend.notification.application.port.in.command;

public record NotificationCommand(String currentUserEmail, Long notificationId) {
}
