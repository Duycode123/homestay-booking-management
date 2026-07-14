package backend.refund.adapter.out.notification;

import backend.config.FrontendUrlBuilder;
import backend.entity.AppNotification;
import backend.entity.Booking;
import backend.entity.Customer;
import backend.entity.User;
import backend.refund.domain.model.BookingRefund;
import backend.refund.domain.model.RefundMethod;
import backend.refund.domain.model.RefundStatus;
import backend.repository.AppNotificationRepository;
import backend.repository.BookingRepository;
import jakarta.mail.BodyPart;
import jakarta.mail.Message;
import jakarta.mail.Multipart;
import jakarta.mail.Part;
import jakarta.mail.Session;
import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.javamail.JavaMailSender;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.Properties;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RefundNotificationAdapterTest {

    @Mock
    private BookingRepository bookingRepository;

    @Mock
    private AppNotificationRepository appNotificationRepository;

    @Mock
    private JavaMailSender mailSender;

    private RefundNotificationAdapter adapter;
    private Booking booking;

    @BeforeEach
    void setUp() {
        adapter = new RefundNotificationAdapter(
                bookingRepository,
                appNotificationRepository,
                mailSender,
                new FrontendUrlBuilder("https://booking.example")
        );

        User account = User.builder().email("customer@example.com").password("hash").build();
        Customer customer = Customer.builder()
                .account(account)
                .fullName("Nguyễn Văn A")
                .email("customer@example.com")
                .build();
        booking = Booking.builder().id(18).customer(customer).build();
        when(bookingRepository.findById(18)).thenReturn(Optional.of(booking));
        when(appNotificationRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
    }

    @Test
    void sendsDetailedCompletedEmailWithoutExposingFullBankAccount() throws Exception {
        MimeMessage message = new MimeMessage(Session.getInstance(new Properties()));
        when(mailSender.createMimeMessage()).thenReturn(message);

        adapter.notifyCompleted(completedRefund());

        verify(mailSender).send(message);
        message.saveChanges();
        assertEquals("[The Serene Villa] Xác nhận hoàn tiền BR00000018", message.getSubject());
        assertEquals("customer@example.com", message.getRecipients(Message.RecipientType.TO)[0].toString());

        String html = extractText(message);
        assertTrue(html.contains("500.000 VND"));
        assertTrue(html.contains("REFUND-BR00000018-10"));
        assertTrue(html.contains("6789"));
        assertTrue(html.contains("https://booking.example/customer/bookings"));
        assertTrue(html.contains("https://booking.example/support"));
        assertTrue(html.contains("<meta charset=\"UTF-8\">"));
        assertTrue(html.contains("Hoàn tiền thành công"));
        assertTrue(html.contains("word-spacing:normal"));
        assertTrue(html.contains("Deluxe &lt;script&gt;alert(1)&lt;/script&gt;"));
        assertFalse(html.contains("0123456789"));
        assertFalse(html.contains("<script>"));

        ArgumentCaptor<AppNotification> notificationCaptor = ArgumentCaptor.forClass(AppNotification.class);
        verify(appNotificationRepository).save(notificationCaptor.capture());
        AppNotification notification = notificationCaptor.getValue();
        assertEquals("REFUND_COMPLETED", notification.getType());
        assertEquals("Đã hoàn tiền - BR00000018", notification.getTitle());
        assertTrue(notification.getContent().contains("500.000 VND"));
    }

    @Test
    void keepsInAppNotificationWhenEmailDeliveryFails() {
        when(mailSender.createMimeMessage()).thenThrow(new IllegalStateException("SMTP unavailable"));

        assertDoesNotThrow(() -> adapter.notifyCompleted(completedRefund()));

        verify(appNotificationRepository).save(any(AppNotification.class));
    }

    private BookingRefund completedRefund() {
        LocalDateTime completedAt = LocalDateTime.of(2026, 7, 15, 9, 30);
        return new BookingRefund(
                10L,
                18,
                "BR00000018",
                "Nguyễn Văn A",
                "customer@example.com",
                "Deluxe <script>alert(1)</script>",
                "970422",
                "MB Bank",
                "0123456789",
                "NGUYEN VAN A",
                5L,
                new BigDecimal("500000.00"),
                RefundMethod.MANUAL_BANK_TRANSFER,
                RefundStatus.COMPLETED,
                "REFUND-BR00000018-10",
                null,
                null,
                null,
                "admin@example.com",
                LocalDateTime.of(2026, 7, 17, 19, 0),
                LocalDateTime.of(2026, 7, 14, 18, 0),
                completedAt,
                LocalDateTime.of(2026, 7, 15, 9, 0),
                completedAt,
                1
        );
    }

    private String extractText(Part part) throws Exception {
        if (part.isMimeType("text/*")) {
            return String.valueOf(part.getContent());
        }
        if (part.isMimeType("multipart/*")) {
            Multipart multipart = (Multipart) part.getContent();
            StringBuilder result = new StringBuilder();
            for (int index = 0; index < multipart.getCount(); index++) {
                BodyPart bodyPart = multipart.getBodyPart(index);
                result.append(extractText(bodyPart));
            }
            return result.toString();
        }
        return "";
    }
}
