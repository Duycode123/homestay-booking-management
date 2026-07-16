package backend.payment.application.support;

import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.time.ZoneOffset;

import static org.junit.jupiter.api.Assertions.assertEquals;

class PaymentTimeNormalizerTest {

    @Test
    void convertsVietnamSePayTimeToRenderUtcTimeline() {
        LocalDateTime sePayTime = LocalDateTime.of(2026, 7, 16, 1, 25, 0);

        LocalDateTime renderTime = PaymentTimeNormalizer.convertLocalDateTime(
                sePayTime,
                PaymentTimeNormalizer.SEPAY_ZONE,
                ZoneOffset.UTC
        );

        assertEquals(LocalDateTime.of(2026, 7, 15, 18, 25, 0), renderTime);
    }
}
