package backend.booking.application.port.in;

import backend.booking.application.port.in.query.GetBookingManagementDetailQuery;
import backend.dto.response.BookingResponse;

public interface GetBookingManagementDetailUseCase {
    BookingResponse getBookingDetail(GetBookingManagementDetailQuery query);
}
