package backend.mail.template;

import org.springframework.web.util.HtmlUtils;

import java.net.URI;
import java.net.URISyntaxException;
import java.util.Locale;

public final class HomestayAccountEmailTemplate {

    private static final String BRAND_NAME = "The Serene Villa";

    private HomestayAccountEmailTemplate() {
    }

    public static Content forCustomerVerification(String actionLink) {
        return build(
                new EmailCopy(
                        "Xác thực email để bắt đầu hành trình của bạn",
                        "Hoàn tất xác thực email để bảo vệ tài khoản The Serene Villa của bạn.",
                        "Chào mừng bạn đến với The Serene Villa",
                        "Cảm ơn bạn đã tạo tài khoản. Chỉ còn một bước để bảo vệ tài khoản và bắt đầu đặt kỳ nghỉ phù hợp.",
                        "Xác thực email",
                        "Liên kết có hiệu lực trong 24 giờ và chỉ sử dụng được một lần.",
                        "Nếu bạn không tạo tài khoản The Serene Villa, bạn có thể bỏ qua email này."
                ),
                actionLink
        );
    }

    public static Content forStaffVerification(String actionLink) {
        return build(
                new EmailCopy(
                        "Xác thực email tài khoản nhân viên",
                        "Xác thực email để truy cập hệ thống vận hành The Serene Villa.",
                        "Tài khoản nhân viên của bạn đã sẵn sàng",
                        "Quản trị viên đã tạo tài khoản nhân viên cho bạn. Hãy xác thực email trước khi đăng nhập vào hệ thống vận hành.",
                        "Xác thực email",
                        "Liên kết có hiệu lực trong 24 giờ và chỉ sử dụng được một lần.",
                        "Nếu bạn không mong đợi tài khoản này, hãy liên hệ trực tiếp với quản trị viên của đơn vị."
                ),
                actionLink
        );
    }

    public static Content forPasswordReset(String actionLink) {
        return build(
                new EmailCopy(
                        "Đặt lại mật khẩu The Serene Villa",
                        "Sử dụng liên kết an toàn để thiết lập mật khẩu The Serene Villa mới.",
                        "Thiết lập mật khẩu mới",
                        "Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn. Hãy sử dụng nút bên dưới để tiếp tục.",
                        "Đặt lại mật khẩu",
                        "Liên kết có hiệu lực trong 30 phút và chỉ sử dụng được một lần.",
                        "Nếu bạn không yêu cầu đặt lại mật khẩu, hãy bỏ qua email này. Mật khẩu hiện tại của bạn sẽ không thay đổi."
                ),
                actionLink
        );
    }

    private static Content build(EmailCopy copy, String actionLink) {
        validateActionLink(actionLink);

        String safeSubject = HtmlUtils.htmlEscape(copy.subject());
        String safePreheader = HtmlUtils.htmlEscape(copy.preheader());
        String safeHeading = HtmlUtils.htmlEscape(copy.heading());
        String safeIntroduction = HtmlUtils.htmlEscape(copy.introduction());
        String safeActionLabel = HtmlUtils.htmlEscape(copy.actionLabel());
        String safeExpirationNotice = HtmlUtils.htmlEscape(copy.expirationNotice());
        String safeSafetyNote = HtmlUtils.htmlEscape(copy.safetyNote());
        String safeActionLink = HtmlUtils.htmlEscape(actionLink);

        String plainText = """
                %s

                %s

                %s: %s

                %s

                %s

                — %s
                """.formatted(
                copy.heading(),
                copy.introduction(),
                copy.actionLabel(),
                actionLink,
                copy.expirationNotice(),
                copy.safetyNote(),
                BRAND_NAME
        );

        String htmlText = """
                <!doctype html>
                <html lang="vi">
                  <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>%s</title>
                    <style>
                      body, table, td, p, a, h1, h2, h3, span, div {
                        -webkit-text-size-adjust: 100%%;
                        -ms-text-size-adjust: 100%%;
                      }
                      .email-copy {
                        font-family: 'Segoe UI', Arial, Helvetica, sans-serif !important;
                        letter-spacing: normal;
                        word-spacing: normal;
                        word-break: normal;
                        overflow-wrap: normal;
                        hyphens: none;
                      }
                      @media only screen and (max-width: 620px) {
                        .email-shell { width: 100%% !important; }
                        .email-pad { padding-left: 24px !important; padding-right: 24px !important; }
                        .email-heading { font-size: 30px !important; line-height: 36px !important; }
                        .email-button { display: block !important; text-align: center !important; }
                      }
                    </style>
                  </head>
                  <body class="email-copy" style="margin:0; padding:0; background-color:#F6F3ED; color:#242A27; font-family:'Segoe UI', Arial, Helvetica, sans-serif; letter-spacing:normal; word-spacing:normal;">
                    <div style="display:none; max-height:0; overflow:hidden; opacity:0; color:transparent;">%s</div>
                    <table role="presentation" width="100%%" cellspacing="0" cellpadding="0" border="0" style="background-color:#F6F3ED;">
                      <tr>
                        <td align="center" style="padding:32px 12px;">
                          <table class="email-shell" role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="width:600px; max-width:600px; background-color:#FFFFFF; border:1px solid #E5DED2; border-radius:20px; overflow:hidden; box-shadow:0 14px 40px rgba(23,58,49,0.10);">
                            <tr>
                              <td class="email-pad" style="padding:38px 44px 34px; background-color:#173A31;">
                                <table role="presentation" width="100%%" cellspacing="0" cellpadding="0" border="0">
                                  <tr>
                                    <td style="vertical-align:middle;">
                                      <div style="display:inline-block; width:42px; height:42px; line-height:42px; text-align:center; border:1px solid rgba(255,255,255,0.35); border-radius:50%%; color:#F6F3ED; font-family:Arial, Helvetica, sans-serif; font-size:14px; font-weight:bold;">SV</div>
                                    </td>
                                    <td align="right" style="vertical-align:middle; color:#D8C5A7; font-size:11px; line-height:16px; letter-spacing:2px; font-weight:bold;">THE SERENE VILLA</td>
                                  </tr>
                                </table>
                                <h1 class="email-heading email-copy" style="margin:30px 0 0; color:#FFFFFF; font-family:'Segoe UI', Arial, Helvetica, sans-serif; font-size:36px; line-height:43px; font-weight:700; letter-spacing:normal; word-spacing:normal; word-break:normal; overflow-wrap:normal; hyphens:none;">%s</h1>
                              </td>
                            </tr>
                            <tr>
                              <td class="email-pad" style="padding:38px 44px 18px;">
                                <p style="margin:0; color:#4E5954; font-size:16px; line-height:27px;">%s</p>
                                <table role="presentation" width="100%%" cellspacing="0" cellpadding="0" border="0">
                                  <tr>
                                    <td style="padding:30px 0 28px;">
                                      <a class="email-button" href="%s" target="_blank" rel="noopener noreferrer" style="display:inline-block; padding:15px 28px; background-color:#B28455; border-radius:10px; color:#FFFFFF; font-size:15px; line-height:20px; font-weight:bold; text-decoration:none;">%s&nbsp;&nbsp;→</a>
                                    </td>
                                  </tr>
                                </table>
                                <table role="presentation" width="100%%" cellspacing="0" cellpadding="0" border="0" style="background-color:#F4F0E8; border-left:3px solid #B28455; border-radius:8px;">
                                  <tr>
                                    <td style="padding:16px 18px; color:#4E5954; font-size:13px; line-height:21px;">
                                      <strong style="color:#173A31;">Vì sự an toàn của bạn:</strong> %s
                                    </td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                            <tr>
                              <td class="email-pad" style="padding:18px 44px 38px;">
                                <p style="margin:0 0 8px; color:#748079; font-size:12px; line-height:19px;">Nếu nút phía trên không hoạt động, hãy sao chép liên kết này vào trình duyệt:</p>
                                <p style="margin:0; word-break:break-all; font-size:12px; line-height:19px;"><a href="%s" target="_blank" rel="noopener noreferrer" style="color:#245545; text-decoration:underline;">%s</a></p>
                                <hr style="margin:28px 0 22px; border:0; border-top:1px solid #E5DED2;">
                                <p style="margin:0; color:#748079; font-size:12px; line-height:20px;">%s</p>
                              </td>
                            </tr>
                            <tr>
                              <td align="center" style="padding:22px 32px; background-color:#EFE9DF; color:#66716B; font-size:11px; line-height:18px;">
                                Email tự động từ %s · Vui lòng không trả lời email này
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </body>
                </html>
                """.formatted(
                safeSubject,
                safePreheader,
                safeHeading,
                safeIntroduction,
                safeActionLink,
                safeActionLabel,
                safeExpirationNotice,
                safeActionLink,
                safeActionLink,
                safeSafetyNote,
                BRAND_NAME
        );

        return new Content(copy.subject(), plainText, htmlText);
    }

    private static void validateActionLink(String actionLink) {
        if (actionLink == null || actionLink.isBlank()) {
            throw new IllegalArgumentException("Lien ket email khong duoc de trong");
        }

        URI uri;
        try {
            uri = new URI(actionLink);
        } catch (URISyntaxException ex) {
            throw new IllegalArgumentException("Lien ket email khong hop le", ex);
        }

        String scheme = uri.getScheme() == null ? "" : uri.getScheme().toLowerCase(Locale.ROOT);
        if (!("http".equals(scheme) || "https".equals(scheme)) || uri.getHost() == null || uri.getHost().isBlank()) {
            throw new IllegalArgumentException("Lien ket email phai la URL HTTP/HTTPS tuyet doi");
        }
    }

    private record EmailCopy(
            String subject,
            String preheader,
            String heading,
            String introduction,
            String actionLabel,
            String expirationNotice,
            String safetyNote
    ) {
    }

    public record Content(String subject, String plainText, String htmlText) {
    }
}
