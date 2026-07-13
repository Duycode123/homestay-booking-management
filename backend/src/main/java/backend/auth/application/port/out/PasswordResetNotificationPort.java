package backend.auth.application.port.out;

public interface PasswordResetNotificationPort {
    void sendPasswordResetEmail(String recipientEmail, String resetLink);
}
