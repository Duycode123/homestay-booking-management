package backend.booking.adapter.out.persistence;

import backend.booking.application.port.out.ExpireStalePendingBookingsPort;
import backend.booking.application.port.out.model.BookingExpiryResult;
import backend.entity.Booking;
import backend.entity.BookingStatus;
import backend.entity.PaymentMethod;
import backend.entity.PaymentTransaction;
import backend.entity.PaymentTransactionStatus;
import backend.repository.BookingRepository;
import backend.repository.PaymentTransactionRepository;
import backend.payment.application.port.out.LockPaymentAggregatePort;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;
import java.util.LinkedHashMap;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class BookingExpiryPersistenceAdapter implements ExpireStalePendingBookingsPort {

    private final BookingRepository bookingRepository;
    private final PaymentTransactionRepository paymentTransactionRepository;
    private final LockPaymentAggregatePort lockPaymentAggregatePort;

    @Override
    public BookingExpiryResult expireBefore(LocalDateTime cutoff) {
        List<PaymentTransaction> staleTransactions = paymentTransactionRepository.findStaleTransactions(
                List.of(PaymentTransactionStatus.INITIALIZED, PaymentTransactionStatus.PENDING),
                cutoff
        );
        List<PaymentTransaction> expiredTransactions = new java.util.ArrayList<>();
        Map<Integer, Booking> bookingsFromTransactions = new LinkedHashMap<>();

        for (PaymentTransaction transaction : staleTransactions) {
            lockPaymentAggregatePort.lockAndRefresh(transaction);
            if (!isStillExpiredAndOpen(transaction, cutoff)) {
                continue;
            }

            transaction.setStatus(PaymentTransactionStatus.EXPIRED);
            transaction.setResponseCode("PAYMENT_TIMEOUT");
            expiredTransactions.add(transaction);

            Booking booking = transaction.getBooking();
            if (booking != null && booking.getStatus() == BookingStatus.PENDING_PAYMENT) {
                booking.setStatus(BookingStatus.EXPIRED);
                bookingsFromTransactions.put(booking.getId(), booking);
            }
        }
        if (!expiredTransactions.isEmpty()) {
            paymentTransactionRepository.saveAll(expiredTransactions);
            bookingRepository.saveAll(bookingsFromTransactions.values());
        }

        List<Booking> staleBookings = bookingRepository.findStalePendingBookings(
                BookingStatus.PENDING_PAYMENT,
                PaymentMethod.CASH,
                cutoff
        );
        List<Booking> expiredBookingsWithoutTransaction = new java.util.ArrayList<>();
        for (Booking staleBooking : staleBookings) {
            Booking lockedBooking = bookingRepository.findByIdForUpdate(staleBooking.getId()).orElse(null);
            if (lockedBooking == null
                    || lockedBooking.getStatus() != BookingStatus.PENDING_PAYMENT
                    || lockedBooking.getPaymentMethod() == PaymentMethod.CASH
                    || lockedBooking.getCreatedAt() == null
                    || !lockedBooking.getCreatedAt().isBefore(cutoff)) {
                continue;
            }
            lockedBooking.setStatus(BookingStatus.EXPIRED);
            expiredBookingsWithoutTransaction.add(lockedBooking);
        }
        if (!expiredBookingsWithoutTransaction.isEmpty()) {
            bookingRepository.saveAll(expiredBookingsWithoutTransaction);
        }

        return new BookingExpiryResult(
                expiredBookingsWithoutTransaction.size() + bookingsFromTransactions.size(),
                expiredTransactions.size()
        );
    }

    private boolean isStillExpiredAndOpen(PaymentTransaction transaction, LocalDateTime cutoff) {
        return (transaction.getStatus() == PaymentTransactionStatus.INITIALIZED
                || transaction.getStatus() == PaymentTransactionStatus.PENDING)
                && transaction.getCreatedAt() != null
                && transaction.getCreatedAt().isBefore(cutoff);
    }
}
