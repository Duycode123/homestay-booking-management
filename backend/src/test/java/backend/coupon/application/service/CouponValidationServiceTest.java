package backend.coupon.application.service;

import backend.coupon.domain.model.DiscountCode;
import backend.coupon.domain.model.DiscountType;
import backend.coupon.domain.port.in.ValidateCouponCommand;
import backend.coupon.domain.port.out.LoadDiscountCodePort;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class CouponValidationServiceTest {

    @Test
    void validateReturnsPercentageDiscount() {
        CouponValidationService service = serviceWith(new DiscountCode(
                1,
                "SUMMER10",
                DiscountType.PERCENTAGE,
                BigDecimal.TEN,
                BigDecimal.valueOf(100000),
                LocalDate.now().plusDays(1)
        ));

        var result = service.validate(new ValidateCouponCommand(" summer10 ", BigDecimal.valueOf(250000)));

        assertTrue(result.valid());
        assertEquals(new BigDecimal("25000.00"), result.discountAmount());
        assertEquals(new BigDecimal("225000.00"), result.payableAmount());
    }

    @Test
    void validateCapsFixedDiscountByOrderAmount() {
        CouponValidationService service = serviceWith(new DiscountCode(
                1,
                "FIXED",
                DiscountType.FIXED_AMOUNT,
                BigDecimal.valueOf(500000),
                BigDecimal.ZERO,
                LocalDate.now().plusDays(1)
        ));

        var result = service.validate(new ValidateCouponCommand("FIXED", BigDecimal.valueOf(200000)));

        assertTrue(result.valid());
        assertEquals(new BigDecimal("200000.00"), result.discountAmount());
        assertEquals(new BigDecimal("0.00"), result.payableAmount());
    }

    @Test
    void validateRejectsExpiredCoupon() {
        CouponValidationService service = serviceWith(new DiscountCode(
                1,
                "OLD",
                DiscountType.PERCENTAGE,
                BigDecimal.TEN,
                BigDecimal.ZERO,
                LocalDate.now().minusDays(1)
        ));

        var result = service.validate(new ValidateCouponCommand("OLD", BigDecimal.valueOf(200000)));

        assertFalse(result.valid());
        assertEquals("Coupon da het han", result.reason());
        assertEquals(new BigDecimal("0.00"), result.discountAmount());
        assertEquals(new BigDecimal("200000.00"), result.payableAmount());
    }

    @Test
    void validateRejectsOrderBelowMinimum() {
        CouponValidationService service = serviceWith(new DiscountCode(
                1,
                "MIN",
                DiscountType.FIXED_AMOUNT,
                BigDecimal.valueOf(50000),
                BigDecimal.valueOf(300000),
                LocalDate.now().plusDays(1)
        ));

        var result = service.validate(new ValidateCouponCommand("MIN", BigDecimal.valueOf(200000)));

        assertFalse(result.valid());
        assertEquals("Don hang chua dat gia tri toi thieu", result.reason());
    }

    @Test
    void validateRejectsMissingCoupon() {
        CouponValidationService service = new CouponValidationService(code -> Optional.empty());

        var result = service.validate(new ValidateCouponCommand("NONE", BigDecimal.valueOf(200000)));

        assertFalse(result.valid());
        assertEquals("Coupon khong ton tai", result.reason());
    }

    @Test
    void validateRejectsBlankCode() {
        CouponValidationService service = new CouponValidationService(code -> Optional.empty());

        assertThrows(IllegalArgumentException.class,
                () -> service.validate(new ValidateCouponCommand(" ", BigDecimal.valueOf(200000))));
    }

    private CouponValidationService serviceWith(DiscountCode discountCode) {
        LoadDiscountCodePort port = code -> Optional.of(discountCode);
        return new CouponValidationService(port);
    }
}
