package backend.mail.template;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class HomestayAccountEmailTemplateTest {

    @Test
    void customerVerificationContainsResponsiveBrandingAndPlainTextFallback() {
        String link = "https://stay.example.com/verify-email?token=token-123";

        HomestayAccountEmailTemplate.Content content =
                HomestayAccountEmailTemplate.forCustomerVerification(link);

        assertTrue(content.subject().contains("Xác thực email"));
        assertTrue(content.plainText().contains(link));
        assertTrue(content.htmlText().contains("@media only screen and (max-width: 620px)"));
        assertTrue(content.htmlText().contains("background-color:#173A31"));
        assertTrue(content.htmlText().contains("href=\"" + link + "\""));
        assertTrue(content.htmlText().contains("<meta charset=\"UTF-8\">"));
        assertTrue(content.htmlText().contains("word-spacing:normal"));
        assertTrue(content.htmlText().contains("hyphens:none"));
        assertFalse(content.htmlText().contains("#FF7518"));
    }

    @Test
    void staffVerificationUsesOperationsSpecificCopy() {
        HomestayAccountEmailTemplate.Content content =
                HomestayAccountEmailTemplate.forStaffVerification(
                        "http://localhost:3000/verify-email?token=token-123"
                );

        assertTrue(content.subject().contains("nhân viên"));
        assertTrue(content.plainText().contains("hệ thống vận hành"));
    }

    @Test
    void passwordResetContainsThirtyMinuteExpiryAndFallbackLink() {
        String link = "https://stay.example.com/reset-password?token=token-123";

        HomestayAccountEmailTemplate.Content content =
                HomestayAccountEmailTemplate.forPasswordReset(link);

        assertTrue(content.subject().contains("Đặt lại mật khẩu"));
        assertTrue(content.plainText().contains("30 phút"));
        assertTrue(content.plainText().contains(link));
        assertTrue(content.htmlText().contains("30 ph"));
        assertTrue(content.htmlText().contains("href=\"" + link + "\""));
    }

    @Test
    void refusesRelativeActionLinks() {
        assertThrows(
                IllegalArgumentException.class,
                () -> HomestayAccountEmailTemplate.forCustomerVerification("/verify-email?token=token-123")
        );
        assertThrows(
                IllegalArgumentException.class,
                () -> HomestayAccountEmailTemplate.forPasswordReset("/reset-password?token=token-123")
        );
    }
}
