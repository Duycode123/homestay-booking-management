package backend.coupon.domain.port.in;

import backend.coupon.domain.model.CouponValidationResult;

public interface ValidateCouponUseCase {
    CouponValidationResult validate(ValidateCouponCommand command);
}
