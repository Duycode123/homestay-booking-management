package backend.controller;

import backend.dto.response.VNPayIpnResponse;
import backend.service.PaymentWebhookService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentWebhookController {

    private final PaymentWebhookService paymentWebhookService;

    @GetMapping("/vnpay/ipn")
    public ResponseEntity<VNPayIpnResponse> handleVNPayIpn(@RequestParam Map<String, String> params) {
        return ResponseEntity.ok(paymentWebhookService.handleVNPayIpn(params));
    }

    @PostMapping("/sepay/webhook")
    public ResponseEntity<Map<String, Object>> handleSepayWebhook(
            @RequestBody String rawBody,
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorizationHeader,
            @RequestHeader(value = "X-SePay-Signature", required = false) String signatureHeader,
            @RequestHeader(value = "X-SePay-Timestamp", required = false) String timestampHeader,
            @RequestHeader(value = "X-Secret-Key", required = false) String secretKeyHeader
    ) {
        Map<String, Object> response = paymentWebhookService.handleSepayWebhook(
                rawBody,
                authorizationHeader,
                signatureHeader,
                timestampHeader,
                secretKeyHeader
        );

        return ResponseEntity.status(resolveSepayStatus(response)).body(response);
    }

    private HttpStatus resolveSepayStatus(Map<String, Object> response) {
        if (Boolean.TRUE.equals(response.get("success"))) {
            return HttpStatus.OK;
        }

        String message = String.valueOf(response.getOrDefault("message", ""));
        if (message.startsWith("Unauthorized") || message.startsWith("Invalid signature")
                || message.startsWith("Request expired")) {
            return HttpStatus.UNAUTHORIZED;
        }

        return HttpStatus.BAD_REQUEST;
    }
}
