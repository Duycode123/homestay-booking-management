package backend.booking.application.service;

import backend.entity.AppNotification;
import backend.entity.Booking;
import backend.repository.AppNotificationRepository;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.text.NumberFormat;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class BookingCancellationNotificationService {

    private static final String NOTIFICATION_TYPE = "BOOKING_CANCELLED_REFUND";
    private static final DateTimeFormatter DATE_TIME_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    private final JavaMailSender mailSender;
    private final AppNotificationRepository appNotificationRepository;

    @Value("${app.refund.expected-days:3}")
    private long expectedRefundDays;

    public LocalDateTime notifyCancellationRefund(Booking booking, BigDecimal refundAmount) {
        LocalDateTime expectedRefundAt = LocalDateTime.now().plusDays(expectedRefundDays);
        TemplateVariables variables = TemplateVariables.from(booking, refundAmount, expectedRefundAt);

        saveInAppNotification(booking, variables);
        sendCancellationEmail(variables);

        return expectedRefundAt;
    }

    private void saveInAppNotification(Booking booking, TemplateVariables variables) {
        if (booking.getCustomer() == null || booking.getCustomer().getAccount() == null) {
            return;
        }

        appNotificationRepository.save(AppNotification.builder()
                .recipient(booking.getCustomer().getAccount())
                .type(NOTIFICATION_TYPE)
                .title("Huy lich thanh cong - " + variables.bookingCode())
                .content(buildPlainContent(variables))
                .read(false)
                .build());
    }

    private void sendCancellationEmail(TemplateVariables variables) {
        if (variables.customerEmail() == null || variables.customerEmail().isBlank()) {
            return;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setTo(variables.customerEmail());
            helper.setSubject("[Homestay Booking] Xac nhan huy lich va hoan tien " + variables.bookingCode());
            helper.setText(buildHtmlEmail(variables), true);
            mailSender.send(message);
        } catch (Exception ex) {
            throw new RuntimeException("Khong the gui email thong bao huy lich", ex);
        }
    }

    private String buildPlainContent(TemplateVariables variables) {
        return """
                Xin chao %s, lich tap %s da duoc huy thanh cong. So tien hoan: %s (100%%). Phuong thuc hoan: %s. Thoi gian du kien nhan tien: %s.
                """.formatted(
                variables.customerName(),
                variables.bookingCode(),
                variables.refundAmountText(),
                variables.refundMethod(),
                variables.expectedRefundAtText()
        ).trim();
    }

    private String buildHtmlEmail(TemplateVariables variables) {
        return """
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #f0f0f0; border-radius: 12px;">
                  <h2 style="color: #FF7518; margin-bottom: 16px;">Homestay Booking</h2>
                  <p>Xin chao <strong>%s</strong>,</p>
                  <p>Yeu cau huy lich cua ban da duoc xac nhan thanh cong.</p>
                  <table style="width: 100%%; border-collapse: collapse; margin: 16px 0;">
                    <tr><td style="padding: 8px; border-bottom: 1px solid #eee;">Ma booking</td><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>%s</strong></td></tr>
                    <tr><td style="padding: 8px; border-bottom: 1px solid #eee;">So tien hoan</td><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>%s (100%%)</strong></td></tr>
                    <tr><td style="padding: 8px; border-bottom: 1px solid #eee;">Phuong thuc hoan</td><td style="padding: 8px; border-bottom: 1px solid #eee;">%s</td></tr>
                    <tr><td style="padding: 8px; border-bottom: 1px solid #eee;">Du kien nhan tien</td><td style="padding: 8px; border-bottom: 1px solid #eee;">%s</td></tr>
                  </table>
                  <p>Cam on ban da su dung dich vu cua Homestay Booking.</p>
                </div>
                """.formatted(
                variables.customerName(),
                variables.bookingCode(),
                variables.refundAmountText(),
                variables.refundMethod(),
                variables.expectedRefundAtText()
        );
    }

    private record TemplateVariables(
            String customerName,
            String customerEmail,
            String bookingCode,
            String refundAmountText,
            String refundMethod,
            String expectedRefundAtText
    ) {
        static TemplateVariables from(Booking booking, BigDecimal refundAmount, LocalDateTime expectedRefundAt) {
            String customerName = booking.getCustomer() == null ? "Khach hang" : booking.getCustomer().getFullName();
            String customerEmail = null;
            if (booking.getCustomer() != null) {
                customerEmail = booking.getCustomer().getEmail();
                if ((customerEmail == null || customerEmail.isBlank()) && booking.getCustomer().getAccount() != null) {
                    customerEmail = booking.getCustomer().getAccount().getEmail();
                }
            }

            return new TemplateVariables(
                    customerName,
                    customerEmail,
                    booking.getBookingCode(),
                    formatMoney(refundAmount),
                    resolveRefundMethod(booking),
                    expectedRefundAt.format(DATE_TIME_FORMATTER)
            );
        }

        private static String formatMoney(BigDecimal amount) {
            NumberFormat format = NumberFormat.getNumberInstance(Locale.forLanguageTag("vi-VN"));
            return format.format(amount) + " VND";
        }

        private static String resolveRefundMethod(Booking booking) {
            return switch (booking.getPaymentMethod()) {
                case ONLINE -> "Hoan ve phuong thuc thanh toan online ban dau";
                case CASH -> "Hoan tien mat tai quay";
            };
        }
    }
}
