package backend.staffnotification.application.port.in;

import backend.staffnotification.application.model.StaffNotificationItem;
import backend.staffnotification.application.port.in.command.StaffNotificationCommand;

import java.util.List;

public interface StaffNotificationUseCase {
    List<StaffNotificationItem> listNotifications(String currentUserEmail);

    StaffNotificationItem markRead(StaffNotificationCommand command);

    StaffNotificationItem resolve(StaffNotificationCommand command);

    List<StaffNotificationItem> markAllRead(String currentUserEmail);
}
