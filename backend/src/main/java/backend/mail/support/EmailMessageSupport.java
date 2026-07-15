package backend.mail.support;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.mail.javamail.MimeMessageHelper;

import java.nio.charset.StandardCharsets;
import java.text.Normalizer;

/**
 * Keeps transactional email encoding consistent across all outbound mail adapters.
 */
public final class EmailMessageSupport {

    private static final String MAIL_FROM_PROPERTY = "mail.from";

    private EmailMessageSupport() {
    }

    public static MimeMessageHelper multipartHelper(MimeMessage message) throws MessagingException {
        return new MimeMessageHelper(
                message,
                MimeMessageHelper.MULTIPART_MODE_MIXED_RELATED,
                StandardCharsets.UTF_8.name()
        );
    }

    public static void setContent(
            MimeMessageHelper helper,
            String subject,
            String plainText,
            String htmlText
    ) throws MessagingException {
        setConfiguredFromAddress(helper);
        helper.setSubject(normalize(subject));
        helper.setText(normalize(plainText), normalize(htmlText));
    }

    private static void setConfiguredFromAddress(MimeMessageHelper helper) throws MessagingException {
        String fromAddress = helper.getMimeMessage().getSession().getProperty(MAIL_FROM_PROPERTY);
        if (fromAddress != null && !fromAddress.isBlank()) {
            helper.setFrom(fromAddress.trim());
        }
    }

    public static String normalize(String value) {
        return value == null ? "" : Normalizer.normalize(value, Normalizer.Form.NFC);
    }
}
