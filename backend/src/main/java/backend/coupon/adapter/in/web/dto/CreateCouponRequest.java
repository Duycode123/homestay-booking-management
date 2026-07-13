package backend.coupon.adapter.in.web.dto;

import backend.coupon.domain.model.DiscountType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;

public record CreateCouponRequest(
        @NotBlank(message = "Ma coupon khong duoc de trong")
        String code,

        @NotNull(message = "Loai coupon khong duoc de trong")
        DiscountType type,

        @NotNull(message = "Gia tri coupon khong duoc de trong")
        @DecimalMin(value = "0.01", message = "Gia tri coupon phai lon hon 0")
        BigDecimal value,

        @DecimalMin(value = "0.00", message = "Gia tri don toi thieu khong duoc am")
        BigDecimal minOrderValue,

        LocalDate expiresAt
) {
}
