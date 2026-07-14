package backend.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
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

    @NotNull(message = "Mã phòng không được để trống")
    @Positive(message = "Mã phòng phải lớn hơn 0")
    private Integer roomId;

    @NotNull(message = "Thời gian bắt đầu không được để trống")
    private LocalDateTime startTime;

    @NotNull(message = "Thời gian kết thúc không được để trống")
    private LocalDateTime endTime;

    @Size(max = 255, message = "Mã giảm giá không được vượt quá 255 ký tự")
    private String couponCode;
}
