package backend.refund.application.port.out;

import backend.refund.domain.model.BookingRefund;

public interface RefundNotificationPort {
    void notifyCompleted(BookingRefund refund);

    void notifyRequiresAttention(BookingRefund refund);
}
