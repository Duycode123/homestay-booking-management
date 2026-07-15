package backend.payment.application.exception;

public class PaymentHoldExpiredException extends IllegalStateException {

    public PaymentHoldExpiredException(String message) {
        super(message);
    }
}
