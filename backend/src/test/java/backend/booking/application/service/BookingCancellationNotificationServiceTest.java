package backend.booking.application.service;

import backend.entity.Booking;
import backend.entity.Customer;
import backend.entity.PaymentMethod;
import backend.entity.User;
import backend.repository.AppNotificationRepository;
import jakarta.mail.Message;
import jakarta.mail.Multipart;
import jakarta.mail.Part;
import jakarta.mail.Session;
import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.javamail.JavaMailSender;

import java.math.BigDecimal;
import java.util.Properties;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BookingCancellationNotificationServiceTest {

    @Mock
    private JavaMailSender mailSender;

    @Mock
    private AppNotificationRepository appNotificationRepository;

    private BookingCancellationNotificationService service;

    @BeforeEach
    void setUp() {
        service = new BookingCancellationNotificationService(mailSender, appNotificationRepository);
    }

    @Test
    void sendsUtf8CancellationEmailWithSafeVietnameseTypography() throws Exception {
        MimeMessage message = new MimeMessage(Session.getInstance(new Properties()));
        when(mailSender.createMimeMessage()).thenReturn(message);

        User account = User.builder().email("customer@example.com").password("hash").build();
        Customer customer = Customer.builder()
                .account(account)
                .fullName("Nguyễn Văn A")
                .email("customer@example.com")
                .build();
        Booking booking = Booking.builder()
                .id(18)
                .customer(customer)
                .paymentMethod(PaymentMethod.ONLINE)
                .build();

        service.notifyCancellationRefund(booking, new BigDecimal("500000"));

        verify(mailSender).send(message);
        verify(appNotificationRepository).save(any());
        message.saveChanges();
        assertEquals(
                "[The Serene Villa] Xác nhận hủy lịch và hoàn tiền BR00000018",
                message.getSubject()
        );
        assertEquals("customer@example.com", message.getRecipients(Message.RecipientType.TO)[0].toString());

        String content = extractText(message);
        assertTrue(content.contains("<meta charset=\"UTF-8\">"));
        assertTrue(content.contains("Hủy lịch thành công"));
        assertTrue(content.contains("word-spacing:normal"));
        assertTrue(content.contains("Hoàn về phương thức thanh toán online ban đầu"));
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
