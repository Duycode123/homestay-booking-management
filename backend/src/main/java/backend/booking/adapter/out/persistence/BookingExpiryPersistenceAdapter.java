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
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
public class BookingExpiryPersistenceAdapter implements ExpireStalePendingBookingsPort {

    private final BookingRepository bookingRepository;
    private final PaymentTransactionRepository paymentTransactionRepository;

    @Override
    public BookingExpiryResult expireBefore(LocalDateTime cutoff) {
        List<PaymentTransaction> staleTransactions = paymentTransactionRepository.findStaleTransactions(
                List.of(PaymentTransactionStatus.INITIALIZED, PaymentTransactionStatus.PENDING),
                cutoff
        );
        List<Booking> bookingsFromTransactions = staleTransactions.stream()
                .map(PaymentTransaction::getBooking)
                .filter(booking -> booking.getStatus() == BookingStatus.PENDING_PAYMENT)
                .distinct()
                .toList();

        staleTransactions.forEach(transaction -> {
            transaction.setStatus(PaymentTransactionStatus.CANCELLED);
            transaction.setResponseCode("PAYMENT_TIMEOUT");
        });
        bookingsFromTransactions.forEach(booking -> booking.setStatus(BookingStatus.CANCELLED));
        if (!staleTransactions.isEmpty()) {
            paymentTransactionRepository.saveAll(staleTransactions);
            bookingRepository.saveAll(bookingsFromTransactions);
        }

        List<Booking> staleBookings = bookingRepository.findStalePendingBookings(
                BookingStatus.PENDING_PAYMENT,
                PaymentMethod.CASH,
                cutoff
        );
        staleBookings.forEach(booking -> booking.setStatus(BookingStatus.CANCELLED));
        if (!staleBookings.isEmpty()) {
            bookingRepository.saveAll(staleBookings);
        }

        return new BookingExpiryResult(
                staleBookings.size() + bookingsFromTransactions.size(),
                staleTransactions.size()
        );
    }
}
