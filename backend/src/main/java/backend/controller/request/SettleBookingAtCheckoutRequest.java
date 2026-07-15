package backend.controller.request;

import backend.booking.application.port.in.command.CheckoutSettlementMethod;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SettleBookingAtCheckoutRequest {

    @NotNull(message = "Phuong thuc thanh toan khong duoc de trong")
    private CheckoutSettlementMethod method;
}
