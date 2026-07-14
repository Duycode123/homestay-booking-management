package backend.auth.adapter.out.notification;

import backend.auth.application.port.out.PasswordResetNotificationPort;
import backend.exception.EmailDeliveryException;
import backend.mail.support.EmailMessageSupport;
import backend.mail.template.HomestayAccountEmailTemplate;
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
            HomestayAccountEmailTemplate.Content content =
                    HomestayAccountEmailTemplate.forPasswordReset(resetLink);
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = EmailMessageSupport.multipartHelper(message);
            helper.setTo(recipientEmail);
            EmailMessageSupport.setContent(helper, content.subject(), content.plainText(), content.htmlText());
            mailSender.send(message);
        } catch (Exception ex) {
            throw new EmailDeliveryException("Khong the gui email dat lai mat khau", ex);
        }
    }
}
