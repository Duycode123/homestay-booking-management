package backend.payment.adapter.in.web;

import backend.common.ApiResponse;
import backend.payment.adapter.in.web.dto.request.CreatePaymentSessionRequest;
import backend.payment.application.model.PaymentSessionResult;
import backend.payment.application.model.PaymentTransactionDetail;
import backend.payment.application.model.SePayCheckoutForm;
import backend.payment.application.service.PaymentCheckoutUseCaseService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentCheckoutUseCaseService paymentCheckoutUseCaseService;

    @PostMapping("/sessions")
    public ResponseEntity<ApiResponse<PaymentSessionResult>> createPaymentSession(
            @RequestBody CreatePaymentSessionRequest request,
            Authentication authentication
    ) {
        PaymentSessionResult data = paymentCheckoutUseCaseService.createPaymentSession(
                request.getBookingId(),
                request.getMethod(),
                request.getPaymentOption(),
                authentication.getName()
        );

        return ResponseEntity.ok(success("Tao phien thanh toan thanh cong", data));
    }

    @GetMapping("/transactions/{paymentId}")
    public ResponseEntity<ApiResponse<PaymentTransactionDetail>> getPaymentTransaction(
            @PathVariable String paymentId,
            Authentication authentication
    ) {
        PaymentTransactionDetail data = paymentCheckoutUseCaseService.getPaymentTransactionDetail(
                paymentId,
                authentication.getName()
        );

        return ResponseEntity.ok(success("Lay giao dich thanh toan thanh cong", data));
    }

    @GetMapping(value = "/sepay/checkout/{paymentId}", produces = MediaType.TEXT_HTML_VALUE)
    public ResponseEntity<String> redirectToSePayPortal(
            @PathVariable String paymentId,
            Authentication authentication
    ) {
        SePayCheckoutForm form = paymentCheckoutUseCaseService.getSePayCheckoutForm(
                paymentId,
                authentication.getName()
        );

        return ResponseEntity.ok()
                .contentType(MediaType.TEXT_HTML)
                .body(renderAutoSubmitForm(form));
    }

    private String renderAutoSubmitForm(SePayCheckoutForm form) {
        StringBuilder html = new StringBuilder();
        html.append("<!DOCTYPE html><html lang=\"vi\"><head><meta charset=\"utf-8\">")
                .append("<title>Chuyển đến cổng thanh toán SePay</title></head>")
                .append("<body onload=\"document.forms[0].submit()\">")
                .append("<p>Đang chuyển đến cổng thanh toán SePay...</p>")
                .append("<form action=\"").append(escapeHtml(form.actionUrl())).append("\" method=\"POST\">");

        for (Map.Entry<String, String> field : form.fields().entrySet()) {
            html.append("<input type=\"hidden\" name=\"").append(escapeHtml(field.getKey()))
                    .append("\" value=\"").append(escapeHtml(field.getValue())).append("\">");
        }

        html.append("<noscript><button type=\"submit\">Tiếp tục thanh toán</button></noscript>")
                .append("</form></body></html>");
        return html.toString();
    }

    private String escapeHtml(String value) {
        return value
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;");
    }

    private <T> ApiResponse<T> success(String message, T data) {
        return ApiResponse.<T>builder()
                .success(true)
                .message(message)
                .data(data)
                .build();
    }
}
