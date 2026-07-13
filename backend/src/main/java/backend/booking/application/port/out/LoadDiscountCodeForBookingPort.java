package backend.booking.application.port.out;

import backend.entity.DiscountCode;

import java.util.Optional;

public interface LoadDiscountCodeForBookingPort {
    Optional<DiscountCode> loadDiscountCodeForBooking(String code);
}
