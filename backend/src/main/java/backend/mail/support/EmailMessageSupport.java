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
        helper.setSubject(normalize(subject));
        helper.setText(normalize(plainText), normalize(htmlText));
    }

    public static String normalize(String value) {
        return value == null ? "" : Normalizer.normalize(value, Normalizer.Form.NFC);
    }
}
