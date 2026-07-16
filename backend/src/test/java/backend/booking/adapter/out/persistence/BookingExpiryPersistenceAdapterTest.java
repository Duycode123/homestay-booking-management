package backend.booking.adapter.out.persistence;

import backend.booking.application.port.out.model.BookingExpiryResult;
import backend.entity.Booking;
import backend.entity.BookingStatus;
import backend.entity.PaymentMethod;
import backend.entity.PaymentProvider;
import backend.entity.PaymentTransaction;
import backend.entity.PaymentTransactionStatus;
import backend.payment.application.port.out.LockPaymentAggregatePort;
import backend.repository.BookingRepository;
import backend.repository.PaymentTransactionRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BookingExpiryPersistenceAdapterTest {

    @Mock
    private BookingRepository bookingRepository;

    @Mock
    private PaymentTransactionRepository paymentTransactionRepository;

    @Mock
    private LockPaymentAggregatePort lockPaymentAggregatePort;

    @Test
    void doesNotCancelPaymentConfirmedWhileExpirySweepWasWaitingForLock() {
        LocalDateTime cutoff = LocalDateTime.of(2026, 7, 16, 10, 0);
        Booking booking = Booking.builder()
                .id(12)
                .status(BookingStatus.PENDING_PAYMENT)
                .paymentMethod(PaymentMethod.ONLINE)
                .createdAt(cutoff.minusMinutes(1))
                .build();
        PaymentTransaction transaction = PaymentTransaction.builder()
                .id(8L)
                .booking(booking)
                .provider(PaymentProvider.SEPAY)
                .transactionReference("PAYRACECONDITION01")
                .amount(new BigDecimal("100000.00"))
                .status(PaymentTransactionStatus.PENDING)
                .createdAt(cutoff.minusSeconds(1))
                .build();

        when(paymentTransactionRepository.findStaleTransactions(any(), any()))
                .thenReturn(List.of(transaction));
        when(bookingRepository.findStalePendingBookings(any(), any(), any()))
                .thenReturn(List.of());
        doAnswer(invocation -> {
            transaction.setStatus(PaymentTransactionStatus.SUCCEEDED);
            booking.setStatus(BookingStatus.PAID);
            return null;
        }).when(lockPaymentAggregatePort).lockAndRefresh(transaction);

        BookingExpiryResult result = new BookingExpiryPersistenceAdapter(
                bookingRepository,
                paymentTransactionRepository,
                lockPaymentAggregatePort
        ).expireBefore(cutoff);

        assertEquals(0, result.expiredBookingCount());
        assertEquals(0, result.expiredTransactionCount());
        assertEquals(PaymentTransactionStatus.SUCCEEDED, transaction.getStatus());
        assertEquals(BookingStatus.PAID, booking.getStatus());
        verify(paymentTransactionRepository, never()).saveAll(any());
        verify(bookingRepository, never()).saveAll(any());
    }
}
