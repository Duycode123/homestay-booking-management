package backend.coupon.application.port.in;

import backend.coupon.application.port.in.command.UpdateCouponCommand;
import backend.coupon.domain.model.DiscountCode;

public interface UpdateCouponUseCase {
    DiscountCode updateCoupon(UpdateCouponCommand command);
}
