package backend.booking.application.port.in;

import backend.booking.application.port.in.command.CreateBookingCommand;
import backend.dto.response.BookingResponse;

public interface CreateBookingUseCase {
    BookingResponse createBooking(CreateBookingCommand command);
}
