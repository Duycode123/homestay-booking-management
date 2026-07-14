package backend.booking.application.service;

import backend.entity.AppNotification;
import backend.entity.Booking;
import backend.mail.support.EmailMessageSupport;
import backend.repository.AppNotificationRepository;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.web.util.HtmlUtils;

import java.math.BigDecimal;
import java.text.NumberFormat;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

@Service
@RequiredArgsConstructor
@Slf4j
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
                .title("Hủy lịch thành công - " + variables.bookingCode())
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
            MimeMessageHelper helper = EmailMessageSupport.multipartHelper(message);
            helper.setTo(variables.customerEmail());
            EmailMessageSupport.setContent(
                    helper,
                    "[The Serene Villa] Xác nhận hủy lịch và hoàn tiền " + variables.bookingCode(),
                    buildPlainContent(variables),
                    buildHtmlEmail(variables)
            );
            mailSender.send(message);
        } catch (Exception ex) {
            log.warn("Khong the gui email thong bao huy booking {}; thong bao trong ung dung da duoc luu",
                    variables.bookingCode(), ex);
        }
    }

    private String buildPlainContent(TemplateVariables variables) {
        return """
                Hủy lịch thành công

                Xin chào %s,

                Đơn đặt phòng %s đã được hủy thành công.
                Số tiền hoàn: %s (100%%)
                Phương thức hoàn: %s
                Thời gian dự kiến nhận tiền: %s

                Cảm ơn bạn đã sử dụng dịch vụ của The Serene Villa.
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
                <!doctype html>
                <html lang="vi">
                  <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Hủy lịch thành công</title>
                    <style>
                      body, table, td, p, a, h1, h2, h3, span, div {
                        -webkit-text-size-adjust: 100%%;
                        -ms-text-size-adjust: 100%%;
                      }
                      .email-copy {
                        font-family: 'Segoe UI', Arial, Helvetica, sans-serif !important;
                        letter-spacing: normal;
                        word-spacing: normal;
                      }
                    </style>
                  </head>
                  <body class="email-copy" style="margin:0;background:#f5f1e9;padding:28px 12px;font-family:'Segoe UI',Arial,Helvetica,sans-serif;letter-spacing:normal;word-spacing:normal;color:#25312d">
                    <table role="presentation" width="100%%" cellspacing="0" cellpadding="0" border="0">
                      <tr><td align="center">
                        <table role="presentation" width="100%%" cellspacing="0" cellpadding="0" border="0" style="max-width:620px;background:#ffffff;border:1px solid #e3d8ca;border-radius:22px;overflow:hidden">
                          <tr><td style="padding:28px 32px;background:#17493c;color:#ffffff">
                            <div style="font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#e7c59d;font-weight:700">The Serene Villa</div>
                            <div class="email-copy" style="margin-top:10px;font-size:30px;line-height:1.25;font-weight:700;letter-spacing:normal;word-spacing:normal;word-break:normal;overflow-wrap:normal;hyphens:none">Hủy lịch thành công</div>
                            <div style="margin-top:10px;color:#d8e7e1;font-size:14px;line-height:1.6">Yêu cầu hủy của bạn đã được xác nhận và khoản hoàn đang được xử lý.</div>
                          </td></tr>
                          <tr><td style="padding:30px 32px">
                            <p style="margin:0;font-size:16px;line-height:1.7">Xin chào <strong>%s</strong>,</p>
                            <p style="margin:10px 0 0;color:#68736e;font-size:14px;line-height:1.7">Đơn đặt phòng của bạn đã được hủy thành công. Thông tin hoàn tiền dự kiến như sau:</p>
                            <table role="presentation" width="100%%" cellspacing="0" cellpadding="0" border="0" style="margin-top:20px;border-collapse:separate;border-spacing:0 8px;font-size:14px">
                              %s
                              %s
                              %s
                              %s
                            </table>
                            <div style="margin-top:20px;padding:16px 18px;border-radius:15px;background:#eef6f2;color:#315b4e;font-size:13px;line-height:1.65">Khi khoản hoàn được xử lý xong, hệ thống sẽ gửi thêm email xác nhận kèm mã đối soát.</div>
                          </td></tr>
                          <tr><td style="padding:18px 32px;border-top:1px solid #ece4da;background:#faf8f4;color:#858b88;font-size:11px;line-height:1.6;text-align:center">Email tự động từ The Serene Villa · Vui lòng không trả lời email này</td></tr>
                        </table>
                      </td></tr>
                    </table>
                  </body>
                </html>
                """.formatted(
                escape(variables.customerName()),
                detailRow("Mã booking", variables.bookingCode()),
                detailRow("Số tiền hoàn", variables.refundAmountText() + " (100%)"),
                detailRow("Phương thức hoàn", variables.refundMethod()),
                detailRow("Dự kiến nhận tiền", variables.expectedRefundAtText())
        );
    }

    private String detailRow(String label, String value) {
        return """
                <tr>
                  <td style="width:38%%;padding:10px 12px;color:#78817d;border-bottom:1px solid #eee7de">%s</td>
                  <td style="padding:10px 12px;color:#25312d;font-weight:700;border-bottom:1px solid #eee7de;text-align:right">%s</td>
                </tr>
                """.formatted(escape(label), escape(value));
    }

    private String escape(String value) {
        return HtmlUtils.htmlEscape(value == null ? "" : value);
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
            String customerName = booking.getCustomer() == null ? "Quý khách" : booking.getCustomer().getFullName();
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
                case ONLINE -> "Hoàn về phương thức thanh toán online ban đầu";
                case CASH -> "Hoàn tiền mặt tại quầy";
            };
        }
    }
}
