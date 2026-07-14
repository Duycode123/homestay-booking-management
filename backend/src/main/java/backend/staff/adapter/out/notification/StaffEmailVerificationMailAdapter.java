package backend.staff.adapter.out.notification;

import backend.config.FrontendUrlBuilder;
import backend.exception.EmailDeliveryException;
import backend.mail.support.EmailMessageSupport;
import backend.mail.template.HomestayAccountEmailTemplate;
import backend.staff.application.port.out.StaffEmailVerificationNotificationPort;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class StaffEmailVerificationMailAdapter implements StaffEmailVerificationNotificationPort {

    private final JavaMailSender mailSender;
    private final FrontendUrlBuilder frontendUrlBuilder;

    @Override
    public void sendVerificationEmail(String recipientEmail, String verificationToken) {
        try {
            String verificationLink = frontendUrlBuilder.linkTo("/verify-email?token=") + verificationToken;
            HomestayAccountEmailTemplate.Content content =
                    HomestayAccountEmailTemplate.forStaffVerification(verificationLink);
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = EmailMessageSupport.multipartHelper(message);
            helper.setTo(recipientEmail);
            EmailMessageSupport.setContent(helper, content.subject(), content.plainText(), content.htmlText());
            mailSender.send(message);
        } catch (Exception ex) {
            throw new EmailDeliveryException("Khong the gui email xac thuc staff", ex);
        }
    }
}
