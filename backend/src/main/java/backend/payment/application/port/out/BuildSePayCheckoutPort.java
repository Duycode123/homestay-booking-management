package backend.payment.application.port.out;

import backend.payment.application.model.SePayCheckoutForm;
import backend.payment.application.port.out.model.SePayPortalCheckoutRequest;

import java.math.BigDecimal;

public interface BuildSePayCheckoutPort {

    String buildVietQrUrl(String paymentId, BigDecimal amount);

    SePayCheckoutForm buildPortalForm(SePayPortalCheckoutRequest request);
}
