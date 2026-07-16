package backend.payment.application.support;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;

public final class PaymentTimeNormalizer {

    public static final ZoneId SEPAY_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    private PaymentTimeNormalizer() {
    }

    public static LocalDateTime sePayToSystemLocal(LocalDateTime sePayDateTime) {
        return convertLocalDateTime(sePayDateTime, SEPAY_ZONE, ZoneId.systemDefault());
    }

    public static LocalDate systemLocalToSePayDate(LocalDateTime systemDateTime) {
        if (systemDateTime == null) {
            return null;
        }

        return systemDateTime
                .atZone(ZoneId.systemDefault())
                .withZoneSameInstant(SEPAY_ZONE)
                .toLocalDate();
    }

    public static LocalDateTime convertLocalDateTime(
            LocalDateTime value,
            ZoneId sourceZone,
            ZoneId targetZone
    ) {
        if (value == null) {
            return null;
        }

        return value.atZone(sourceZone).withZoneSameInstant(targetZone).toLocalDateTime();
    }
}
