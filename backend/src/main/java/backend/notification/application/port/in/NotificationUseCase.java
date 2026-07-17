package backend.notification.application.port.in;

import backend.notification.application.model.NotificationItem;
import backend.notification.application.port.in.command.NotificationCommand;

import java.util.List;

public interface NotificationUseCase {
    List<NotificationItem> listNotifications(String currentUserEmail, int limit);

    NotificationItem markRead(NotificationCommand command);

    List<NotificationItem> markAllRead(String currentUserEmail, int limit);
}
