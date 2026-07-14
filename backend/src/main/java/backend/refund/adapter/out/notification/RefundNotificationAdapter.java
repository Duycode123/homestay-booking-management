package backend.refund.adapter.out.notification;

import backend.config.FrontendUrlBuilder;
import backend.entity.AppNotification;
import backend.entity.Booking;
import backend.mail.support.EmailMessageSupport;
import backend.refund.application.port.out.RefundNotificationPort;
import backend.refund.domain.model.BookingRefund;
import backend.repository.AppNotificationRepository;
import backend.repository.BookingRepository;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Component;
import org.springframework.web.util.HtmlUtils;

import java.text.NumberFormat;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

@Component
@RequiredArgsConstructor
@Slf4j
public class RefundNotificationAdapter implements RefundNotificationPort {

    private final BookingRepository bookingRepository;
    private final AppNotificationRepository appNotificationRepository;
    private final JavaMailSender mailSender;
    private final FrontendUrlBuilder frontendUrlBuilder;

    private static final DateTimeFormatter DATE_TIME_FORMATTER = DateTimeFormatter.ofPattern(
            "HH:mm 'ngày' dd/MM/yyyy",
            Locale.forLanguageTag("vi-VN")
    );

    @Override
    public void notifyCompleted(BookingRefund refund) {
        Booking booking = loadBooking(refund.bookingId());
        String amount = formatMoney(refund);
        String reference = refund.transactionReference() == null ? "N/A" : refund.transactionReference();
        String content = "Khoản hoàn " + amount + " cho booking " + refund.bookingCode()
                + " đã được xử lý thành công. Mã đối soát: " + reference + ".";
        saveNotification(booking, "REFUND_COMPLETED", "Đã hoàn tiền - " + refund.bookingCode(), content);
        sendCompletedEmail(booking, refund);
    }

    @Override
    public void notifyRequiresAttention(BookingRefund refund) {
        Booking booking = loadBooking(refund.bookingId());
        String content = "Khoản hoàn cho booking " + refund.bookingCode()
                + " đang được bộ phận vận hành xử lý lại. Bạn không cần tạo thêm yêu cầu mới.";
        saveNotification(booking, "REFUND_RETRY_REQUIRED", "Đang xử lý lại hoàn tiền", content);
    }

    private Booking loadBooking(Integer bookingId) {
        return bookingRepository.findById(bookingId)
                .orElseThrow(() -> new IllegalStateException("Khong tim thay booking de gui thong bao hoan tien"));
    }

    private void saveNotification(Booking booking, String type, String title, String content) {
        if (booking.getCustomer() == null || booking.getCustomer().getAccount() == null) return;
        appNotificationRepository.save(AppNotification.builder()
                .recipient(booking.getCustomer().getAccount())
                .type(type)
                .title(title)
                .content(content)
                .read(false)
                .build());
    }

    private void sendCompletedEmail(Booking booking, BookingRefund refund) {
        String email = booking.getCustomer() == null ? null : booking.getCustomer().getEmail();
        if ((email == null || email.isBlank()) && booking.getCustomer() != null
                && booking.getCustomer().getAccount() != null) {
            email = booking.getCustomer().getAccount().getEmail();
        }
        if (email == null || email.isBlank()) return;

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = EmailMessageSupport.multipartHelper(message);
            helper.setTo(email);
            EmailMessageSupport.setContent(
                    helper,
                    "[The Serene Villa] Xác nhận hoàn tiền " + refund.bookingCode(),
                    buildCompletedEmailPlainText(booking, refund),
                    buildCompletedEmailHtml(booking, refund)
            );
            mailSender.send(message);
        } catch (Exception exception) {
            log.warn("Khong the gui email hoan tien cho booking {}; thong bao trong ung dung da duoc luu",
                    booking.getBookingCode(), exception);
        }
    }

    private String buildCompletedEmailHtml(Booking booking, BookingRefund refund) {
        String customerName = booking.getCustomer() == null
                ? "Quý khách"
                : valueOrDefault(booking.getCustomer().getFullName(), "Quý khách");
        String completedAt = refund.completedAt() == null
                ? "Đã được hệ thống ghi nhận"
                : refund.completedAt().format(DATE_TIME_FORMATTER);
        String accountSummary = maskAccountNumber(refund.recipientAccountNumber());
        String bookingsUrl = frontendUrlBuilder.linkTo("/customer/bookings");
        String supportUrl = frontendUrlBuilder.linkTo("/support");

        return """
                <!doctype html>
                <html lang="vi">
                  <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Hoàn tiền thành công</title>
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
                        <table role="presentation" width="100%%" cellspacing="0" cellpadding="0" border="0" style="max-width:640px;background:#ffffff;border:1px solid #e3d8ca;border-radius:24px;overflow:hidden;box-shadow:0 18px 50px rgba(23,73,60,.10)">
                          <tr><td style="padding:28px 32px;background:#17493c;color:#ffffff">
                            <div style="font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#e7c59d;font-weight:700">The Serene Villa</div>
                            <div class="email-copy" style="margin-top:10px;font-family:'Segoe UI',Arial,Helvetica,sans-serif;font-size:30px;line-height:1.25;font-weight:700;letter-spacing:normal;word-spacing:normal;word-break:normal;overflow-wrap:normal;hyphens:none">Hoàn tiền thành công</div>
                            <div style="margin-top:10px;color:#d8e7e1;font-size:14px;line-height:1.6">Khoản hoàn của bạn đã được bộ phận vận hành xác nhận.</div>
                          </td></tr>
                          <tr><td style="padding:30px 32px">
                            <p style="margin:0;font-size:16px;line-height:1.7">Xin chào <strong>%s</strong>,</p>
                            <p style="margin:10px 0 0;color:#68736e;font-size:14px;line-height:1.7">The Serene Villa xác nhận đã xử lý khoản hoàn cho đơn đặt phòng của bạn. Thông tin đối soát được ghi nhận như sau:</p>

                            <div style="margin-top:24px;padding:22px;border:1px solid #e7ddcf;border-radius:18px;background:#fcfaf6">
                              <div style="font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#9b7347;font-weight:700">Số tiền đã hoàn</div>
                              <div class="email-copy" style="margin-top:6px;font-family:'Segoe UI',Arial,Helvetica,sans-serif;font-size:32px;color:#17493c;font-weight:700;letter-spacing:normal;word-spacing:normal">%s</div>
                            </div>

                            <table role="presentation" width="100%%" cellspacing="0" cellpadding="0" border="0" style="margin-top:18px;border-collapse:separate;border-spacing:0 8px;font-size:14px">
                              %s
                              %s
                              %s
                              %s
                              %s
                              %s
                            </table>

                            <div style="margin-top:22px;padding:16px 18px;border-radius:15px;background:#eef6f2;color:#315b4e;font-size:13px;line-height:1.65">
                              Thời gian tiền được ghi có có thể phụ thuộc vào ngân hàng nhận. Nếu thông tin tài khoản không đúng hoặc bạn chưa nhận được tiền sau thời gian xử lý của ngân hàng, vui lòng liên hệ bộ phận hỗ trợ và cung cấp mã đối soát ở trên.
                            </div>

                            <div style="margin-top:26px;text-align:center">
                              <a href="%s" style="display:inline-block;padding:14px 24px;border-radius:14px;background:#b8824a;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700">Xem lịch sử đặt phòng</a>
                            </div>
                            <p style="margin:18px 0 0;text-align:center;color:#7b837f;font-size:12px;line-height:1.6">Cần hỗ trợ? <a href="%s" style="color:#17493c;font-weight:700">Mở trung tâm hỗ trợ</a></p>
                          </td></tr>
                          <tr><td style="padding:18px 32px;border-top:1px solid #ece4da;background:#faf8f4;color:#858b88;font-size:11px;line-height:1.6;text-align:center">
                            Email này được gửi tự động sau khi khoản hoàn được admin xác nhận trên hệ thống. The Serene Villa không bao giờ yêu cầu mật khẩu hoặc mã OTP ngân hàng qua email.
                          </td></tr>
                        </table>
                      </td></tr>
                    </table>
                  </body>
                </html>
                """.formatted(
                escape(customerName),
                escape(formatMoney(refund)),
                detailRow("Mã booking", refund.bookingCode()),
                detailRow("Phòng", refund.roomName()),
                detailRow("Ngân hàng nhận", refund.recipientBankName()),
                detailRow("Tài khoản nhận", accountSummary),
                detailRow("Mã đối soát", refund.transactionReference()),
                detailRow("Thời gian hoàn tất", completedAt),
                escapeAttribute(bookingsUrl),
                escapeAttribute(supportUrl)
        );
    }

    private String buildCompletedEmailPlainText(Booking booking, BookingRefund refund) {
        String customerName = booking.getCustomer() == null
                ? "Quý khách"
                : valueOrDefault(booking.getCustomer().getFullName(), "Quý khách");
        String completedAt = refund.completedAt() == null
                ? "Đã được hệ thống ghi nhận"
                : refund.completedAt().format(DATE_TIME_FORMATTER);

        return """
                Hoàn tiền thành công

                Xin chào %s,

                The Serene Villa xác nhận đã xử lý khoản hoàn cho đơn đặt phòng của bạn.

                Số tiền đã hoàn: %s
                Mã booking: %s
                Phòng: %s
                Ngân hàng nhận: %s
                Tài khoản nhận: %s
                Mã đối soát: %s
                Thời gian hoàn tất: %s

                Xem lịch sử đặt phòng: %s
                Trung tâm hỗ trợ: %s
                """.formatted(
                plainTextValue(customerName, "Quý khách"),
                formatMoney(refund),
                plainTextValue(refund.bookingCode(), "Không áp dụng"),
                plainTextValue(refund.roomName(), "Không áp dụng"),
                plainTextValue(refund.recipientBankName(), "Không áp dụng"),
                maskAccountNumber(refund.recipientAccountNumber()),
                plainTextValue(refund.transactionReference(), "Không áp dụng"),
                completedAt,
                frontendUrlBuilder.linkTo("/customer/bookings"),
                frontendUrlBuilder.linkTo("/support")
        );
    }

    private String plainTextValue(String value, String fallback) {
        return valueOrDefault(value, fallback)
                .replace('\r', ' ')
                .replace('\n', ' ')
                .replace('<', '‹')
                .replace('>', '›');
    }

    private String detailRow(String label, String value) {
        return """
                <tr>
                  <td style="width:38%%;padding:10px 12px;color:#78817d;border-bottom:1px solid #eee7de">%s</td>
                  <td style="padding:10px 12px;color:#25312d;font-weight:700;border-bottom:1px solid #eee7de;text-align:right;word-break:break-word">%s</td>
                </tr>
                """.formatted(escape(label), escape(valueOrDefault(value, "Không áp dụng")));
    }

    private String maskAccountNumber(String accountNumber) {
        if (accountNumber == null || accountNumber.isBlank()) return "Không áp dụng";
        String normalized = accountNumber.trim();
        if (normalized.length() <= 4) return "••••";
        return "•••• " + normalized.substring(normalized.length() - 4);
    }

    private String valueOrDefault(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value.trim();
    }

    private String escape(String value) {
        return HtmlUtils.htmlEscape(valueOrDefault(value, ""));
    }

    private String escapeAttribute(String value) {
        return HtmlUtils.htmlEscape(valueOrDefault(value, ""), "UTF-8");
    }

    private String formatMoney(BookingRefund refund) {
        return NumberFormat.getNumberInstance(Locale.forLanguageTag("vi-VN")).format(refund.amount()) + " VND";
    }
}
