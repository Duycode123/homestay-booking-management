package backend.payment.application.port.in;

public interface ReleasePaymentHoldUseCase {

    void releasePaymentHold(String paymentId, String customerEmail);
}
