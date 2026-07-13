package backend.staff.application.port.out;

public interface StaffEmailVerificationNotificationPort {
    void sendVerificationEmail(String recipientEmail, String verificationToken);
}
