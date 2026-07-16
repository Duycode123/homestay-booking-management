package backend.payment.application.port.out;

import backend.entity.PaymentTransaction;

/**
 * Serializes state transitions for a booking and one of its payment transactions.
 * Implementations must lock the booking before the payment transaction so every
 * payment entry point uses the same lock order.
 */
public interface LockPaymentAggregatePort {

    void lockAndRefresh(PaymentTransaction transaction);
}
