package backend.booking.application.port.out;

import backend.entity.Booking;
import backend.entity.BookingStatus;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface LoadBookingPort {
    Optional<Booking> loadBooking(Integer bookingId);

    List<Booking> loadBlockingBookings(
            Integer roomId,
            LocalDateTime startTime,
            LocalDateTime endTime,
            BookingStatus cancelledStatus
    );
}
