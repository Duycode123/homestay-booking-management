package backend.booking.application.port.in;

import backend.booking.application.port.in.command.CalculateBookingCostCommand;
import backend.dto.response.BookingCostResponse;

public interface CalculateBookingCostUseCase {
    BookingCostResponse calculateCost(CalculateBookingCostCommand command);
}
