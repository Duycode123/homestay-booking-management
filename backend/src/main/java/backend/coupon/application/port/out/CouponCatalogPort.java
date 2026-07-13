package backend.coupon.application.port.out;

import backend.coupon.domain.model.DiscountCode;

import java.util.List;
import java.util.Optional;

public interface CouponCatalogPort {
    List<DiscountCode> loadCoupons();

    Optional<DiscountCode> loadCoupon(Integer couponId);

    Optional<DiscountCode> loadCouponByCode(String code);

    boolean hasBookingReference(Integer couponId);

    boolean hasUsage(Integer couponId);
}
