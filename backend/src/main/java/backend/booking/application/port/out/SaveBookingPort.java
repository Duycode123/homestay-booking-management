package backend.booking.application.port.out;

import backend.entity.Booking;

public interface SaveBookingPort {
    Booking save(Booking booking);

    Booking saveAndFlush(Booking booking);
}
