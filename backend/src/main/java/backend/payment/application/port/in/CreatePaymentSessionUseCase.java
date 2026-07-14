package backend.payment.application.port.in;

import backend.payment.application.model.PaymentSessionResult;

public interface CreatePaymentSessionUseCase {

    PaymentSessionResult createPaymentSession(
            Integer bookingId,
            String method,
            String paymentOption,
            String couponCode,
            String customerEmail
    );
}
