package backend.coupon.application.service;

import backend.coupon.domain.model.CouponValidationResult;
import backend.coupon.domain.model.DiscountCode;
import backend.coupon.domain.model.DiscountType;
import backend.coupon.domain.port.in.ValidateCouponCommand;
import backend.coupon.domain.port.in.ValidateCouponUseCase;
import backend.coupon.domain.port.out.LoadDiscountCodePort;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Clock;
import java.time.LocalDate;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class CouponValidationService implements ValidateCouponUseCase {

    private static final int MONEY_SCALE = 2;
    private static final BigDecimal ONE_HUNDRED = BigDecimal.valueOf(100);

    private final LoadDiscountCodePort loadDiscountCodePort;
    private final Clock clock = Clock.systemDefaultZone();

    @Override
    @Transactional(readOnly = true)
    public CouponValidationResult validate(ValidateCouponCommand command) {
        String code = normalizeCode(command.code());
        BigDecimal orderAmount = normalizeMoney(command.orderAmount(), "orderAmount");

        return loadDiscountCodePort.findByCode(code)
                .map(discountCode -> validateFoundCoupon(discountCode, orderAmount))
                .orElseGet(() -> invalid("Coupon khong ton tai", code, orderAmount));
    }

    private CouponValidationResult validateFoundCoupon(DiscountCode coupon, BigDecimal orderAmount) {
        if (coupon.expiresAt() != null && coupon.expiresAt().isBefore(LocalDate.now(clock))) {
            return invalid("Coupon da het han", coupon.code(), orderAmount);
        }

        BigDecimal minOrderValue = moneyOrZero(coupon.minOrderValue());
        if (orderAmount.compareTo(minOrderValue) < 0) {
            return new CouponValidationResult(
                    false,
                    "Don hang chua dat gia tri toi thieu",
                    coupon.code(),
                    coupon.type(),
                    normalizeMoney(coupon.value(), "discountValue"),
                    minOrderValue,
                    orderAmount,
                    BigDecimal.ZERO.setScale(MONEY_SCALE),
                    orderAmount
            );
        }

        BigDecimal discountAmount = calculateDiscount(coupon, orderAmount);
        BigDecimal payableAmount = orderAmount.subtract(discountAmount).max(BigDecimal.ZERO).setScale(MONEY_SCALE, RoundingMode.HALF_UP);

        return new CouponValidationResult(
                true,
                "Coupon hop le",
                coupon.code(),
                coupon.type(),
                normalizeMoney(coupon.value(), "discountValue"),
                minOrderValue,
                orderAmount,
                discountAmount,
                payableAmount
        );
    }

    private BigDecimal calculateDiscount(DiscountCode coupon, BigDecimal orderAmount) {
        BigDecimal discountValue = normalizeMoney(coupon.value(), "discountValue");
        BigDecimal discountAmount = switch (coupon.type()) {
            case PERCENTAGE -> orderAmount.multiply(discountValue).divide(ONE_HUNDRED, MONEY_SCALE, RoundingMode.HALF_UP);
            case FIXED_AMOUNT -> discountValue;
        };

        return discountAmount.min(orderAmount).setScale(MONEY_SCALE, RoundingMode.HALF_UP);
    }

    private CouponValidationResult invalid(String reason, String code, BigDecimal orderAmount) {
        return new CouponValidationResult(
                false,
                reason,
                code,
                null,
                null,
                null,
                orderAmount,
                BigDecimal.ZERO.setScale(MONEY_SCALE),
                orderAmount
        );
    }

    private String normalizeCode(String code) {
        if (code == null || code.isBlank()) {
            throw new IllegalArgumentException("Coupon code khong duoc de trong");
        }
        return code.trim().toUpperCase(Locale.ROOT);
    }

    private BigDecimal normalizeMoney(BigDecimal value, String fieldName) {
        if (value == null) {
            throw new IllegalArgumentException(fieldName + " khong duoc de trong");
        }
        if (value.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException(fieldName + " khong duoc am");
        }
        return value.setScale(MONEY_SCALE, RoundingMode.HALF_UP);
    }

    private BigDecimal moneyOrZero(BigDecimal value) {
        if (value == null) {
            return BigDecimal.ZERO.setScale(MONEY_SCALE);
        }
        return normalizeMoney(value, "minOrderValue");
    }
}
