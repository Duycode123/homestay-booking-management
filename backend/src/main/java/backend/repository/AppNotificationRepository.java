package backend.repository;

import backend.entity.AppNotification;
import backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AppNotificationRepository extends JpaRepository<AppNotification, Long> {
    boolean existsByRecipientAndTypeAndTitle(User recipient, String type, String title);
}
