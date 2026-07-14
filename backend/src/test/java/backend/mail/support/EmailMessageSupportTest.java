package backend.mail.support;

import jakarta.mail.Multipart;
import jakarta.mail.Part;
import jakarta.mail.Session;
import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.Test;
import org.springframework.mail.javamail.MimeMessageHelper;

import java.util.Properties;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class EmailMessageSupportTest {

    @Test
    void normalizesDecomposedVietnameseCharactersToNfc() {
        String decomposed = "Hoa\u0300n tie\u0302\u0300n tha\u0300nh co\u0302ng";

        String normalized = EmailMessageSupport.normalize(decomposed);

        assertEquals("Hoàn tiền thành công", normalized);
        assertFalse(normalized.contains("e\u0302\u0300"));
    }

    @Test
    void createsUtf8MultipartMessageWithPlainAndHtmlAlternatives() throws Exception {
        MimeMessage message = new MimeMessage(Session.getInstance(new Properties()));
        MimeMessageHelper helper = EmailMessageSupport.multipartHelper(message);
        helper.setTo("customer@example.com");

        EmailMessageSupport.setContent(
                helper,
                "Hoàn tiền thành công",
                "Hoàn tiền thành công",
                "<html><body>Hoàn tiền thành công</body></html>"
        );
        message.saveChanges();

        assertEquals("Hoàn tiền thành công", message.getSubject());
        assertTrue(message.isMimeType("multipart/*"));
        assertTrue(extractText(message).contains("Hoàn tiền thành công"));
    }

    private String extractText(Part part) throws Exception {
        if (part.isMimeType("text/*")) {
            return String.valueOf(part.getContent());
        }
        if (part.isMimeType("multipart/*")) {
            Multipart multipart = (Multipart) part.getContent();
            StringBuilder result = new StringBuilder();
            for (int index = 0; index < multipart.getCount(); index++) {
                result.append(extractText(multipart.getBodyPart(index)));
            }
            return result.toString();
        }
        return "";
    }
}
