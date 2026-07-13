package backend.payment.application.port.in;

import backend.payment.application.model.SePayCheckoutForm;

public interface GetSePayCheckoutFormUseCase {

    SePayCheckoutForm getSePayCheckoutForm(String paymentId, String customerEmail);
}
