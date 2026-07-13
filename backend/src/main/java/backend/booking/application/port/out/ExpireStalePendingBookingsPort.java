package backend.booking.application.port.out;

import backend.booking.application.port.out.model.BookingExpiryResult;

import java.time.LocalDateTime;

public interface ExpireStalePendingBookingsPort {

    BookingExpiryResult expireBefore(LocalDateTime cutoff);
}
