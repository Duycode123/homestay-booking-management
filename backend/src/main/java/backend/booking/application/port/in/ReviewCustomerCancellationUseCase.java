package backend.booking.application.port.in;

import backend.booking.application.port.in.command.ReviewCustomerCancellationCommand;
import backend.dto.response.CustomerBookingCancellationResponse;

public interface ReviewCustomerCancellationUseCase {
    CustomerBookingCancellationResponse reviewCustomerCancellation(ReviewCustomerCancellationCommand command);
}
