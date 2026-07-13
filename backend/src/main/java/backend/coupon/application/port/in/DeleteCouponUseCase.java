package backend.coupon.application.port.in;

import backend.coupon.application.port.in.command.DeleteCouponCommand;

public interface DeleteCouponUseCase {
    void deleteCoupon(DeleteCouponCommand command);
}
