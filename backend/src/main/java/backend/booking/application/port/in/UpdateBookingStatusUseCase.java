package backend.booking.application.port.in;

import backend.booking.application.port.in.command.UpdateBookingStatusCommand;
import backend.dto.response.BookingResponse;

public interface UpdateBookingStatusUseCase {
    BookingResponse updateBookingStatus(UpdateBookingStatusCommand command);
}
