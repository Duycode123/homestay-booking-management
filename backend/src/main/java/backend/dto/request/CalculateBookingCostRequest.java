package backend.dto.request;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CalculateBookingCostRequest {

    private Integer roomId;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private String couponCode;
}
