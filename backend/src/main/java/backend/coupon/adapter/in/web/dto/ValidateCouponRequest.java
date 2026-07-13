package backend.coupon.adapter.in.web.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record ValidateCouponRequest(
        @NotBlank(message = "Coupon code khong duoc de trong")
        String code,

        @NotNull(message = "orderAmount khong duoc de trong")
        @DecimalMin(value = "0.0", inclusive = false, message = "orderAmount phai lon hon 0")
        BigDecimal orderAmount
) {
}
