package backend.coupon.application.port.in;

import backend.coupon.domain.model.DiscountCode;

import java.util.List;

public interface ListCouponsUseCase {
    List<DiscountCode> getCoupons();
}
