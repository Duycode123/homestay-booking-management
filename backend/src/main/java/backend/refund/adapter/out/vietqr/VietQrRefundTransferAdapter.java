package backend.refund.adapter.out.vietqr;

import backend.refund.application.model.RefundTransferInstruction;
import backend.refund.application.port.out.BuildRefundTransferQrPort;
import backend.refund.domain.model.BookingRefund;
import org.springframework.stereotype.Component;

import java.math.RoundingMode;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Optional;

@Component
public class VietQrRefundTransferAdapter implements BuildRefundTransferQrPort {

    @Override
    public Optional<RefundTransferInstruction> build(BookingRefund refund) {
        if (refund == null
                || isBlank(refund.recipientBankCode())
                || isBlank(refund.recipientAccountNumber())
                || refund.amount() == null
                || refund.amount().signum() <= 0) {
            return Optional.empty();
        }

        String content = "REFUND " + refund.bookingCode();
        String qrUrl = "https://vietqr.app/img"
                + "?acc=" + encode(refund.recipientAccountNumber())
                + "&bank=" + encode(refund.recipientBankCode())
                + "&amount=" + encode(refund.amount().setScale(0, RoundingMode.HALF_UP).toPlainString())
                + "&des=" + encode(content)
                + "&template=compact";
        return Optional.of(new RefundTransferInstruction(content, qrUrl));
    }

    private String encode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
