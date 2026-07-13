package backend.coupon.application.port.in;

import backend.coupon.application.port.in.command.CreateCouponCommand;
import backend.coupon.domain.model.DiscountCode;

public interface CreateCouponUseCase {
    DiscountCode createCoupon(CreateCouponCommand command);
}
