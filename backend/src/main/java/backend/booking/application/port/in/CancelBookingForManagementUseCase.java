package backend.booking.application.port.in;

import backend.booking.application.port.in.command.CancelBookingForManagementCommand;
import backend.dto.response.BookingResponse;

public interface CancelBookingForManagementUseCase {
    BookingResponse cancelBooking(CancelBookingForManagementCommand command);
}
