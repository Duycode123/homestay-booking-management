package backend.service;

import backend.booking.application.port.out.ExpireStalePendingBookingsPort;
import backend.booking.application.port.out.model.BookingExpiryResult;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * Auto-cancels PENDING_PAYMENT bookings that stay unpaid past the configured grace period.
 * Without this, an abandoned pending booking would block its room/time slot forever, because
 * both the overlap query and the DB exclusion constraint treat every non-CANCELLED booking as busy.
 */
@Service
@RequiredArgsConstructor
@ConditionalOnProperty(name = "app.booking.expiry-sweep.enabled", havingValue = "true", matchIfMissing = true)
public class BookingExpiryService {

    private static final Logger log = LoggerFactory.getLogger(BookingExpiryService.class);

    private final ExpireStalePendingBookingsPort expireStalePendingBookingsPort;

    @Value("${app.booking.payment-expiration-seconds:300}")
    private long paymentExpirationSeconds;

    @Scheduled(fixedDelayString = "${app.booking.expiry-sweep-interval-ms:10000}")
    @Transactional
    public void expireStalePendingBookings() {
        if (paymentExpirationSeconds <= 0) {
            return;
        }

        LocalDateTime cutoff = LocalDateTime.now().minusSeconds(paymentExpirationSeconds);

        BookingExpiryResult result = expireStalePendingBookingsPort.expireBefore(cutoff);

        if (result.expiredBookingCount() > 0 || result.expiredTransactionCount() > 0) {
            log.info(
                    "Auto-cancelled {} unpaid booking(s) and {} payment transaction(s) older than {} seconds",
                    result.expiredBookingCount(),
                    result.expiredTransactionCount(),
                    paymentExpirationSeconds
            );
        } else {
            log.debug("No stale pending bookings found for cutoff {}", cutoff);
        }
    }
}
