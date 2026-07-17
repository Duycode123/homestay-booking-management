package backend.notification.adapter.out.persistence;

import backend.notification.application.model.NotificationItem;
import backend.notification.application.model.NotificationPriority;
import backend.notification.application.port.out.NotificationPort;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class JdbcNotificationAdapter implements NotificationPort {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public Optional<Integer> loadAccountIdByEmail(String email) {
        return jdbcTemplate.query(
                "SELECT id FROM account WHERE lower(email) = lower(?) AND enabled = true",
                (rs, rowNum) -> rs.getInt("id"),
                email
        ).stream().findFirst();
    }

    @Override
    public List<NotificationItem> loadNotifications(Integer accountId, int limit) {
        return jdbcTemplate.query("""
                SELECT id, type, title, content, is_read, is_resolved, created_at
                FROM app_notification
                WHERE recipient_id = ?
                ORDER BY created_at DESC, id DESC
                LIMIT ?
                """, this::mapNotification, accountId, limit);
    }

    @Override
    public Optional<NotificationItem> markRead(Long notificationId, Integer accountId) {
        jdbcTemplate.update("""
                UPDATE app_notification
                SET is_read = true
                WHERE id = ? AND recipient_id = ?
                """, notificationId, accountId);
        return loadNotification(notificationId, accountId);
    }

    @Override
    public List<NotificationItem> markAllRead(Integer accountId, int limit) {
        jdbcTemplate.update("""
                UPDATE app_notification
                SET is_read = true
                WHERE recipient_id = ? AND is_read = false
                """, accountId);
        return loadNotifications(accountId, limit);
    }

    private Optional<NotificationItem> loadNotification(Long notificationId, Integer accountId) {
        return jdbcTemplate.query("""
                SELECT id, type, title, content, is_read, is_resolved, created_at
                FROM app_notification
                WHERE id = ? AND recipient_id = ?
                """, this::mapNotification, notificationId, accountId).stream().findFirst();
    }

    private NotificationItem mapNotification(ResultSet rs, int rowNum) throws SQLException {
        String type = rs.getString("type");
        return new NotificationItem(
                rs.getLong("id"),
                type,
                rs.getString("title"),
                rs.getString("content"),
                rs.getTimestamp("created_at").toLocalDateTime(),
                resolvePriority(type),
                resolveActionUrl(type),
                rs.getBoolean("is_read"),
                rs.getBoolean("is_resolved")
        );
    }

    private NotificationPriority resolvePriority(String type) {
        String normalized = type == null ? "" : type.toUpperCase();
        if (normalized.contains("FAILED") || normalized.contains("RETRY") || normalized.contains("ISSUE")) {
            return NotificationPriority.HIGH;
        }
        if (normalized.contains("REFUND") || normalized.contains("CANCEL") || normalized.contains("PAYMENT")) {
            return NotificationPriority.MEDIUM;
        }
        return NotificationPriority.LOW;
    }

    private String resolveActionUrl(String type) {
        String normalized = type == null ? "" : type.toUpperCase();
        if (normalized.contains("REFUND") || normalized.contains("BOOKING")
                || normalized.contains("PAYMENT") || normalized.contains("CHECKIN")
                || normalized.contains("CHECKOUT")) {
            return "/customer/bookings";
        }
        if (normalized.contains("ISSUE") || normalized.contains("SUPPORT")) {
            return "/customer/support";
        }
        return "/customer/notifications";
    }
}
