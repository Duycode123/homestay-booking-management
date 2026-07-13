package backend.auth.adapter.out.notification;

import backend.auth.application.port.out.PasswordResetNotificationPort;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class PasswordResetMailAdapter implements PasswordResetNotificationPort {

    private final JavaMailSender mailSender;

    @Override
    public void sendPasswordResetEmail(String recipientEmail, String resetLink) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setTo(recipientEmail);
            helper.setSubject("[Homestay Booking] Yeu cau dat lai mat khau tai khoan");
            helper.setText(buildResetPasswordEmail(resetLink), true);
            mailSender.send(message);
        } catch (Exception ex) {
            throw new RuntimeException("Khong the gui email", ex);
        }
    }

    private String buildResetPasswordEmail(String resetLink) {
        return """
                <div style="font-family: Arial, sans-serif; max-width: 540px; margin: 0 auto; padding: 20px; border: 1px solid #f0f0f0; border-radius: 12px;">
                  <h2 style="color: #FF7518; margin-bottom: 20px;">Homestay Booking</h2>
                  <p>Chung toi nhan duoc yeu cau khoi phuc mat khau. Vui long bam vao nut duoi de dat lai mat khau:</p>
                  <p style="text-align: center; margin: 20px 0;">
                    <a href="%s" style="background-color: #FF7518; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">Dat lai mat khau</a>
                  </p>
                </div>
                """.formatted(resetLink);
    }
}
