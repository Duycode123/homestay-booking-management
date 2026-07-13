package backend.coupon.adapter.in.web;

import backend.common.ApiResponse;
import backend.coupon.adapter.in.web.dto.ValidateCouponRequest;
import backend.coupon.adapter.in.web.dto.ValidateCouponResponse;
import backend.coupon.adapter.in.web.mapper.CouponWebMapper;
import backend.coupon.domain.model.CouponValidationResult;
import backend.coupon.domain.port.in.ValidateCouponUseCase;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/coupons")
@RequiredArgsConstructor
public class CouponController {

    private final ValidateCouponUseCase validateCouponUseCase;
    private final CouponWebMapper mapper;

    @PostMapping("/validate")
    public ResponseEntity<ApiResponse<ValidateCouponResponse>> validateCoupon(
            @Valid @RequestBody ValidateCouponRequest request
    ) {
        CouponValidationResult result = validateCouponUseCase.validate(mapper.toCommand(request));
        return ResponseEntity.ok(ApiResponse.<ValidateCouponResponse>builder()
                .success(result.valid())
                .message(result.reason())
                .data(mapper.toResponse(result))
                .build());
    }
}
