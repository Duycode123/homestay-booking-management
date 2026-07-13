package backend.booking.application.port.in;

import backend.booking.application.port.in.query.CustomerBookingHistoryQuery;
import backend.dto.response.BookingResponse;
import backend.dto.response.PagedResponse;

public interface GetCustomerBookingHistoryUseCase {
    PagedResponse<BookingResponse> getCustomerBookingHistory(CustomerBookingHistoryQuery query);
}
