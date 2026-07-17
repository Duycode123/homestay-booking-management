package backend.notification.application.service;

import backend.exception.ResourceNotFoundException;
import backend.notification.application.model.NotificationItem;
import backend.notification.application.model.NotificationPriority;
import backend.notification.application.port.in.command.NotificationCommand;
import backend.notification.application.port.out.NotificationPort;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class NotificationServiceTest {

    @Mock
    private NotificationPort notificationPort;

    private NotificationService service;

    @BeforeEach
    void setUp() {
        service = new NotificationService(notificationPort);
    }

    @Test
    void listsOnlyNotificationsForCurrentAccountAndCapsLimit() {
        NotificationItem item = notification(12L, false);
        when(notificationPort.loadAccountIdByEmail("guest@example.com")).thenReturn(Optional.of(7));
        when(notificationPort.loadNotifications(7, 50)).thenReturn(List.of(item));

        List<NotificationItem> result = service.listNotifications(" guest@example.com ", 500);

        assertThat(result).containsExactly(item);
        verify(notificationPort).loadNotifications(7, 50);
    }

    @Test
    void marksNotificationReadOnlyWithinCurrentAccount() {
        NotificationItem item = notification(12L, true);
        when(notificationPort.loadAccountIdByEmail("guest@example.com")).thenReturn(Optional.of(7));
        when(notificationPort.markRead(12L, 7)).thenReturn(Optional.of(item));

        NotificationItem result = service.markRead(new NotificationCommand("guest@example.com", 12L));

        assertThat(result.read()).isTrue();
        verify(notificationPort).markRead(12L, 7);
    }

    @Test
    void rejectsNotificationThatDoesNotBelongToCurrentAccount() {
        when(notificationPort.loadAccountIdByEmail("guest@example.com")).thenReturn(Optional.of(7));
        when(notificationPort.markRead(99L, 7)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.markRead(new NotificationCommand("guest@example.com", 99L)))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    private NotificationItem notification(Long id, boolean read) {
        return new NotificationItem(
                id,
                "REFUND_COMPLETED",
                "Hoan tien thanh cong",
                "Khoan hoan da duoc xu ly.",
                LocalDateTime.now(),
                NotificationPriority.MEDIUM,
                "/customer/bookings",
                read,
                false
        );
    }
}
