package backend.payment.adapter.in.web.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreatePaymentSessionRequest {

    @NotNull(message = "Mã đặt phòng không được để trống")
    @Positive(message = "Mã đặt phòng phải lớn hơn 0")
    private Integer bookingId;

    @NotBlank(message = "Phương thức thanh toán không được để trống")
    @Size(max = 30, message = "Phương thức thanh toán không được vượt quá 30 ký tự")
    private String method;

    @NotBlank(message = "Lựa chọn thanh toán không được để trống")
    @Size(max = 30, message = "Lựa chọn thanh toán không được vượt quá 30 ký tự")
    private String paymentOption;

    @Size(max = 255, message = "Mã giảm giá không được vượt quá 255 ký tự")
    private String couponCode;
}
