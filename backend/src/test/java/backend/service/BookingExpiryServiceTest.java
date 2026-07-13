package backend.service;

import backend.entity.Booking;
import backend.entity.BookingStatus;
import backend.entity.PaymentTransaction;
import backend.entity.PaymentTransactionStatus;
import backend.repository.BookingRepository;
import backend.repository.PaymentTransactionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BookingExpiryServiceTest {

    @Mock
    private BookingRepository bookingRepository;

    @Mock
    private PaymentTransactionRepository paymentTransactionRepository;

    private BookingExpiryService bookingExpiryService;

    @BeforeEach
    void setUp() {
        bookingExpiryService = new BookingExpiryService(bookingRepository, paymentTransactionRepository);
        ReflectionTestUtils.setField(bookingExpiryService, "paymentExpirationSeconds", 300L);
    }

    @Test
    void expiresStalePendingPaymentTransactionsAndReleasesHeldBooking() {
        Booking booking = Booking.builder()
                .id(12)
                .status(BookingStatus.PENDING_PAYMENT)
                .build();
        PaymentTransaction transaction = PaymentTransaction.builder()
                .booking(booking)
                .transactionReference("PAY123")
                .amount(new BigDecimal("50000.00"))
                .status(PaymentTransactionStatus.PENDING)
                .createdAt(LocalDateTime.now().minusSeconds(301))
                .build();

        when(paymentTransactionRepository.findStaleTransactions(any(Collection.class), any(LocalDateTime.class)))
                .thenReturn(List.of(transaction));
        when(bookingRepository.findStalePendingBookings(any(BookingStatus.class), any(LocalDateTime.class)))
                .thenReturn(List.of());

        bookingExpiryService.expireStalePendingBookings();

        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<PaymentTransaction>> transactionsCaptor = ArgumentCaptor.forClass(List.class);
        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<Booking>> bookingsCaptor = ArgumentCaptor.forClass(List.class);
        verify(paymentTransactionRepository).saveAll(transactionsCaptor.capture());
        verify(bookingRepository).saveAll(bookingsCaptor.capture());

        assertEquals(PaymentTransactionStatus.CANCELLED, transactionsCaptor.getValue().getFirst().getStatus());
        assertEquals("PAYMENT_TIMEOUT", transactionsCaptor.getValue().getFirst().getResponseCode());
        assertEquals(BookingStatus.CANCELLED, bookingsCaptor.getValue().getFirst().getStatus());
    }
}
