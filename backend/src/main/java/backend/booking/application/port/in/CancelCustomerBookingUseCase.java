package backend.booking.application.port.in;

import backend.booking.application.port.in.command.CancelCustomerBookingCommand;
import backend.dto.response.CustomerBookingCancellationResponse;

public interface CancelCustomerBookingUseCase {
    CustomerBookingCancellationResponse cancelCustomerBooking(CancelCustomerBookingCommand command);
}
