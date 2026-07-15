package backend.payment.adapter.in.web.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreateCheckoutBalancePaymentRequest {

    @NotNull(message = "bookingId khong duoc de trong")
    private Integer bookingId;
}
