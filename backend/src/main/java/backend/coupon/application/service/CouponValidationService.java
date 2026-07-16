package backend.coupon.application.service;

import backend.coupon.domain.model.CouponValidationResult;
import backend.coupon.domain.model.DiscountCode;
import backend.coupon.domain.model.DiscountType;
import backend.coupon.domain.model.NewCustomerOffer;
import backend.coupon.domain.port.in.GetNewCustomerOfferUseCase;
import backend.coupon.domain.port.in.ValidateCouponCommand;
import backend.coupon.domain.port.in.ValidateCouponUseCase;
import backend.coupon.domain.port.out.LoadDiscountCodePort;
import backend.coupon.domain.port.out.CouponCustomerEligibilityPort;
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
public class CouponValidationService implements ValidateCouponUseCase, GetNewCustomerOfferUseCase {

    private static final int MONEY_SCALE = 2;
    private static final BigDecimal ONE_HUNDRED = BigDecimal.valueOf(100);
    private static final String NEW_CUSTOMER_COUPON_CODE = "SERENE10";

    private final LoadDiscountCodePort loadDiscountCodePort;
    private final CouponCustomerEligibilityPort couponCustomerEligibilityPort;
    private final Clock clock;

    @Override
    @Transactional(readOnly = true)
    public CouponValidationResult validate(ValidateCouponCommand command) {
        String code = normalizeCode(command.code());
        BigDecimal orderAmount = normalizeMoney(command.orderAmount(), "orderAmount");

        return loadDiscountCodePort.findByCode(code)
                .map(discountCode -> validateFoundCoupon(discountCode, orderAmount, command))
                .orElseGet(() -> invalid("Coupon khong ton tai", code, orderAmount));
    }

    @Override
    @Transactional(readOnly = true)
    public NewCustomerOffer getOffer(String customerEmail) {
        return loadDiscountCodePort.findByCode(NEW_CUSTOMER_COUPON_CODE)
                .map(coupon -> buildNewCustomerOffer(coupon, customerEmail))
                .orElseGet(() -> unavailableOffer("Uu dai hien chua kha dung"));
    }

    private NewCustomerOffer buildNewCustomerOffer(DiscountCode coupon, String customerEmail) {
        if (coupon.expiresAt() != null && coupon.expiresAt().isBefore(LocalDate.now(clock))) {
            return unavailableOffer("Uu dai da ket thuc");
        }

        if (coupon.type() != DiscountType.PERCENTAGE) {
            return unavailableOffer("Uu dai dang duoc cap nhat");
        }

        if (customerEmail != null
                && couponCustomerEligibilityPort.hasBookingOtherThan(customerEmail, null)) {
            return unavailableOffer("Tai khoan da co booking truoc do");
        }

        return new NewCustomerOffer(
                true,
                coupon.code(),
                coupon.value().intValue(),
                "Giam 10% cho booking dau tien"
        );
    }

    private NewCustomerOffer unavailableOffer(String message) {
        return new NewCustomerOffer(false, NEW_CUSTOMER_COUPON_CODE, 10, message);
    }

    private CouponValidationResult validateFoundCoupon(
            DiscountCode coupon,
            BigDecimal orderAmount,
            ValidateCouponCommand command
    ) {
        if (coupon.expiresAt() != null && coupon.expiresAt().isBefore(LocalDate.now(clock))) {
            return invalid("Coupon da het han", coupon.code(), orderAmount);
        }

        if (isNewCustomerCoupon(coupon.code())
                && command.customerEmail() != null
                && couponCustomerEligibilityPort.hasBookingOtherThan(
                        command.customerEmail(),
                        command.currentBookingId()
                )) {
            return invalid(
                    "Ma SERENE10 chi ap dung cho booking dau tien cua khach hang",
                    coupon.code(),
                    orderAmount
            );
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

    private boolean isNewCustomerCoupon(String code) {
        return NEW_CUSTOMER_COUPON_CODE.equalsIgnoreCase(code);
    }
}
