package backend.payment.adapter.out.sepay;

import backend.config.SePayProperties;
import backend.payment.application.model.SePayCheckoutForm;
import backend.payment.application.port.out.BuildSePayCheckoutPort;
import backend.payment.application.port.out.model.SePayPortalCheckoutRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.net.URI;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class SePayCheckoutAdapter implements BuildSePayCheckoutPort {

    private static final List<String> SIGNED_FIELD_NAMES = List.of(
            "merchant", "env", "operation", "payment_method", "order_amount", "currency",
            "order_invoice_number", "order_description", "customer_id", "agreement_id",
            "agreement_name", "agreement_type", "agreement_payment_frequency",
            "agreement_amount_per_payment", "success_url", "error_url", "cancel_url", "order_id"
    );

    private final SePayProperties properties;

    @Override
    public String buildVietQrUrl(String paymentId, BigDecimal amount) {
        String bankAccount = required(properties.getQrBankAccount(), "Chua cau hinh thong tin QR thanh toan SePay");
        String bankCode = required(properties.getQrBankCode(), "Chua cau hinh thong tin QR thanh toan SePay");

        StringBuilder url = new StringBuilder("https://vietqr.app/img")
                .append("?acc=").append(encode(bankAccount))
                .append("&bank=").append(encode(bankCode))
                .append("&amount=").append(encode(toVndInteger(amount)))
                .append("&des=").append(encode(paymentId));
        String template = blankToNull(properties.getQrTemplate());
        if (template != null) {
            url.append("&template=").append(encode(template));
        }
        return url.toString();
    }

    @Override
    public SePayCheckoutForm buildPortalForm(SePayPortalCheckoutRequest request) {
        String checkoutUrl = required(properties.getCheckoutUrl(), "Chua cau hinh portal checkout SePay");
        Map<String, String> fields = new LinkedHashMap<>();
        putIfPresent(fields, "operation", defaultValue(properties.getOperation(), "PURCHASE"));
        putIfPresent(fields, "payment_method", defaultValue(properties.getMethod(), "BANK_TRANSFER"));
        fields.put("order_invoice_number", request.paymentId());
        fields.put("order_amount", toVndInteger(request.amount()));
        fields.put("currency", defaultValue(properties.getCurrency(), "VND"));
        fields.put("order_description", request.paymentId());
        putIfPresent(fields, "customer_id", request.customerId() == null ? null : String.valueOf(request.customerId()));
        putIfPresent(fields, "success_url", resolveReturnUrl(properties.getSuccessUrl(), request, "success"));
        putIfPresent(fields, "error_url", resolveReturnUrl(properties.getErrorUrl(), request, "failed"));
        putIfPresent(fields, "cancel_url", resolveReturnUrl(properties.getCancelUrl(), request, "cancelled"));
        fields.put("merchant", required(properties.getMerchantId(), "Chua cau hinh merchant SePay"));
        fields.put("signature", createSignature(fields));
        return new SePayCheckoutForm(checkoutUrl, fields);
    }

    private String resolveReturnUrl(String configuredUrl, SePayPortalCheckoutRequest request, String status) {
        String normalized = blankToNull(configuredUrl);
        if (normalized == null) {
            return null;
        }
        String returnUrl = normalized
                .replace("{paymentId}", encode(request.paymentId()))
                .replace("{bookingCode}", encode(request.bookingCode()))
                .replace("{bookingId}", encode(String.valueOf(request.bookingId())))
                .replace("{amount}", encode(request.amount().stripTrailingZeros().toPlainString()))
                .replace("{paymentOption}", encode(request.paymentOption()))
                .replace("{status}", encode(status));
        if (returnUrl.contains("{") || URI.create(returnUrl).getQuery() != null) {
            return returnUrl;
        }
        return returnUrl
                + "?paymentId=" + encode(request.paymentId())
                + "&bookingId=" + encode(request.bookingCode())
                + "&backendBookingId=" + encode(String.valueOf(request.bookingId()))
                + "&method=bank_transfer"
                + "&paymentOption=" + encode(request.paymentOption())
                + "&amount=" + encode(request.amount().stripTrailingZeros().toPlainString())
                + "&status=" + encode(status);
    }

    private String createSignature(Map<String, String> fields) {
        String secretKey = required(properties.getSecretKey(), "Chua cau hinh secret key SePay");
        String data = fields.entrySet().stream()
                .filter(entry -> SIGNED_FIELD_NAMES.contains(entry.getKey()))
                .map(entry -> entry.getKey() + "=" + entry.getValue())
                .reduce((left, right) -> left + "," + right)
                .orElse("");
        try {
            Mac hmac256 = Mac.getInstance("HmacSHA256");
            hmac256.init(new SecretKeySpec(secretKey.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            return Base64.getEncoder().encodeToString(hmac256.doFinal(data.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception exception) {
            throw new IllegalStateException("Cannot create SePay portal signature", exception);
        }
    }

    private void putIfPresent(Map<String, String> fields, String key, String value) {
        String normalized = blankToNull(value);
        if (normalized != null) {
            fields.put(key, normalized);
        }
    }

    private String defaultValue(String value, String fallback) {
        String normalized = blankToNull(value);
        return normalized == null ? fallback : normalized;
    }

    private String required(String value, String message) {
        String normalized = blankToNull(value);
        if (normalized == null) {
            throw new IllegalStateException(message);
        }
        return normalized;
    }

    private String blankToNull(String value) {
        return value == null || value.trim().isBlank() ? null : value.trim();
    }

    private String toVndInteger(BigDecimal amount) {
        return amount.setScale(0, RoundingMode.HALF_UP).toPlainString();
    }

    private String encode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }
}
