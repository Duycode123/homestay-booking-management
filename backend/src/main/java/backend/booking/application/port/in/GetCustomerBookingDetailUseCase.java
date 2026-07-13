package backend.booking.application.port.in;

import backend.booking.application.port.in.query.GetCustomerBookingDetailQuery;
import backend.dto.response.BookingResponse;

public interface GetCustomerBookingDetailUseCase {

    BookingResponse getCustomerBookingDetail(GetCustomerBookingDetailQuery query);
}
