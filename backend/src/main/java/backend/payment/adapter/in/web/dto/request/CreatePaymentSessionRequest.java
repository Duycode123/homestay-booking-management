package backend.payment.adapter.in.web.dto.request;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreatePaymentSessionRequest {

    private Integer bookingId;
    private String method;
    private String paymentOption;
}
