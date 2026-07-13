package backend.auth.application.port.out;

public interface EmailVerificationNotificationPort {
    void sendVerificationEmail(String recipientEmail, String verificationLink);
}
