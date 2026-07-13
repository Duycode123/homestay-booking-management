package backend.coupon.application.port.out;

import backend.coupon.domain.model.DiscountCode;

public interface CouponMutationPort {
    DiscountCode save(DiscountCode coupon);

    void deleteCoupon(Integer couponId);
}
