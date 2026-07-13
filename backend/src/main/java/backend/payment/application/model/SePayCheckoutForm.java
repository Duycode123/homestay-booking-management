package backend.payment.application.model;

import java.util.Map;

public record SePayCheckoutForm(
        String actionUrl,
        Map<String, String> fields
) {
}
