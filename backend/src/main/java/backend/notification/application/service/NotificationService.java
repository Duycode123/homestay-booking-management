package backend.notification.application.service;

import backend.exception.ForbiddenException;
import backend.exception.ResourceNotFoundException;
import backend.notification.application.model.NotificationItem;
import backend.notification.application.port.in.NotificationUseCase;
import backend.notification.application.port.in.command.NotificationCommand;
import backend.notification.application.port.out.NotificationPort;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class NotificationService implements NotificationUseCase {

    private static final int MAX_LIMIT = 50;
    private final NotificationPort notificationPort;

    @Override
    public List<NotificationItem> listNotifications(String currentUserEmail, int limit) {
        return notificationPort.loadNotifications(loadAccountId(currentUserEmail), normalizeLimit(limit));
    }

    @Override
    @Transactional
    public NotificationItem markRead(NotificationCommand command) {
        if (command == null || command.notificationId() == null || command.notificationId() <= 0) {
            throw new IllegalArgumentException("Thong bao khong hop le");
        }

        Integer accountId = loadAccountId(command.currentUserEmail());
        return notificationPort.markRead(command.notificationId(), accountId)
                .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay thong bao"));
    }

    @Override
    @Transactional
    public List<NotificationItem> markAllRead(String currentUserEmail, int limit) {
        return notificationPort.markAllRead(loadAccountId(currentUserEmail), normalizeLimit(limit));
    }

    private Integer loadAccountId(String email) {
        if (email == null || email.isBlank()) {
            throw new ForbiddenException("Khong tim thay tai khoan dang nhap");
        }
        return notificationPort.loadAccountIdByEmail(email.trim())
                .orElseThrow(() -> new ForbiddenException("Khong tim thay tai khoan dang nhap"));
    }

    private int normalizeLimit(int limit) {
        return Math.max(1, Math.min(limit, MAX_LIMIT));
    }
}
