package backend.payment.application.port.in;

import backend.payment.application.model.PaymentSessionResult;

public interface CreateCheckoutBalancePaymentUseCase {

    PaymentSessionResult createCheckoutBalancePayment(Integer bookingId, String currentUserEmail);
}
