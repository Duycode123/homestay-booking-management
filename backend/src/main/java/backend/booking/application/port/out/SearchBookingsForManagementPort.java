package backend.booking.application.port.out;

import backend.booking.application.model.PageResult;
import backend.booking.application.port.out.model.BookingManagementSearchCriteria;
import backend.entity.Booking;

import java.util.List;

public interface SearchBookingsForManagementPort {

    List<Booking> loadBookingsForManagement(BookingManagementSearchCriteria criteria);

    PageResult<Booking> searchBookingsForManagement(BookingManagementSearchCriteria criteria);
}
