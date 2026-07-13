package backend.staff.adapter.out.notification;

import backend.staff.application.port.out.StaffEmailVerificationNotificationPort;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Component;
import org.springframework.web.util.HtmlUtils;

@Component
@RequiredArgsConstructor
public class StaffEmailVerificationMailAdapter implements StaffEmailVerificationNotificationPort {

    private final JavaMailSender mailSender;

    @Value("${app.frontend.base-url:http://localhost:3000}")
    private String frontendBaseUrl;

    @Override
    public void sendVerificationEmail(String recipientEmail, String verificationToken) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setTo(recipientEmail);
            helper.setSubject("[Homestay Booking] Xac thuc email tai khoan staff");
            helper.setText(buildVerificationEmail(frontendLink("/verify-email?token=") + verificationToken), true);
            mailSender.send(message);
        } catch (Exception ex) {
            throw new RuntimeException("Khong the gui email xac thuc staff", ex);
        }
    }

    private String frontendLink(String path) {
        return frontendBaseUrl.replaceAll("/+$", "") + path;
    }

    private String buildVerificationEmail(String verificationLink) {
        String safeVerificationLink = HtmlUtils.htmlEscape(verificationLink);
        return """
                <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; border: 1px solid #f0f0f0; border-radius: 12px;">
                  <h2 style="color: #FF7518; margin-bottom: 16px;">Homestay Booking</h2>
                  <p>Admin da tao tai khoan staff cho ban. Vui long xac thuc email truoc khi dang nhap bang mat khau ban dau duoc cung cap.</p>
                  <p style="text-align: center; margin: 24px 0;">
                    <a href="%s" style="background-color: #FF7518; color: white; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: bold;">Xac thuc email</a>
                  </p>
                  <p style="font-size: 13px; color: #666;">Lien ket nay se het han sau 24 gio. Neu ban khong mong doi tai khoan nay, vui long lien he admin.</p>
                </div>
                """.formatted(safeVerificationLink);
    }
}
