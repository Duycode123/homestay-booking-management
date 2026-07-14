package backend.refund.application.port.out;

import backend.refund.application.model.RefundTransferInstruction;
import backend.refund.domain.model.BookingRefund;

import java.util.Optional;

public interface BuildRefundTransferQrPort {
    Optional<RefundTransferInstruction> build(BookingRefund refund);
}
