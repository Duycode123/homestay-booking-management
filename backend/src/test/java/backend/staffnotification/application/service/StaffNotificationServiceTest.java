package backend.staffnotification.application.service;

import backend.entity.Role;
import backend.exception.ForbiddenException;
import backend.exception.ResourceNotFoundException;
import backend.staffnotification.application.model.StaffNotificationActor;
import backend.staffnotification.application.model.StaffNotificationItem;
import backend.staffnotification.application.model.StaffNotificationPriority;
import backend.staffnotification.application.port.in.command.StaffNotificationCommand;
import backend.staffnotification.application.port.out.StaffNotificationPort;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class StaffNotificationServiceTest {

    @Test
    void listsNotificationsForStaffAccount() {
        StaffNotificationItem item = item(1L, false, false);
        StaffNotificationService service = new StaffNotificationService(new StubPort(
                Optional.of(new StaffNotificationActor(7, 3, Role.STAFF)),
                List.of(item),
                Optional.of(item)
        ));

        assertThat(service.listNotifications("staff@example.com")).containsExactly(item);
    }

    @Test
    void marksOwnedNotificationRead() {
        StaffNotificationItem readItem = item(1L, true, false);
        StaffNotificationService service = new StaffNotificationService(new StubPort(
                Optional.of(new StaffNotificationActor(7, 3, Role.STAFF)),
                List.of(readItem),
                Optional.of(readItem)
        ));

        StaffNotificationItem result = service.markRead(new StaffNotificationCommand("staff@example.com", 1L));

        assertThat(result.read()).isTrue();
    }

    @Test
    void rejectsNonStaffAccount() {
        StaffNotificationService service = new StaffNotificationService(new StubPort(
                Optional.of(new StaffNotificationActor(7, null, Role.CUSTOMER)),
                List.of(),
                Optional.empty()
        ));

        assertThatThrownBy(() -> service.listNotifications("customer@example.com"))
                .isInstanceOf(ForbiddenException.class);
    }

    @Test
    void throwsWhenNotificationNotOwnedOrMissing() {
        StaffNotificationService service = new StaffNotificationService(new StubPort(
                Optional.of(new StaffNotificationActor(7, 3, Role.STAFF)),
                List.of(),
                Optional.empty()
        ));

        assertThatThrownBy(() -> service.resolve(new StaffNotificationCommand("staff@example.com", 99L)))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    private StaffNotificationItem item(Long id, boolean read, boolean resolved) {
        return new StaffNotificationItem(
                id,
                "SYSTEM",
                "System notice",
                "Content",
                LocalDateTime.of(2026, 7, 8, 9, 0),
                StaffNotificationPriority.LOW,
                read,
                resolved
        );
    }

    private record StubPort(
            Optional<StaffNotificationActor> actor,
            List<StaffNotificationItem> items,
            Optional<StaffNotificationItem> updatedItem
    ) implements StaffNotificationPort {
        @Override
        public Optional<StaffNotificationActor> loadActorByEmail(String email) {
            return actor;
        }

        @Override
        public List<StaffNotificationItem> loadNotifications(Integer accountId) {
            return items;
        }

        @Override
        public Optional<StaffNotificationItem> markRead(Long notificationId, Integer accountId) {
            return updatedItem;
        }

        @Override
        public Optional<StaffNotificationItem> resolve(Long notificationId, Integer accountId) {
            return updatedItem;
        }

        @Override
        public List<StaffNotificationItem> markAllRead(Integer accountId) {
            return items;
        }
    }
}
