package backend.notification.application.port.out;

import backend.notification.application.model.NotificationItem;

import java.util.List;
import java.util.Optional;

public interface NotificationPort {
    Optional<Integer> loadAccountIdByEmail(String email);

    List<NotificationItem> loadNotifications(Integer accountId, int limit);

    Optional<NotificationItem> markRead(Long notificationId, Integer accountId);

    List<NotificationItem> markAllRead(Integer accountId, int limit);
}
