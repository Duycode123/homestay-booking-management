package backend.service;

import backend.booking.application.port.out.ExpireStalePendingBookingsPort;
import backend.booking.application.port.out.model.BookingExpiryResult;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BookingExpiryServiceTest {

    @Mock
    private ExpireStalePendingBookingsPort expiryPort;

    @Test
    void delegatesExpiryAtConfiguredCutoff() {
        BookingExpiryService service = new BookingExpiryService(expiryPort);
        ReflectionTestUtils.setField(service, "paymentExpirationSeconds", 300L);
        when(expiryPort.expireBefore(org.mockito.ArgumentMatchers.any())).thenReturn(new BookingExpiryResult(1, 1));
        LocalDateTime before = LocalDateTime.now().minusSeconds(301);

        service.expireStalePendingBookings();

        ArgumentCaptor<LocalDateTime> cutoff = ArgumentCaptor.forClass(LocalDateTime.class);
        verify(expiryPort).expireBefore(cutoff.capture());
        assertTrue(cutoff.getValue().isAfter(before));
    }
}
