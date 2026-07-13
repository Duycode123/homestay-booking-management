package backend.booking.application.port.out;

import backend.booking.application.model.PageResult;
import backend.booking.application.port.out.model.CustomerBookingHistoryCriteria;
import backend.entity.Booking;

public interface SearchCustomerBookingsPort {
    PageResult<Booking> searchCustomerBookings(CustomerBookingHistoryCriteria criteria);
}
