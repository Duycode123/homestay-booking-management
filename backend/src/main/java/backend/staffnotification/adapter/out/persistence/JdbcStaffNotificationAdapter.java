package backend.staffnotification.adapter.out.persistence;

import backend.entity.Role;
import backend.staffnotification.application.model.StaffNotificationActor;
import backend.staffnotification.application.model.StaffNotificationItem;
import backend.staffnotification.application.model.StaffNotificationPriority;
import backend.staffnotification.application.port.out.StaffNotificationPort;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class JdbcStaffNotificationAdapter implements StaffNotificationPort {

    private static final int NOTIFICATION_LIMIT = 100;

    private final JdbcTemplate jdbcTemplate;

    @Override
    public Optional<StaffNotificationActor> loadActorByEmail(String email) {
        String sql = """
                SELECT account.id AS account_id, account.role, staff.id AS staff_id
                FROM account
                LEFT JOIN staff ON staff.account_id = account.id
                WHERE LOWER(account.email) = LOWER(?)
                """;

        return jdbcTemplate.query(sql, (rs, rowNum) -> new StaffNotificationActor(
                rs.getInt("account_id"),
                rs.getObject("staff_id", Integer.class),
                Role.valueOf(rs.getString("role"))
        ), email).stream().findFirst();
    }

    @Override
    public List<StaffNotificationItem> loadNotifications(Integer accountId) {
        String sql = """
                SELECT id, type, title, content, is_read, is_resolved, created_at
                FROM app_notification
                WHERE recipient_id = ?
                ORDER BY created_at DESC, id DESC
                LIMIT ?
                """;

        return jdbcTemplate.query(sql, this::mapNotification, accountId, NOTIFICATION_LIMIT);
    }

    @Override
    public Optional<StaffNotificationItem> markRead(Long notificationId, Integer accountId) {
        jdbcTemplate.update("""
                UPDATE app_notification
                SET is_read = true
                WHERE id = ? AND recipient_id = ?
                """, notificationId, accountId);
        return loadNotification(notificationId, accountId);
    }

    @Override
    public Optional<StaffNotificationItem> resolve(Long notificationId, Integer accountId) {
        jdbcTemplate.update("""
                UPDATE app_notification
                SET is_read = true,
                    is_resolved = true
                WHERE id = ? AND recipient_id = ?
                """, notificationId, accountId);
        return loadNotification(notificationId, accountId);
    }

    @Override
    public List<StaffNotificationItem> markAllRead(Integer accountId) {
        jdbcTemplate.update("""
                UPDATE app_notification
                SET is_read = true
                WHERE recipient_id = ?
                """, accountId);
        return loadNotifications(accountId);
    }

    private Optional<StaffNotificationItem> loadNotification(Long notificationId, Integer accountId) {
        String sql = """
                SELECT id, type, title, content, is_read, is_resolved, created_at
                FROM app_notification
                WHERE id = ? AND recipient_id = ?
                """;

        return jdbcTemplate.query(sql, this::mapNotification, notificationId, accountId).stream().findFirst();
    }

    private StaffNotificationItem mapNotification(ResultSet rs, int rowNum) throws SQLException {
        String type = rs.getString("type");
        return new StaffNotificationItem(
                rs.getLong("id"),
                type,
                rs.getString("title"),
                rs.getString("content"),
                rs.getTimestamp("created_at").toLocalDateTime(),
                resolvePriority(type),
                rs.getBoolean("is_read"),
                rs.getBoolean("is_resolved")
        );
    }

    private StaffNotificationPriority resolvePriority(String type) {
        if (type == null) {
            return StaffNotificationPriority.LOW;
        }
        String normalized = type.toUpperCase();
        if (normalized.contains("URGENT") || normalized.contains("ISSUE")) {
            return StaffNotificationPriority.HIGH;
        }
        if (normalized.contains("BOOKING") || normalized.contains("PAYMENT") || normalized.contains("REFUND")) {
            return StaffNotificationPriority.MEDIUM;
        }
        return StaffNotificationPriority.LOW;
    }
}
