package backend.booking.application.port.out;

import backend.entity.PaymentTransaction;

public interface SavePaymentTransactionPort {
    PaymentTransaction savePaymentTransaction(PaymentTransaction transaction);
}
