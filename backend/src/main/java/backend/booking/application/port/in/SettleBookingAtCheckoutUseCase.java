package backend.booking.application.port.in;

import backend.booking.application.port.in.command.SettleBookingAtCheckoutCommand;
import backend.dto.response.BookingResponse;

public interface SettleBookingAtCheckoutUseCase {

    BookingResponse settleBookingAtCheckout(SettleBookingAtCheckoutCommand command);
}
