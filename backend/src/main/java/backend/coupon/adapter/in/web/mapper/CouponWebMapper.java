package backend.coupon.adapter.in.web.mapper;

import backend.coupon.adapter.in.web.dto.ValidateCouponRequest;
import backend.coupon.adapter.in.web.dto.ValidateCouponResponse;
import backend.coupon.domain.model.CouponValidationResult;
import backend.coupon.domain.port.in.ValidateCouponCommand;
import org.springframework.stereotype.Component;

@Component
public class CouponWebMapper {

    public ValidateCouponCommand toCommand(ValidateCouponRequest request) {
        return new ValidateCouponCommand(request.code(), request.orderAmount());
    }

    public ValidateCouponResponse toResponse(CouponValidationResult result) {
        return new ValidateCouponResponse(
                result.valid(),
                result.reason(),
                result.code(),
                result.type(),
                result.discountValue(),
                result.minOrderValue(),
                result.orderAmount(),
                result.discountAmount(),
                result.payableAmount()
        );
    }
}
