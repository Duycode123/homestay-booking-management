package backend.staffnotification.application.port.out;

import backend.staffnotification.application.model.StaffNotificationActor;
import backend.staffnotification.application.model.StaffNotificationItem;

import java.util.List;
import java.util.Optional;

public interface StaffNotificationPort {
    Optional<StaffNotificationActor> loadActorByEmail(String email);

    List<StaffNotificationItem> loadNotifications(Integer accountId);

    Optional<StaffNotificationItem> markRead(Long notificationId, Integer accountId);

    Optional<StaffNotificationItem> resolve(Long notificationId, Integer accountId);

    List<StaffNotificationItem> markAllRead(Integer accountId);
}
