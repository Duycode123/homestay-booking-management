package backend.coupon.application.port.in;

import backend.coupon.application.port.in.query.GetCouponDetailQuery;
import backend.coupon.domain.model.DiscountCode;

public interface GetCouponDetailUseCase {
    DiscountCode getCouponDetail(GetCouponDetailQuery query);
}
