package backend.refund.adapter.out.vietqr;

import backend.refund.domain.model.BookingRefund;
import backend.refund.domain.model.RefundMethod;
import backend.refund.domain.model.RefundStatus;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

class VietQrRefundTransferAdapterTest {

    private final VietQrRefundTransferAdapter adapter = new VietQrRefundTransferAdapter();

    @Test
    void buildsQrWithExactDestinationAmountAndBookingReference() {
        BookingRefund refund = new BookingRefund(
                1L, 18, "BR00000018", "Nguyen Van A", "customer@example.com", "Deluxe 201",
                "970422", "MB Bank", "0123456789", "NGUYEN VAN A",
                5L, new BigDecimal("500000.00"), RefundMethod.MANUAL_BANK_TRANSFER, RefundStatus.PENDING,
                null, null, null, null, null,
                LocalDateTime.of(2026, 7, 18, 10, 0),
                LocalDateTime.of(2026, 7, 15, 10, 0),
                LocalDateTime.of(2026, 7, 15, 10, 0),
                null, null, 0
        );

        var instruction = adapter.build(refund).orElseThrow();

        assertThat(instruction.content()).isEqualTo("REFUND BR00000018");
        assertThat(instruction.qrUrl())
                .contains("acc=0123456789")
                .contains("bank=970422")
                .contains("amount=500000")
                .contains("des=REFUND+BR00000018");
    }
}
