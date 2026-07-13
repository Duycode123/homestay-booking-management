package backend.dto.request;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import backend.entity.PaymentMethod;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CreateBookingRequest {

    private Integer roomId;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private PaymentMethod paymentMethod;
    private String couponCode;
    private String note;
}
