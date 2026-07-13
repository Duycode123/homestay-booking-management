package backend.payment.application.port.in;

import backend.payment.application.model.PaymentTransactionDetail;

public interface GetPaymentTransactionUseCase {

    PaymentTransactionDetail getPaymentTransactionDetail(String paymentId, String customerEmail);
}
